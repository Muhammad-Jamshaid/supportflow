"use client";

import { useState, useRef } from "react";
import { submitPublicReplyAction } from "@/app/actions/public";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function PublicReplyForm({ trackingToken }: { trackingToken: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

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
      toast.error(result.error);
      setLoading(false);
    } else {
      setMessage("");
      setLoading(false);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      toast.success("Reply sent successfully");
      router.refresh();
    }
  }

  return (
    <div style={{ marginTop: "32px", padding: "24px", background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)" }}>
      <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>Add a reply</h3>
      
      {error && <div className="auth-error" style={{ marginBottom: "16px" }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          placeholder="Type your message here..."
          rows={3}
          required
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
