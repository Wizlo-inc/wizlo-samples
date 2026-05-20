import { Module } from '@nestjs/common';
import { PharmaciesModule } from './pharmacies/pharmacies.module';

@Module({ imports: [PharmaciesModule] })
export class AppModule {}
