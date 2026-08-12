"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateProfileName } from "@/app/actions/settings";

export default function ProfileFormClient({ defaultName }: { defaultName: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await updateProfileName(formData);

    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Profile name updated");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "12px", alignItems: "flex-end", padding: 0, border: "none" }}>
      <label className="field" style={{ flex: 1, margin: 0 }}>
        <span className="lbl">Display Name</span>
        <input
          type="text"
          name="name"
          defaultValue={defaultName}
          placeholder="Enter your name"
          className="input"
          style={{ width: "240px" }}
          required
        />
      </label>
      <button type="submit" disabled={loading} className="btn btn-primary" style={{ height: "42px" }}>
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
