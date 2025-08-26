import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from '../storage';
import { nanoid } from 'nanoid';

// Configure Google OAuth Strategy
export function configureGoogleAuth() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.NODE_ENV === 'production' 
    ? process.env.GOOGLE_REDIRECT_URI_PRODUCTION 
    : process.env.GOOGLE_REDIRECT_URI_LOCAL;

  if (!clientID || !clientSecret) {
    console.warn('⚠️ Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
    return;
  }

  passport.use(new GoogleStrategy({
    clientID,
    clientSecret,
    callbackURL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔐 Google OAuth callback received for:', profile.emails?.[0]?.value);

      // Check if user already exists
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email found in Google profile'), null);
      }

      let user = await storage.getUserByEmail(email);

      if (!user) {
        // Create new user
        console.log('👤 Creating new user from Google profile');
        user = await storage.createUser({
          email,
          firstName: profile.name?.givenName || 'User',
          lastName: profile.name?.familyName || '',
          plan: 'free',
          role: 'user',
        });

        // Create default API key for new user
        await storage.createApiKey({
          userId: user.id,
          name: 'Default API Key',
          keyHash: `gsk_${nanoid(32)}`, // Google Sign-in Key
        });

        console.log('✅ New user created:', user.id);
      } else {
        console.log('✅ Existing user logged in:', user.id);
      }

      return done(null, user);
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      return done(error, null);
    }
  }));

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  console.log('🔧 Google OAuth configured successfully');
}

// Middleware to check if user is authenticated
export const requireAuth = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // In demo mode, create a demo user
  if (process.env.DATABASE_ENABLED !== 'true') {
    req.user = {
      id: 'demo-user-1',
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      plan: 'pro',
      role: 'admin',
    };
    return next();
  }
  
  res.status(401).json({ message: 'Authentication required' });
};

// Admin middleware
export const requireAdmin = (req: any, res: any, next: any) => {
  if (process.env.DATABASE_ENABLED !== 'true') {
    return next(); // Allow in demo mode
  }
  
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Get redirect URL based on environment
export function getGoogleRedirectURL(): string {
  return process.env.NODE_ENV === 'production' 
    ? process.env.GOOGLE_REDIRECT_URI_PRODUCTION || ''
    : process.env.GOOGLE_REDIRECT_URI_LOCAL || '';
}

// Google Auth routes
export function setupGoogleAuthRoutes(app: any) {
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth routes
  app.get('/auth/google', 
    passport.authenticate('google', { 
      scope: ['profile', 'email'] 
    })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', { 
      failureRedirect: '/login?error=auth_failed' 
    }),
    (req: any, res: any) => {
      // Successful authentication
      console.log('✅ Google authentication successful');
      res.redirect('/dashboard');
    }
  );

  // Logout route
  app.post('/auth/logout', (req: any, res: any) => {
    req.logout((err: any) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get current user
  app.get('/api/auth/user', requireAuth, (req: any, res: any) => {
    res.json({
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      plan: req.user.plan,
      role: req.user.role,
    });
  });

  console.log('🔧 Google Auth routes configured');
}

// Instructions for Google OAuth Setup
export function printGoogleAuthInstructions() {
  console.log('\n🔧 GOOGLE OAUTH SETUP INSTRUCTIONS:');
  console.log('=====================================');
  console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
  console.log('2. Create a new project or select existing one');
  console.log('3. Enable Google+ API and Google OAuth2 API');
  console.log('4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"');
  console.log('5. Set Application Type to "Web Application"');
  console.log('6. Add Authorized JavaScript Origins:');
  console.log('   - http://localhost:8080 (for local development)');
  console.log('   - https://your-domain.com (for production)');
  console.log('7. Add Authorized Redirect URIs:');
  console.log('   - http://localhost:8080/auth/google/callback (local)');
  console.log('   - https://your-domain.com/auth/google/callback (production)');
  console.log('8. Copy Client ID and Client Secret to your .env file');
  console.log('9. Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
  console.log('\n📝 Required .env variables:');
  console.log('GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"');
  console.log('GOOGLE_CLIENT_SECRET="your-client-secret"');
  console.log('GOOGLE_REDIRECT_URI_LOCAL="http://localhost:8080/auth/google/callback"');
  console.log('GOOGLE_REDIRECT_URI_PRODUCTION="https://your-domain.com/auth/google/callback"');
  console.log('=====================================\n');
}
