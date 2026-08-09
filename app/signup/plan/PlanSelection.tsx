"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PlanSelection({ proPriceId, teamPriceId }: { proPriceId: string, teamPriceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, planName: string) => {
    setLoading(planName);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);
      setLoading(null);
    }
  };

  const handleFree = () => {
    setLoading("Free");
    router.push("/dashboard");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
      
      {/* Free Plan */}
      <div className="panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ fontSize: "18px", fontWeight: 600 }}>Free</div>
        <div style={{ fontSize: "28px", fontWeight: 700 }}>$0<span style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-muted)" }}>/mo</span></div>
        <ul style={{ fontSize: "14px", color: "var(--text-muted)", paddingLeft: "20px", margin: 0, flex: 1 }}>
          <li style={{ marginBottom: "8px" }}>1 agent seat</li>
          <li style={{ marginBottom: "8px" }}>50 tickets / month</li>
          <li style={{ marginBottom: "8px" }}>AI triage included</li>
        </ul>
        <button 
          onClick={handleFree} 
          disabled={!!loading} 
          className="btn btn-ghost" 
          style={{ width: "100%", justifyContent: "center" }}
        >
          {loading === "Free" ? "Continuing..." : "Continue with Free"}
        </button>
      </div>

      {/* Pro Plan */}
      <div className="panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", border: "2px solid var(--brand)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: 600 }}>Pro</div>
          <div style={{ fontSize: "11px", fontWeight: 600, background: "var(--brand-soft)", color: "var(--brand)", padding: "2px 8px", borderRadius: "12px" }}>Most Popular</div>
        </div>
        <div style={{ fontSize: "28px", fontWeight: 700 }}>$29<span style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-muted)" }}>/mo</span></div>
        <ul style={{ fontSize: "14px", color: "var(--text-muted)", paddingLeft: "20px", margin: 0, flex: 1 }}>
          <li style={{ marginBottom: "8px" }}>Up to 10 agent seats</li>
          <li style={{ marginBottom: "8px" }}>Unlimited tickets</li>
          <li style={{ marginBottom: "8px" }}>Analytics dashboard</li>
        </ul>
        <button 
          onClick={() => handleCheckout(proPriceId, "Pro")} 
          disabled={!!loading} 
          className="btn btn-primary" 
          style={{ width: "100%", justifyContent: "center" }}
        >
          {loading === "Pro" ? "Loading..." : "Start Pro"}
        </button>
      </div>

      {/* Team Plan */}
      <div className="panel" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ fontSize: "18px", fontWeight: 600 }}>Team</div>
        <div style={{ fontSize: "28px", fontWeight: 700 }}>$79<span style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-muted)" }}>/mo</span></div>
        <ul style={{ fontSize: "14px", color: "var(--text-muted)", paddingLeft: "20px", margin: 0, flex: 1 }}>
          <li style={{ marginBottom: "8px" }}>Unlimited seats</li>
          <li style={{ marginBottom: "8px" }}>Unlimited tickets</li>
          <li style={{ marginBottom: "8px" }}>Priority support</li>
        </ul>
        <button 
          onClick={() => handleCheckout(teamPriceId, "Team")} 
          disabled={!!loading} 
          className="btn btn-ghost" 
          style={{ width: "100%", justifyContent: "center" }}
        >
          {loading === "Team" ? "Loading..." : "Start Team"}
        </button>
      </div>

    </div>
  );
}
