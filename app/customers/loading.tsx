import React from "react";
import AppShell from "@/app/components/AppShell";
import Sidebar from "@/app/components/Sidebar";
import Panel from "@/app/components/Panel";
import Skeleton from "@/app/components/Skeleton";

export default function Loading() {
  return (
    <AppShell
      sidebar={
        <Sidebar activePath="/customers" />
      }
    >
      <div className="topbar">
        <h2>Customers</h2>
        <div className="topbar-right">
          <Skeleton width="180px" height="32px" borderRadius="8px" />
        </div>
      </div>

      <div className="content">
        <Panel>
          <div className="trow head" style={{ gridTemplateColumns: "1fr 1fr 100px 150px" }}>
            <div>Customer</div>
            <div>Email</div>
            <div>Tickets</div>
            <div>Customer Since</div>
          </div>
          
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="trow" style={{ gridTemplateColumns: "1fr 1fr 100px 150px", alignItems: "center", padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Skeleton width="26px" height="26px" borderRadius="50%" />
                <Skeleton width="120px" height="16px" />
              </div>
              <div><Skeleton width="150px" height="14px" /></div>
              <div><Skeleton width="20px" height="14px" /></div>
              <div><Skeleton width="80px" height="14px" /></div>
            </div>
          ))}
        </Panel>
      </div>
    </AppShell>
  );
}
