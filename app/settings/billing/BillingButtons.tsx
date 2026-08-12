"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

export function UpgradeButton({ priceId, planName }: { priceId: string, planName: string }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
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
    } catch (error: unknown) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Failed to initiate upgrade";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <button onClick={handleUpgrade} disabled={loading} className="btn btn-primary" style={{ width: "100%" }}>
      {loading ? "Loading..." : `Upgrade to ${planName}`}
    </button>
  );
}

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  const handleManage = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Failed to load billing portal";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <button onClick={handleManage} disabled={loading} className="btn" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--ink)" }}>
      {loading ? "Loading..." : "Manage Subscription"}
    </button>
  );
}
