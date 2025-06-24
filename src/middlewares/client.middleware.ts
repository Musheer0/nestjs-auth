import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response } from "express";

@Injectable()
export class ClientAuthMiddleware implements NestMiddleware{
    use(req: Request, res: Response, next: (error?: any) => void) {
        const agent = req.get('user-agent');
        const origin = req.originalUrl;
        console.log(origin,agent)
        next()
    }
}