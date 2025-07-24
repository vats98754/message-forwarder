import session from 'express-session';
import passport from 'passport';
declare global {
  namespace Express {
    interface User {
      profile: passport.Profile;
      accessToken: string;
      refreshToken: string;
    }
    interface Request {
      user?: User;
      logout(callback: (err: any) => void): void;
      isAuthenticated(): boolean;
    }
  }
}
