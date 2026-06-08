import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";

const googleAuthEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const demoUsers = [
  {
    id: "demo-admin",
    name: "Admin Zimeira",
    email: "admin@zimeirahijab.test",
    role: "ADMIN" as const,
  },
  {
    id: "demo-customer",
    name: "Nadia Zimeira",
    email: "customer@zimeirahijab.test",
    role: "CUSTOMER" as const,
  },
];

function getDemoUser(email: string, password?: string) {
  if (process.env.DATABASE_URL || password !== "password123") return null;
  return demoUsers.find((user) => user.email === email) ?? null;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    ...(googleAuthEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials.password) return null;
          const email = credentials.email.trim().toLowerCase();

          try {
            const user = await getPrisma().user.findUnique({
              where: { email },
            });

            if (!user?.password) return null;

            const isValid = await bcrypt.compare(credentials.password, user.password);
            if (!isValid) return null;

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role,
            };
          } catch {
            return getDemoUser(email, credentials.password);
          }
        },
      }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;

      const googleProfile = profile as { email?: string; email_verified?: boolean; name?: string; picture?: string } | undefined;
      const email = googleProfile?.email?.trim().toLowerCase();

      if (!email || googleProfile?.email_verified !== true) return false;

      await getPrisma().user.upsert({
        where: { email },
        update: {
          name: googleProfile.name,
          image: googleProfile.picture,
          emailVerified: new Date(),
        },
        create: {
          email,
          name: googleProfile.name,
          image: googleProfile.picture,
          emailVerified: new Date(),
        },
      });

      return true;
    },
    async jwt({ token, user }) {
      const email = user?.email ?? token.email;
      if (email) {
        try {
          const dbUser = await getPrisma().user.findUnique({
            where: { email },
            select: { id: true, role: true },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        } catch {
          const demoUser = demoUsers.find((item) => item.email === email);
          if (demoUser) {
            token.id = demoUser.id;
            token.role = demoUser.role;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "CUSTOMER" | "ADMIN";
      }
      return session;
    },
  },
};
