"use client";

import { useState } from "react";
import { changeStatusAction } from "@/app/actions/tickets";
import Select from "./Select";

export default function StatusDropdown({ 
  ticketId, 
  currentStatus 
}: { 
  ticketId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("ticketId", ticketId);
    formData.append("newStatus", newStatus);

    await changeStatusAction(formData);
    setLoading(false);
  }

  return (
    <Select
      className="btn btn-ghost btn-sm"
      value={currentStatus}
      onChange={(e) => handleStatusChange(e.target.value)}
      disabled={loading}
      style={{ cursor: "pointer", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
    >
      <option value="OPEN">Open</option>
      <option value="RESOLVED">Resolved</option>
      <option value="CLOSED">Closed</option>
    </Select>
  );
}
