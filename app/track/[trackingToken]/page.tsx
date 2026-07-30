import { prisma } from "@/lib/prisma";
import PublicReplyForm from "./PublicReplyForm";

interface Props {
  params: { trackingToken: string };
}

export default async function TrackTicketPage({ params }: Props) {
  const { trackingToken } = params;

  // The requested query: only selects necessary fields and associated replies.
  // We do NOT include the full company object or agent emails to avoid leaking data.
  const ticket = await prisma.ticket.findUnique({
    where: { trackingToken },
    select: {
      id: true,
      subject: true,
      description: true,
      status: true,
      priority: true,
      createdAt: true,
      company: {
        select: {
          name: true,
        }
      },
      replies: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          message: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              role: true,
            }
          }
        }
      }
    }
  });

  if (!ticket) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center", maxWidth: "480px" }}>
          <div className="logo" style={{ justifyContent: "center", marginBottom: "20px" }}>
            <span className="mark" />
            SupportFlow
          </div>
          <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>Link Invalid or Expired</h1>
          <p className="auth-sub" style={{ marginBottom: "0" }}>
            This link is invalid or has expired. Please check the URL and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ padding: "40px 20px" }}>
      <div style={{ maxWidth: "800px", width: "100%", margin: "0 auto" }}>
        
        <div className="auth-card" style={{ marginBottom: "24px" }}>
          <div className="logo" style={{ marginBottom: "20px" }}>
            <span className="mark" />
            {ticket.company.name} Support
          </div>
          
          <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>{ticket.subject}</h1>
          
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", fontSize: "12px", fontWeight: 500 }}>
            <span style={{ padding: "4px 8px", background: "var(--surface-hover)", borderRadius: "4px", border: "1px solid var(--border)" }}>
              Status: {ticket.status}
            </span>
            <span style={{ padding: "4px 8px", background: "var(--surface-hover)", borderRadius: "4px", border: "1px solid var(--border)" }}>
              Priority: {ticket.priority}
            </span>
          </div>

          <div style={{ 
            padding: "16px", 
            background: "var(--surface)", 
            borderRadius: "8px", 
            border: "1px solid var(--border)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.6
          }}>
            {ticket.description}
          </div>
        </div>

        {ticket.replies.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {ticket.replies.map(reply => {
              const isCustomer = reply.user.role === "CUSTOMER";
              return (
                <div 
                  key={reply.id} 
                  style={{
                    padding: "16px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    marginLeft: isCustomer ? "auto" : "0",
                    marginRight: isCustomer ? "0" : "auto",
                    maxWidth: "85%",
                    position: "relative"
                  }}
                >
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                    <strong>{reply.user.name || "Customer"}</strong>
                    <span>{new Date(reply.createdAt).toLocaleDateString()} {new Date(reply.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {reply.message}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <PublicReplyForm trackingToken={trackingToken} />
        
      </div>
    </div>
  );
}
