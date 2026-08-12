"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Select from "@/app/components/Select";
import { createAgentTicketAction } from "@/app/actions/tickets";

interface Customer {
  id: string;
  name: string | null;
  email: string;
}

export default function NewTicketFormClient({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await createAgentTicketAction(formData);
      if (res.ok && res.ticketId) {
        toast.success("Ticket created successfully");
        router.push(`/tickets/${res.ticketId}`);
      } else {
        toast.error(res.error || "Failed to create ticket");
        setLoading(false);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create ticket");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <label className="field">
        <span className="lbl">Subject</span>
        <input
          type="text"
          name="subject"
          required
          className="input"
          placeholder="Brief description of the issue"
        />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <label className="field">
          <span className="lbl">Customer</span>
          <Select
            name="customerId"
            required
            className="input fselect"
            style={{ cursor: "pointer" }}
          >
            <option value="">Select a customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.email}
              </option>
            ))}
          </Select>
        </label>
        <label className="field">
          <span className="lbl">Priority</span>
          <Select
            name="priority"
            required
            className="input fselect"
            defaultValue="NORMAL"
            style={{ cursor: "pointer" }}
          >
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </Select>
        </label>
      </div>

      <label className="field">
        <span className="lbl">Initial Message</span>
        <textarea
          name="message"
          required
          rows={6}
          className="input"
          style={{ resize: "vertical" }}
          placeholder="Describe the issue in detail..."
        />
      </label>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
        <Link href="/tickets" className="btn btn-ghost">
          Cancel
        </Link>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Creating..." : "Create Ticket"}
        </button>
      </div>
    </form>
  );
}
