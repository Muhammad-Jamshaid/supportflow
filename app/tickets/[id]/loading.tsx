import React from "react";
import AppShell from "@/app/components/AppShell";
import Sidebar from "@/app/components/Sidebar";
import Skeleton from "@/app/components/Skeleton";

export default function Loading() {
  return (
    <AppShell
      sidebar={
        <Sidebar activePath="/tickets" />
      }
    >
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Skeleton width="100px" height="20px" />
        </div>
        <div className="topbar-right">
          <Skeleton width="180px" height="32px" borderRadius="8px" />
        </div>
      </div>

      <div className="content">
        <div className="tdetail">
          <div className="thread">
            <div className="thead">
              <div>
                <Skeleton width="300px" height="24px" style={{ marginBottom: "6px" }} />
                <Skeleton width="150px" height="16px" />
              </div>
              <Skeleton width="80px" height="24px" borderRadius="99px" />
            </div>

            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="msg" style={{ flexDirection: i % 2 === 1 ? "row-reverse" : "row" }}>
                <Skeleton width="34px" height="34px" borderRadius="50%" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, maxWidth: "88%", display: "flex", flexDirection: "column", alignItems: i % 2 === 1 ? "flex-end" : "flex-start" }}>
                  <Skeleton width="150px" height="16px" style={{ marginBottom: "4px" }} />
                  <div className="msg-body" style={{ width: "100%" }}>
                    <Skeleton width="100%" height="16px" style={{ marginBottom: "8px" }} />
                    <Skeleton width="90%" height="16px" style={{ marginBottom: "8px" }} />
                    <Skeleton width="75%" height="16px" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="side-panel">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="spcard">
                <Skeleton width="100px" height="14px" style={{ marginBottom: "16px" }} />
                <Skeleton width="100%" height="14px" style={{ marginBottom: "12px" }} />
                <Skeleton width="100%" height="14px" style={{ marginBottom: "12px" }} />
                <Skeleton width="80%" height="14px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
