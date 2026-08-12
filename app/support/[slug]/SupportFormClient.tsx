"use client";

import { useState, FormEvent, Suspense } from "react";
import { submitTicketAction } from "@/app/actions/public";
import CopyButton from "@/app/components/CopyButton";
import { toast } from "react-hot-toast";

interface Props {
  companyId: string;
  companyName: string;
}

function SubmitForm({ companyId, companyName }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("companyId", companyId);
    formData.append("name", name);
    formData.append("email", email);
    formData.append("subject", subject);
    formData.append("description", description);

    const result = await submitTicketAction(formData);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
    } else {
      if (result.trackingToken) {
        setTrackingToken(result.trackingToken);
      }
      setSuccess(true);
      toast.success("Ticket submitted successfully");
      setLoading(false);
    }
  }

  if (success && trackingToken) {
    const trackingUrl = typeof window !== "undefined" ? `${window.location.origin}/track/${trackingToken}` : "";
    return (
      <div className="auth-card" style={{ textAlign: "center", maxWidth: "480px" }}>
        <div className="logo" style={{ justifyContent: "center", marginBottom: "28px" }}>
          <span className="mark" />
          SupportFlow
        </div>
        <div style={{ fontSize: "32px", marginBottom: "12px", color: "var(--brand)" }}>✓</div>
        <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>Ticket submitted!</h1>
        <p className="auth-sub" style={{ marginBottom: "24px" }}>
          Your request has been received by <strong>{companyName}</strong>.
          Save this link to check your ticket status and replies anytime — no account needed.
        </p>
        
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--surface)",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid var(--border)",
          marginBottom: "24px",
          textAlign: "left"
        }}>
          <input 
            type="text" 
            readOnly 
            value={trackingUrl} 
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: "var(--text)",
              fontSize: "14px",
              outline: "none",
              textOverflow: "ellipsis",
            }}
          />
          <CopyButton text={trackingUrl} />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card" style={{ maxWidth: "520px" }}>
      <div className="logo" style={{ justifyContent: "center", marginBottom: "20px" }}>
        <span className="mark" />
        SupportFlow
      </div>
      <h1 style={{ fontSize: "20px", textAlign: "center", marginBottom: "4px" }}>
        Contact {companyName} Support
      </h1>
      <p className="auth-sub">
        Describe your issue below and we&apos;ll get back to you as soon as possible.
      </p>

      {error && (
        <div className="auth-error" role="alert">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div className="form-group">
            <label htmlFor="sf-name">Your name</label>
            <input
              id="sf-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Kim"
            />
          </div>
          <div className="form-group">
            <label htmlFor="sf-email">Email address <span style={{ color: "var(--brand)" }}>*</span></label>
            <input
              id="sf-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="sf-subject">Subject <span style={{ color: "var(--brand)" }}>*</span></label>
          <input
            id="sf-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="Brief summary of your issue"
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label htmlFor="sf-description">Description <span style={{ color: "var(--brand)" }}>*</span></label>
          <textarea
            id="sf-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Please provide as much detail as possible..."
            rows={5}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "14px",
              fontFamily: "var(--font-inter)",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
        >
          {loading ? "Submitting…" : "Submit ticket"}
        </button>
      </form>
    </div>
  );
}

export default function SupportFormClient({ companyId, companyName }: Props) {
  return (
    <div className="auth-page">
      <Suspense fallback={<div className="auth-card">Loading…</div>}>
        <SubmitForm companyId={companyId} companyName={companyName} />
      </Suspense>
    </div>
  );
}
