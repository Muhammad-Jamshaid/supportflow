"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { updateProfileName } from "@/app/actions/settings";
import { useSession } from "next-auth/react";

export default function ProfileFormClient({ defaultName }: { defaultName: string }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(defaultName);
  const { update } = useSession();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Name cannot be empty");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.set("name", trimmedName);
    const res = await updateProfileName(formData);

    if (res?.error) {
      toast.error(res.error);
    } else {
      // Update the NextAuth JWT session so the sidebar/header reflects the new name
      await update({ name: trimmedName });
      toast.success("Profile name updated!");
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
          value={name}
          onChange={(e) => setName(e.target.value)}
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
