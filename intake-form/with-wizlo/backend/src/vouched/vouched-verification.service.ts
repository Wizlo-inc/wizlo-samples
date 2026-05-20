import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { WizloService } from '../wizlo/wizlo.service';
import {
  CheckPriorVerificationDto,
  VouchedVerifyDto,
  VouchedIdvResultDto,
  VerificationResponse,
} from './dto/vouched-verify.dto';

interface CrossCheckApiResponse {
  id?: string;
  result?: {
    confidences?: { identity?: number };
  };
  errors?: Array<{ type: string; message: string }>;
}

interface DobVerifyApiResponse {
  id?: string;
  result?: {
    dobMatch?: boolean;
  };
  errors?: Array<{ type: string; message: string }>;
}

interface JobApiResponse {
  result?: {
    success?: boolean;
    confidence?: number;
    id?: Record<string, unknown>;
  };
  errors?: Array<{ type: string; message: string }>;
}

// Wizlo patient record uses isVerified ("NOTVERIFIED" | "VERIFIED") and vouchedJobId
interface WizloPatientRecord {
  isVerified?: string;
  vouchedJobId?: string | null;
  [key: string]: unknown;
}

const MATCH_THRESHOLD = 0.85;

@Injectable()
export class VouchedVerificationService {
  constructor(private readonly wizlo: WizloService) {}

  private get privateKey(): string {
    return process.env.VOUCHED_PRIVATE_KEY!;
  }

  private async vouchedPost<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.privateKey,
      },
      body: JSON.stringify(body),
    });
    return res.json() as Promise<T>;
  }

  // Read the patient's Vouched verification status from Wizlo
  private async readPatientVerification(patientId: string): Promise<WizloPatientRecord> {
    return this.wizlo.request<WizloPatientRecord>(`/clients/${patientId}`);
  }

  // Persist verification result back to the Wizlo patient record
  private async persistVerification(patientId: string, jobId?: string): Promise<void> {
    try {
      await this.wizlo.request(`/clients/${patientId}`, {
        method: 'PUT',
        body: JSON.stringify({
          isVerified: 'VERIFIED',
          ...(jobId && { vouchedJobId: jobId }),
        }),
      });
    } catch {
      // Non-fatal: verification status update failed but the check itself passed
    }
  }

  getPublicConfig(): { publicKey: string; callbackURL: string } {
    const publicKey = process.env.VOUCHED_PUBLIC_KEY;
    if (!publicKey) {
      throw new BadRequestException('Vouched public key is not configured for this tenant');
    }
    return {
      publicKey,
      callbackURL: process.env.VOUCHED_CALLBACK_URL ?? '',
    };
  }

  // Reads the Wizlo patient record and returns immediately if already verified,
  // so the frontend can skip the full IDV flow.
  async checkPriorVerification(dto: CheckPriorVerificationDto): Promise<VerificationResponse> {
    const patient = await this.readPatientVerification(dto.patientId);
    const verified = patient.isVerified === 'VERIFIED';
    return { verified, method: verified ? 'prior' : undefined, skipped: verified };
  }

  async verify(dto: VouchedVerifyDto): Promise<VerificationResponse> {
    // Step 1 — CrossCheck (name + phone + email)
    const crosscheck = await this.vouchedPost<CrossCheckApiResponse>(
      process.env.VOUCHED_CROSSCHECK_API_URL!,
      {
        firstName: dto.firstName,
        lastName: dto.lastName,
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.email && { email: dto.email }),
        ...(dto.dob && { dob: dto.dob }),
      },
    );

    const crosscheckErrors = (crosscheck.errors ?? []).filter(e => e.type !== 'LowConfidence');
    const crosscheckRate = crosscheck.result?.confidences?.identity ?? 0;

    if (!crosscheckErrors.length && crosscheckRate >= MATCH_THRESHOLD) {
      await this.persistVerification(dto.patientId);
      return { verified: true, method: 'crosscheck', matchRate: crosscheckRate };
    }

    // Step 2 — DOB verify fallback
    if (dto.dob) {
      const dob = await this.vouchedPost<DobVerifyApiResponse>(
        process.env.VOUCHED_DOB_VERIFY_API_URL!,
        {
          firstName: dto.firstName,
          lastName: dto.lastName,
          ...(dto.phone && { phone: dto.phone }),
          dob: dto.dob,
        },
      );

      const dobErrors = (dob.errors ?? []).filter(e => e.type !== 'LowConfidence');

      if (!dobErrors.length && dob.result?.dobMatch === true) {
        await this.persistVerification(dto.patientId);
        return { verified: true, method: 'dob' };
      }
    }

    // Step 3 — Both API checks failed; frontend must render the Vouched IDV widget
    // VOUCHED_SKIP_IDV=true bypasses the camera/selfie step for local development
    if (process.env.VOUCHED_SKIP_IDV === 'true') {
      return { verified: true, method: 'dev_bypass' };
    }
    return { verified: false, requiresIdv: true };
  }

  async saveIdvResult(dto: VouchedIdvResultDto): Promise<VerificationResponse> {
    const identifier = dto.jobId ?? dto.token;
    if (!identifier || !/^[A-Za-z0-9_-]+$/.test(identifier)) {
      throw new BadRequestException('Invalid Vouched job identifier');
    }
    const jobApiBaseUrl = process.env.VOUCHED_JOB_API_URL;
    if (!jobApiBaseUrl) {
      throw new BadRequestException('Vouched job API URL is not configured for this tenant');
    }
    const jobUrl = new URL(`${jobApiBaseUrl.replace(/\/+$/, '')}/${encodeURIComponent(identifier)}`);
    const res = await fetch(jobUrl.toString(), {
      headers: { 'X-Api-Key': this.privateKey },
    });
    const job = await res.json() as JobApiResponse;

    const verified = !!(job.result?.success && !(job.errors ?? []).length);
    if (verified) {
      await this.persistVerification(dto.patientId, identifier);
    }
    return { verified, method: 'idv', jobId: identifier, result: job.result };
  }

  handleWebhook(rawBody: Buffer | undefined, signature: string): { received: boolean; jobId?: string } {
    if (!rawBody || !signature) {
      throw new UnauthorizedException('Missing webhook payload or signature header');
    }

    const expected = 'sha1=' + createHmac('sha1', this.privateKey).update(rawBody).digest('hex');
    if (expected !== signature) {
      throw new UnauthorizedException('Webhook signature verification failed');
    }

    const payload = JSON.parse(rawBody.toString('utf-8')) as { id?: string };
    return { received: true, jobId: payload?.id };
  }
}
