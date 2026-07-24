import "next-auth";
import "next-auth/jwt";

// Extend the built-in session/user types to include our custom fields.
// This gives us full TypeScript type safety when accessing session.user.role, etc.

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      companyId: string;
    };
  }

  interface User {
    role?: string;
    companyId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    companyId?: string;
  }
}
