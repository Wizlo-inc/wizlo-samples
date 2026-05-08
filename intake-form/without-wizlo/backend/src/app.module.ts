import { Module } from '@nestjs/common';
import { IntakeModule } from './intake/intake.module';

@Module({ imports: [IntakeModule] })
export class AppModule {}
