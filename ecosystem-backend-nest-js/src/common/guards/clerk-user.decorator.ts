import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestFromClerkAuthGuard } from './clerk-auth.guard';

// ดึง Type มาจากข้างใน user
export type ClerkUserData = RequestFromClerkAuthGuard['user'];

export const ClerkUser = createParamDecorator(
  (data: keyof ClerkUserData | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<RequestFromClerkAuthGuard>();
    const user = request.user;
    if (data && user) {
      return user[data];
    }
    return user;
  },
);
