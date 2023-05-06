import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class BaseMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        try {
            next();
        } catch (err) {
            const status = err.getStatus() || 503;
            const message = err.message || 'Internal Server Error';
            res.status(status).json({ message });
        }
    }
}