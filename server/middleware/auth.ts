import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
    plan?: string;
    role?: string;
  };
  apiKey?: {
    id: string;
    userId: string;
  };
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!req.isAuthenticated() || !user?.claims || user.claims.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'API key required' });
  }

  const apiKey = authHeader.substring(7);
  if (!apiKey.startsWith('ocr_')) {
    return res.status(401).json({ message: 'Invalid API key format' });
  }

  try {
    // Hash the API key and look it up
    const crypto = require('crypto');
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    const apiKeyRecord = await storage.getApiKeyByHash(keyHash);
    if (!apiKeyRecord) {
      return res.status(401).json({ message: 'Invalid API key' });
    }

    // Get the user
    const user = await storage.getUser(apiKeyRecord.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user and API key info to request
    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email || undefined,
      plan: user.plan || 'free',
      role: user.role || 'user',
    };
    (req as AuthenticatedRequest).apiKey = {
      id: apiKeyRecord.id,
      userId: apiKeyRecord.userId,
    };

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};
