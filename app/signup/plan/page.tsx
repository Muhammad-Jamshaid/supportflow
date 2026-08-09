import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PlanSelection } from "./PlanSelection";

export default async function SignupPlanPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { plan: true },
  });

  // If they somehow already have a paid plan (e.g. existing user signing in via /signup), skip this.
  if (company?.plan !== "FREE") {
    redirect("/dashboard");
  }

  return (
    <div className="auth-page" style={{ padding: "40px 20px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
        <h1 style={{ fontSize: "28px", textAlign: "center", marginBottom: "8px" }}>
          Choose your plan
        </h1>
        <p className="auth-sub" style={{ textAlign: "center", marginBottom: "40px" }}>
          You can change this later at any time.
        </p>

        <PlanSelection 
          proPriceId={process.env.STRIPE_PRO_PRICE_ID!} 
          teamPriceId={process.env.STRIPE_TEAM_PRICE_ID!} 
        />
      </div>
    </div>
  );
}
