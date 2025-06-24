import { ExecutionContext, Injectable } from "@nestjs/common";
import { ThrottlerException, ThrottlerGuard, ThrottlerLimitDetail } from "@nestjs/throttler";

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard{
    protected async getTracker(req:Record<string,any>){
        const email = req.body?.email;
        return`login-${email}`
    }
    protected getLimit(){
        return Promise.resolve(4)
    }
    protected getTtl(){
        return Promise.resolve(60000)
    }
    protected async throwThrottlingException(): Promise<void> {
        throw new ThrottlerException("too many login attempts try again after 1 min")
    }
}