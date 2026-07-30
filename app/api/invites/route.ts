import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can send invites" }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Prevent inviting existing users in this workspace
  const existing = await prisma.user.findFirst({
    where: { email: normalizedEmail, companyId: session.user.companyId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists in your workspace." },
      { status: 409 }
    );
  }

  // Invalidate any previously unused invite for this email + company
  await prisma.inviteToken.updateMany({
    where: {
      email: normalizedEmail,
      companyId: session.user.companyId,
      usedAt: null,
    },
    data: { usedAt: new Date() }, // mark old ones as "used" to invalidate
  });

  // Generate a cryptographically random, URL-safe token
  const token = randomBytes(32).toString("hex"); // 64 char hex string
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

  await prisma.inviteToken.create({
    data: {
      token,
      email: normalizedEmail,
      role: "AGENT",
      companyId: session.user.companyId,
      expiresAt,
    },
  });

  // Return the full invite URL so the admin can copy and share it
  const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const inviteUrl = `${origin}/invite/${token}`;

  return NextResponse.json({ inviteUrl }, { status: 201 });
}
