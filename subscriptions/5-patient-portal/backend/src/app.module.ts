import { Module } from '@nestjs/common';
import { PortalModule } from './portal/portal.module';

@Module({ imports: [PortalModule] })
export class AppModule {}
