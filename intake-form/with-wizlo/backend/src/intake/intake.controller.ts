import { Controller, Post, Body } from '@nestjs/common';
import { IntakeService } from './intake.service';
import { SubmitIntakeDto } from './dto/submit-intake.dto';

@Controller('intake')
export class IntakeController {
  constructor(private readonly intakeService: IntakeService) {}

  @Post('submit')
  submit(@Body() dto: SubmitIntakeDto) {
    return this.intakeService.submit(dto);
  }
}
