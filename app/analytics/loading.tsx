import React from "react";
import AppShell from "@/app/components/AppShell";
import Sidebar from "@/app/components/Sidebar";
import Skeleton from "@/app/components/Skeleton";

export default function Loading() {
  return (
    <AppShell
      sidebar={
        <Sidebar activePath="/analytics" />
      }
    >
      <div className="topbar">
        <h2>Analytics</h2>
        <div className="topbar-right">
          <Skeleton width="120px" height="32px" borderRadius="99px" />
        </div>
      </div>

      <div className="content">
        <div className="stats">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat">
              <div className="slabel"><Skeleton width="60%" height="14px" /></div>
              <div className="sval" style={{ margin: "8px 0" }}><Skeleton width="40px" height="28px" /></div>
              <div className="sdelta"><Skeleton width="80%" height="12px" /></div>
            </div>
          ))}
        </div>

        <div className="chart-row" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", marginBottom: "20px" }}>
          <div className="chart-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
            <h3><Skeleton width="180px" height="18px" style={{ marginBottom: "6px" }} /></h3>
            <div className="chart-sub"><Skeleton width="140px" height="12px" style={{ marginBottom: "20px" }} /></div>
            <Skeleton width="100%" height="140px" borderRadius="4px" />
          </div>

          <div className="chart-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
            <h3><Skeleton width="140px" height="18px" style={{ marginBottom: "6px" }} /></h3>
            <div className="chart-sub"><Skeleton width="100px" height="12px" style={{ marginBottom: "20px" }} /></div>
            <div style={{ display: "flex", gap: "20px", alignItems: "center", marginTop: "14px" }}>
              <Skeleton width="110px" height="110px" borderRadius="50%" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                <Skeleton width="100%" height="12px" />
                <Skeleton width="80%" height="12px" />
                <Skeleton width="90%" height="12px" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
