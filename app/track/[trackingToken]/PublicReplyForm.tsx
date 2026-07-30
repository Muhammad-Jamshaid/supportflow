"use client";

import { useState } from "react";
import { submitPublicReplyAction } from "@/app/actions/public";

export default function PublicReplyForm({ trackingToken }: { trackingToken: string }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("trackingToken", trackingToken);
    formData.append("message", message);

    const result = await submitPublicReplyAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setMessage("");
      setLoading(false);
      // Let the page reload or mutate to see the new reply.
      // Since it's a server component displaying the replies,
      // window.location.reload() is the simplest way for a public form.
      window.location.reload();
    }
  }

  return (
    <div style={{ marginTop: "32px", padding: "24px", background: "var(--surface)", borderRadius: "8px", border: "1px solid var(--border)" }}>
      <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>Add a reply</h3>
      
      {error && <div className="auth-error" style={{ marginBottom: "16px" }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          rows={4}
          required
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "6px",
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: "14px",
            fontFamily: "var(--font-inter)",
            resize: "vertical",
            marginBottom: "12px",
            boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? "Sending..." : "Send reply"}
          </button>
        </div>
      </form>
    </div>
  );
}
