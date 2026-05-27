import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [WizloModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
