import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class InMemoryRateLimiter {
  private store: RateLimitStore = {};
  private limits = {
    free: { requests: 10, window: 60 * 1000 }, // 10 requests per minute
    pro: { requests: 30, window: 60 * 1000 }, // 30 requests per minute
    business: { requests: 60, window: 60 * 1000 }, // 60 requests per minute
  };

  isAllowed(userId: string, plan: string = 'free'): boolean {
    const now = Date.now();
    const limit = this.limits[plan as keyof typeof this.limits] || this.limits.free;
    
    if (!this.store[userId]) {
      this.store[userId] = {
        count: 1,
        resetTime: now + limit.window,
      };
      return true;
    }

    const userLimit = this.store[userId];
    
    // Reset if window has passed
    if (now > userLimit.resetTime) {
      userLimit.count = 1;
      userLimit.resetTime = now + limit.window;
      return true;
    }

    // Check if under limit
    if (userLimit.count < limit.requests) {
      userLimit.count++;
      return true;
    }

    return false;
  }

  getRemainingRequests(userId: string, plan: string = 'free'): number {
    const limit = this.limits[plan as keyof typeof this.limits] || this.limits.free;
    const userLimit = this.store[userId];
    
    if (!userLimit || Date.now() > userLimit.resetTime) {
      return limit.requests;
    }
    
    return Math.max(0, limit.requests - userLimit.count);
  }

  getResetTime(userId: string): number {
    const userLimit = this.store[userId];
    return userLimit ? userLimit.resetTime : Date.now();
  }
}

const rateLimiter = new InMemoryRateLimiter();

export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const userId = authReq.user.id;
  const plan = authReq.user.plan || 'free';

  if (!rateLimiter.isAllowed(userId, plan)) {
    const resetTime = rateLimiter.getResetTime(userId);
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    
    res.set({
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': resetTime.toString(),
      'Retry-After': retryAfter.toString(),
    });
    
    return res.status(429).json({
      message: 'Rate limit exceeded',
      retryAfter,
      upgradeUrl: '/pricing',
    });
  }

  // Set rate limit headers
  const remaining = rateLimiter.getRemainingRequests(userId, plan);
  const resetTime = rateLimiter.getResetTime(userId);
  
  res.set({
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetTime.toString(),
  });

  next();
};
