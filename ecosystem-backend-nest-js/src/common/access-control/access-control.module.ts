import { Module, Global } from '@nestjs/common';
import { AccessControlService } from './access-control.service';

@Global() // 🌟 แปะป้าย Global
@Module({
  providers: [AccessControlService],
  exports: [AccessControlService],
})
export class AccessControlModule {}
