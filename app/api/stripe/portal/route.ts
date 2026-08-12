import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const companyId = session.user.companyId;
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { stripeCustomerId: true },
    });

    if (!company || !company.stripeCustomerId) {
      return new NextResponse("Company or Stripe Customer not found", { status: 404 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/settings/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Stripe Portal Error:", error);
    return new NextResponse(message, { status: 500 });
  }
}
