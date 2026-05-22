import { Module } from '@nestjs/common';
import { EncountersModule } from './encounters/encounters.module';

@Module({ imports: [EncountersModule] })
export class AppModule {}
