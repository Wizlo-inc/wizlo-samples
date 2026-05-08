import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [WizloModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
