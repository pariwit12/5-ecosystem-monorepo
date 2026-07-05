import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { AccessControlModule } from './common/access-control/access-control.module';

import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PersonModule } from './modules/person/person.module';
import { WorkScheduleModule } from './modules/work-schedule/work-schedule.module';

@Module({
  imports: [
    PrismaModule,
    AccessControlModule,

    WebhooksModule,
    OrganizationsModule,
    PersonModule,
    WorkScheduleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
