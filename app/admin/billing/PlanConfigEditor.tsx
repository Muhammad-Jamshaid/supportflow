"use client";

import { updatePlanConfigAction } from "@/app/actions/admin";
import { PlanConfig } from "@prisma/client";
import { useState } from "react";

export default function PlanConfigEditor({ configs }: { configs: PlanConfig[] }) {
  const [loading, setLoading] = useState<string | null>(null);

  const plans = ["FREE", "PRO", "TEAM"] as const;

  const handleUpdate = async (formData: FormData, plan: string) => {
    setLoading(plan);
    try {
      await updatePlanConfigAction(formData);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {plans.map(plan => {
        const config = configs.find(c => c.plan === plan);
        return (
          <form 
            key={plan}
            action={(fd) => handleUpdate(fd, plan)}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              padding: "16px", 
              border: "1px solid var(--border)", 
              borderRadius: "8px" 
            }}
          >
            <input type="hidden" name="plan" value={plan} />
            <div style={{ width: "80px", fontWeight: 600 }}>{plan}</div>
            
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <label style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                Seats:
                <input 
                  name="maxSeats" 
                  type="number" 
                  defaultValue={config?.maxSeats ?? ""} 
                  placeholder="Unlimited"
                  className="input"
                  style={{ width: "100px" }}
                />
              </label>
              
              <label style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                Tickets:
                <input 
                  name="maxTickets" 
                  type="number" 
                  defaultValue={config?.maxTickets ?? ""} 
                  placeholder="Unlimited"
                  className="input"
                  style={{ width: "100px" }}
                />
              </label>
            </div>
            
            <button 
              type="submit" 
              disabled={loading === plan}
              className="btn btn-primary btn-sm"
            >
              {loading === plan ? "Saving..." : "Save"}
            </button>
          </form>
        );
      })}
    </div>
  );
}
