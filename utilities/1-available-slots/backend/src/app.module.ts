import { Module } from '@nestjs/common';
import { SlotsModule } from './slots/slots.module';

@Module({ imports: [SlotsModule] })
export class AppModule {}
