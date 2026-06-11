import { Controller, Post, Body } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { UploadFromUrlDto } from './dto/upload-from-url.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  /**
   * POST /documents/upload-from-url
   * Body: { patientId, documentType, url, fileName? }
   *
   * Proxies POST /clients-documents/:patientId/upload-url/:documentType.
   */
  @Post('upload-from-url')
  uploadFromUrl(@Body() dto: UploadFromUrlDto) {
    return this.service.uploadFromUrl(dto);
  }
}
