"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

interface Props {
  token: string;
  email: string;
  companyName: string;
}

export default function AcceptInviteForm({ token, email, companyName }: Props) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, name }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="logo" style={{ justifyContent: "center", marginBottom: "24px" }}>
          <span className="mark" />
          SupportFlow
        </div>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>✓</div>
        <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>Account created!</h1>
        <p className="auth-sub" style={{ marginBottom: "24px" }}>
          You&apos;ve joined <strong>{companyName}</strong> as an Agent.
          Sign in to access your workspace.
        </p>
        <Link href="/login" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
          Sign in now
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="logo" style={{ justifyContent: "center", marginBottom: "24px" }}>
        <span className="mark" />
        SupportFlow
      </div>
      <h1 style={{ fontSize: "20px", textAlign: "center", marginBottom: "4px" }}>
        Join {companyName}
      </h1>
      <p className="auth-sub">
        You&apos;ve been invited as an Agent. Set a password to activate your account.
      </p>

      {error && <div className="auth-error" role="alert">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="inv-email">Email</label>
          <input
            id="inv-email"
            type="email"
            value={email}
            disabled
            style={{ opacity: 0.6, cursor: "not-allowed" }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="inv-name">Your name (optional)</label>
          <input
            id="inv-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Kim"
          />
        </div>

        <div className="form-group">
          <label htmlFor="inv-password">Password <span style={{ color: "var(--brand)" }}>*</span></label>
          <input
            id="inv-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>

        <div className="form-group">
          <label htmlFor="inv-confirm">Confirm password <span style={{ color: "var(--brand)" }}>*</span></label>
          <input
            id="inv-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="Repeat your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
