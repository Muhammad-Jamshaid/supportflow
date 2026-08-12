import React from "react";
import Panel from "@/app/components/Panel";
import Skeleton from "@/app/components/Skeleton";

export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Panel title="Team Members">
        <div style={{ padding: "0 18px" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Skeleton width="26px" height="26px" borderRadius="50%" />
                <div>
                  <Skeleton width="120px" height="16px" style={{ marginBottom: "6px" }} />
                  <Skeleton width="150px" height="14px" />
                </div>
              </div>
              <Skeleton width="60px" height="24px" borderRadius="6px" />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
