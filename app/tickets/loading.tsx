import React from "react";
import AppShell from "@/app/components/AppShell";
import Sidebar from "@/app/components/Sidebar";
import Panel from "@/app/components/Panel";
import Skeleton from "@/app/components/Skeleton";

export default function Loading() {
  return (
    <AppShell
      sidebar={
        <Sidebar activePath="/tickets" />
      }
    >
      <div className="topbar">
        <h2>Tickets</h2>
        <div className="topbar-right">
          <Skeleton width="200px" height="32px" borderRadius="8px" />
          <Skeleton width="80px" height="32px" borderRadius="7px" />
        </div>
      </div>

      <div className="content">
        <Panel>
          <div className="trow head" style={{ gridTemplateColumns: "70px 1fr 110px 100px 130px 90px" }}>
            <div>ID</div>
            <div>Ticket</div>
            <div>Category</div>
            <div>Priority</div>
            <div>Assigned</div>
            <div>Updated</div>
          </div>
          
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="trow" style={{ gridTemplateColumns: "70px 1fr 110px 100px 130px 90px", padding: "16px 18px" }}>
              <Skeleton width="50px" height="16px" />
              <div>
                <Skeleton width="200px" height="18px" style={{ marginBottom: "6px" }} />
                <Skeleton width="120px" height="12px" />
              </div>
              <Skeleton width="60px" height="16px" />
              <Skeleton width="60px" height="20px" borderRadius="99px" />
              <Skeleton width="80px" height="16px" />
              <Skeleton width="40px" height="16px" />
            </div>
          ))}
        </Panel>
      </div>
    </AppShell>
  );
}
