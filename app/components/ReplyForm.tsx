"use client";

import { useState, useRef, FormEvent } from "react";
import { createReplyAction } from "@/app/actions/tickets";

export default function ReplyForm({ ticketId }: { ticketId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createReplyAction(formData);

    if (result.error) {
      setError(result.error);
    } else {
      formRef.current?.reset();
    }
    setLoading(false);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="reply-box">
      {error && <div style={{ color: "red", marginBottom: "8px", fontSize: "14px" }}>{error}</div>}
      <input type="hidden" name="ticketId" value={ticketId} />
      <textarea 
        name="message" 
        placeholder="Type your reply..." 
        required 
        disabled={loading}
      />
      <div className="rb-actions">
        <div style={{ flex: 1 }} />
        <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
          {loading ? "Sending..." : "Send reply"}
        </button>
      </div>
    </form>
  );
}
