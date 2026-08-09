"use client";

import { useState, useRef, FormEvent } from "react";
import { createReplyAction } from "@/app/actions/tickets";

export default function ReplyForm({ ticketId, aiSuggestedReply }: { ticketId: string; aiSuggestedReply?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("ticketId", ticketId);
    formData.append("message", message);

    const result = await createReplyAction(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setMessage("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      formRef.current?.reset();
    }
    setLoading(false);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} style={{ marginTop: "32px", padding: "24px", background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)" }}>
      {error && <div style={{ color: "red", marginBottom: "16px", fontSize: "14px" }}>{error}</div>}
      <input type="hidden" name="ticketId" value={ticketId} />
      <textarea 
        ref={textareaRef}
        name="message" 
        placeholder="Type your reply..." 
        required 
        disabled={loading}
        value={message}
        onChange={handleInput}
        rows={3}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: "8px",
          border: "1px solid var(--border-strong)",
          background: "var(--bg)",
          color: "var(--text)",
          fontSize: "14px",
          fontFamily: "var(--font-inter)",
          resize: "none",
          overflow: "hidden",
          minHeight: "80px",
          marginBottom: "16px",
          boxSizing: "border-box",
          lineHeight: "1.6",
          outline: "none",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "var(--brand)";
          e.target.style.boxShadow = "0 0 0 2px var(--brand-soft)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "var(--border-strong)";
          e.target.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
        }}
      />
      <div className="rb-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", gap: "8px", alignItems: "center" }}>
          {aiSuggestedReply && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: "12px", fontWeight: 500, color: "var(--brand)", display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px" }}
              onClick={() => {
                setMessage(aiSuggestedReply);
                if (textareaRef.current) {
                  // Small delay to let React update value first
                  setTimeout(() => {
                    if (textareaRef.current) {
                      textareaRef.current.style.height = "auto";
                      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                    }
                  }, 0);
                }
              }}
            >
              <svg style={{ width: "14px", height: "14px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Use AI Suggestion
            </button>
          )}
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Sending..." : "Send reply"}
        </button>
      </div>
    </form>
  );
}
