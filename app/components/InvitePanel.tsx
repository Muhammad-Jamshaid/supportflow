"use client";

import { useState, FormEvent } from "react";

export default function InvitePanel() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInviteUrl("");

    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create invite.");
    } else {
      setInviteUrl(data.inviteUrl);
      setEmail("");
    }
    setLoading(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
        Invite a team member as an Agent. They&apos;ll get a link to set their password
        and join your workspace. Links expire in 72 hours.
      </p>

      {error && (
        <div
          style={{
            background: "hsl(0 80% 95%)",
            border: "1px solid hsl(0 60% 85%)",
            color: "hsl(0 70% 40%)",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleInvite} style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
        <div className="form-group" style={{ flex: 1, margin: 0 }}>
          <label htmlFor="invite-email" style={{ fontSize: "13px" }}>Email address</label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="agent@yourcompany.com"
            required
            style={{ marginTop: "6px" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-sm"
          style={{ flexShrink: 0 }}
        >
          {loading ? "Sending…" : "Send invite"}
        </button>
      </form>

      {inviteUrl && (
        <div
          style={{
            background: "var(--surface-2, var(--surface))",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Invite link generated
          </div>
          <div
            className="mono"
            style={{
              fontSize: "12px",
              wordBreak: "break-all",
              color: "var(--ink)",
              padding: "8px 10px",
              background: "var(--bg)",
              borderRadius: "6px",
              border: "1px solid var(--border)",
            }}
          >
            {inviteUrl}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={copyLink}
              className="btn btn-ghost btn-sm"
            >
              {copied ? "✓ Copied!" : "Copy link"}
            </button>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Expires in 72 hours · AGENT role
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
