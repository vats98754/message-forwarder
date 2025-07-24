import session from 'express-session';
import passport from 'passport';

declare global {
  namespace Express {
    interface User {
      profile?: passport.Profile;
      accessToken?: string;
      refreshToken?: string;
      service?: string;
      id?: string;
      displayName?: string;
      username?: string;
      emails?: Array<{ value: string; verified?: boolean }>;
    }
    
    interface Request {
      user?: User;
      logout(callback: (err: any) => void): void;
      isAuthenticated(): boolean;
    }
  }
}
