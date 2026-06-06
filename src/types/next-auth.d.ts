import type { DefaultSession, DefaultUser } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';

type UserRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'HEAD_ADMIN';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      twoFactorEnabled?: boolean;
      emailVerified?: Date | null;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: UserRole;
    twoFactorEnabled?: boolean;
    emailVerified?: Date | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
  }
}
