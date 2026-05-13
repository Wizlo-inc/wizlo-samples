import { Module } from '@nestjs/common';
import { AutopayModule } from './autopay/autopay.module';

@Module({ imports: [AutopayModule] })
export class AppModule {}
