import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { token, password, name } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  // Look up the token
  const invite = await prisma.inviteToken.findUnique({ where: { token } });

  if (!invite) {
    return NextResponse.json({ error: "Invite link is invalid." }, { status: 404 });
  }
  if (invite.usedAt) {
    return NextResponse.json({ error: "This invite link has already been used." }, { status: 410 });
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite link has expired." }, { status: 410 });
  }

  // Check if this email already has an account in this company
  const existing = await prisma.user.findFirst({
    where: { email: invite.email, companyId: invite.companyId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account for this email already exists. Please sign in." },
      { status: 409 }
    );
  }

  const passwordHash = await hash(password, 12);

  // Create the AGENT user
  await prisma.user.create({
    data: {
      email: invite.email,
      name: name?.trim() || null,
      passwordHash,
      role: invite.role,
      companyId: invite.companyId,
    },
  });

  // Mark token as used (single-use)
  await prisma.inviteToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  return NextResponse.json({ message: "Account created. You can now sign in." }, { status: 201 });
}
