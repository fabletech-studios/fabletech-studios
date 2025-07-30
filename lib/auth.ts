import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// Admin credentials from environment
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@fabletech.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Fallback for development

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Authorize called
        
        if (!credentials?.email || !credentials?.password) {
          // Missing credentials
          return null;
        }

        // Check if it's the admin
        if (credentials.email === ADMIN_EMAIL) {
          // Check if password is hashed or plain text
          let isValid = false;
          
          if (ADMIN_PASSWORD.startsWith('$2')) {
            // Password is already hashed
            isValid = await bcrypt.compare(credentials.password, ADMIN_PASSWORD);
          } else {
            // Password is plain text (for initial setup)
            isValid = credentials.password === ADMIN_PASSWORD;
          }
          
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
  debug: false, // Set to true only during development
};

// Helper to generate password hash (run this to create new passwords)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}