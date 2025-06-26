import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Storage } from "@prisma/client";

export const UserStorage = createParamDecorator((data:unknown, ctx:ExecutionContext)=>{
    const req = ctx.switchToHttp().getRequest();
if (req.storage && typeof req.storage.storage_used === 'number') {
  return req.storage as Storage;
}

    return null
})