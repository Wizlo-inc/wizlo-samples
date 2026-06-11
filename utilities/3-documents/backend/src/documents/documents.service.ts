import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { UploadFromUrlDto } from './dto/upload-from-url.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly wizlo: WizloService) {}

  /**
   * Server-side "upload from URL": Wizlo fetches the remote file and stores it
   * against the patient's profile, returning a document record + signed URL.
   *
   * Wizlo: POST /clients-documents/:id/upload-url/:documentType
   * Body:  { url, fileName? }
   */
  uploadFromUrl(dto: UploadFromUrlDto) {
    const endpoint =
      `/clients-documents/${encodeURIComponent(dto.patientId)}` +
      `/upload-url/${encodeURIComponent(dto.documentType)}`;
    return this.wizlo.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ url: dto.url, fileName: dto.fileName }),
    });
  }
}
