import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, companyName } = body;

    // ── Validation ─────────────────────────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // ── Create Company + Admin User ─────────────────────────────────────────
    const passwordHash = await hash(password, 12);

    // Each signup creates a new Company, making the registering user its ADMIN.
    const company = await prisma.company.create({
      data: {
        name: companyName || `${(name || email).split("@")[0]}'s Company`,
      },
    });

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email: email.toLowerCase(),
        passwordHash,
        role: "ADMIN",
        companyId: company.id,
      },
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: { id: user.id, email: user.email, companyId: user.companyId },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SIGNUP ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
