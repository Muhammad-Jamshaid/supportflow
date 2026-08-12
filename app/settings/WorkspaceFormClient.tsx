"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { updateWorkspaceName } from "@/app/actions/settings";

export default function WorkspaceFormClient({ defaultName }: { defaultName: string }) {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState(defaultName);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = companyName.trim();
    if (!trimmed) {
      toast.error("Workspace name cannot be empty");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.set("companyName", trimmed);
    const res = await updateWorkspaceName(formData);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Workspace name updated!");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="kv" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
      <span className="k" style={{ minWidth: "140px" }}>Workspace name</span>
      <div style={{ display: "flex", flex: 1, gap: "12px" }}>
        <input
          type="text"
          name="companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Acme Inc."
          className="input"
          style={{ flex: 1, margin: 0 }}
          required
        />
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
