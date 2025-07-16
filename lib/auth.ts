import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// For demo purposes, we're using hardcoded values
// The password is "admin123"
const ADMIN_EMAIL = 'admin@fabletech.com';
const ADMIN_PASSWORD_HASH = '$2b$10$gfVeitGUILqsBnqyJDJF.eAJgsekt72.8Vd40O7FSI94hWCOFbkma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('Authorize called with:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        // Check if it's the admin
        if (credentials.email === ADMIN_EMAIL) {
          console.log('Email matches admin, checking password...');
          const isValid = await bcrypt.compare(credentials.password, ADMIN_PASSWORD_HASH);
          console.log('Password valid:', isValid);
          
          if (isValid) {
            return {
              id: '1',
              email: ADMIN_EMAIL,
              name: 'Admin',
              role: 'admin'
            };
          }
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-change-in-production',
  debug: true, // Enable debug mode to see more logs
};

// Helper to generate password hash (run this to create new passwords)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}