import { Request, Response, NextFunction } from 'express';

module.exports = func => {
    return (req: Request, res: Response, next: NextFunction) => {
        func(req, res, next).catch(next);
    }
}