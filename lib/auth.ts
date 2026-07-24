import type { NextRequest } from "next/server";
import type { AuthOptions, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// ─────────────────────────────────────────────────────────────────────────────
// NextAuth Options
// ─────────────────────────────────────────────────────────────────────────────

export const authOptions: AuthOptions = {
  // Use JWT sessions (no DB adapter needed for session storage)
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    // ── Google OAuth ──────────────────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ── Email / Password ──────────────────────────────────────────────────────
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        const passwordValid = await compare(credentials.password, user.passwordHash);
        if (!passwordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
        };
      },
    }),
  ],

  callbacks: {
    // ── JWT callback: embed role + companyId into the token ───────────────────
    async jwt({ token, user, account }) {
      // On initial sign-in, `user` is populated
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.companyId = (user as any).companyId;
      }

      // Google OAuth: first sign-in — look up or create the user in DB
      if (account?.provider === "google" && token.email) {
        const dbUser = await upsertGoogleUser(
          token.email as string,
          token.name as string | undefined
        );
        token.id = dbUser.id;
        token.role = dbUser.role;
        token.companyId = dbUser.companyId;
      }

      return token;
    },

    // ── Session callback: expose role + companyId to the client session ───────
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string;
      }
      return session;
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Google User Upsert
// Creates a new Company + ADMIN User on first Google sign-in.
// On subsequent sign-ins, returns the existing user.
// ─────────────────────────────────────────────────────────────────────────────

async function upsertGoogleUser(email: string, name?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  // Auto-create a company for this new Google user
  const company = await prisma.company.create({
    data: {
      name: name ? `${name}'s Company` : `${email.split("@")[0]}'s Company`,
    },
  });

  const newUser = await prisma.user.create({
    data: {
      email,
      name: name ?? null,
      role: "ADMIN",
      companyId: company.id,
    },
  });

  return newUser;
}

// ─────────────────────────────────────────────────────────────────────────────
// getScopedUser
//
// A reusable helper for API routes and Server Components.
// Returns the authenticated user's id, companyId, and role from the session.
// Use this to scope all database queries to the correct tenant.
//
// Usage (API Route):
//   const scoped = await getScopedUser();
//   if (!scoped) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   const tickets = await prisma.ticket.findMany({ where: { companyId: scoped.companyId } });
// ─────────────────────────────────────────────────────────────────────────────

export async function getScopedUser(_req?: NextRequest): Promise<{
  id: string;
  companyId: string;
  role: string;
} | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.companyId || !session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    companyId: session.user.companyId,
    role: session.user.role,
  };
}
