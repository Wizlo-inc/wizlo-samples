import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';

@Module({
  imports: [WizloModule],
  controllers: [FormsController],
  providers: [FormsService],
})
export class FormsModule {}
