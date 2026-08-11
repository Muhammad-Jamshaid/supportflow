import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { completeSetup } from "@/app/actions/setup";

export default async function SetupPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.companyId) {
    redirect("/login");
  }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
  });

  if (!company) {
    redirect("/login");
  }

  if (!company.needsOnboarding) {
    redirect("/signup/plan");
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo" style={{ justifyContent: "center", marginBottom: "28px" }}>
          <span className="mark" />
          SupportFlow
        </div>

        <h1 style={{ fontSize: "22px", textAlign: "center", marginBottom: "6px" }}>
          Complete your profile
        </h1>
        <p className="auth-sub">
          Tell us a bit more to finish setting up your workspace
        </p>

        <form action={completeSetup}>
          <div className="form-group">
            <label htmlFor="name">Your name</label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={session.user.name || ""}
              required
              autoComplete="name"
              placeholder="Sana Khan"
            />
          </div>
          <div className="form-group">
            <label htmlFor="companyName">Company name</label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              placeholder="Acme Inc."
            />
          </div>
          
          <button
            id="setup-submit"
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: "12px" }}
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
