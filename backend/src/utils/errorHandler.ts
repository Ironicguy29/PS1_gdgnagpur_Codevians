import { Request, Response, NextFunction } from 'express';
import { log } from './logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    log(err.message, 'error');
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
