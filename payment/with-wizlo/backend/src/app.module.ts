import { Module } from '@nestjs/common';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { Gr4vyModule } from './gr4vy/gr4vy.module';

@Module({ imports: [SubscriptionsModule, Gr4vyModule] })
export class AppModule {}
