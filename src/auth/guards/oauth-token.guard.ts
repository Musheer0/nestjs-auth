import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class OAuthFrontEndCallback implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('token ')) {
      return false;
    }

    const token = authHeader.split('token ')[1];

    const oauth = await this.prisma.oauthLoginTemp.findUnique({
      where: { id: token },
    });

    if (!oauth) return false;
    if (oauth.expiresAt < new Date()) return false;
    req.oauth = {
      token: oauth.token,
      expires: oauth.expiresAt,
    };

    return true;
  }
}
