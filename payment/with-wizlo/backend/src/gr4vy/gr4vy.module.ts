import { Module } from '@nestjs/common';
import { Gr4vyService } from './gr4vy.service';
import { Gr4vyController } from './gr4vy.controller';

@Module({
  controllers: [Gr4vyController],
  providers: [Gr4vyService],
})
export class Gr4vyModule {}
