import { RequestHandler } from 'express';
import session from 'express-session';

// Simple authentication middleware for demo mode
export const isAuthenticated: RequestHandler = (req, res, next) => {
  // In demo mode (database disabled), bypass authentication with demo user
  if (process.env.DATABASE_ENABLED !== 'true') {
    console.log('🎭 [DEMO MODE] Bypassing authentication with demo user');
    (req as any).user = {
      claims: {
        sub: 'demo-user-1',
        email: 'demo@example.com',
        name: 'Demo User',
        given_name: 'Demo',
        family_name: 'User',
      }
    };
    return next();
  }
  
  // In production mode, check session
  const user = (req as any).session?.user;
  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  (req as any).user = { claims: user };
  next();
};

// Admin middleware
export const requireAdmin: RequestHandler = (req, res, next) => {
  // In demo mode, allow admin access
  if (process.env.DATABASE_ENABLED !== 'true') {
    return next();
  }
  
  const user = (req as any).user?.claims;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Session configuration
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'demo-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Simple login endpoint for demo
export const loginHandler: RequestHandler = (req, res) => {
  const { email, password } = req.body;
  
  // Demo login - accept any credentials
  if (process.env.DATABASE_ENABLED !== 'true') {
    const demoUser = {
      sub: 'demo-user-1',
      email: email || 'demo@example.com',
      name: 'Demo User',
      given_name: 'Demo',
      family_name: 'User',
      role: 'admin',
    };
    
    (req as any).session.user = demoUser;
    return res.json({ user: demoUser, message: 'Demo login successful' });
  }
  
  // Production login would validate credentials here
  res.status(401).json({ message: 'Invalid credentials' });
};

// Logout handler
export const logoutHandler: RequestHandler = (req, res) => {
  (req as any).session.destroy((err: any) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
};
