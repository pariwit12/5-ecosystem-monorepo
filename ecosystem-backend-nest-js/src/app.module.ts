import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { AccessControlModule } from './common/access-control/access-control.module';

import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PersonsModule } from './modules/persons/persons.module';

@Module({
  imports: [
    PrismaModule,
    AccessControlModule,

    WebhooksModule,
    OrganizationsModule,
    PersonsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
