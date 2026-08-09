import { prisma } from "@/lib/prisma";
import PublicReplyForm from "./PublicReplyForm";
import Avatar from "@/app/components/Avatar";

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
      customerId: true,
      customer: {
        select: {
          name: true,
          email: true,
        }
      },
      company: {
        select: {
          name: true,
        }
      },
      replies: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          userId: true,
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
        </div>

        {/* Thread */}
        <div className="thread" style={{ marginTop: "24px" }}>
          
          <div className="msg viewer">
            <Avatar name={ticket.customer.name || "Customer"} />
            <div className="msg-body">
              <div className="msg-info">
                <strong>{ticket.customer.name || "Customer"}</strong>
                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="msg-content" style={{ whiteSpace: "pre-wrap" }}>
                {ticket.description}
              </div>
            </div>
          </div>

          {ticket.replies.map(reply => {
            const isViewer = reply.userId === ticket.customerId;
            const isAgentOrAdmin = reply.user.role === "AGENT" || reply.user.role === "ADMIN";
            return (
              <div key={reply.id} className={`msg ${isViewer ? "viewer" : ""}`}>
                <Avatar name={reply.user.name || "User"} />
                <div className="msg-body">
                  <div className="msg-info">
                    <strong>{reply.user.name || "User"}</strong>
                    {isAgentOrAdmin && <span className="agent-badge">Agent</span>}
                    <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="msg-content" style={{ whiteSpace: "pre-wrap" }}>
                    {reply.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <PublicReplyForm trackingToken={trackingToken} />
        
      </div>
    </div>
  );
}
