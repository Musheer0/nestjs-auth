import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

/**
 * Guard for routes that should only be accessible by public users (not logged in).
 */
@Injectable()
export class PublicAuthRoute implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req: Request = context.switchToHttp().getRequest();
    const token = req.headers['authorization'];

    // If token exists, block access (user is logged in)
    if (token) {
      throw new UnauthorizedException('Already logged in — access denied for public route 🤚');
    }

    return true; // Allow access for guests
  }
}
