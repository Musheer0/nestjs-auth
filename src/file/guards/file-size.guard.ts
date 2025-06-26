import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { FileUploadDto } from "../dto/file-upload.dto";
import { STORAGE_LIMIT } from "src/libs/utils";

@Injectable()
export class FileSizeChecker implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const body: FileUploadDto = req.body;
    if (!user || !user.id || !body?.size) return false;

    const storage = await this.prisma.storage.findFirst({
      where: {
        user_id: user.id,
        storage_used: { lt: STORAGE_LIMIT },
      },
    });

    if (!storage) return false;
    if (storage.storage_used + body.size > STORAGE_LIMIT) return false;

    req.storage = storage; 
    return true;
  }
}
