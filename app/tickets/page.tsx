import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ticketWhere } from "@/lib/ticket-rbac";
import { Prisma, TicketStatus, TicketPriority } from "@prisma/client";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";
import Sidebar from "@/app/components/Sidebar";
import Panel from "@/app/components/Panel";
import Pill, { priorityVariant } from "@/app/components/Pill";
import DarkModeToggle from "@/app/components/DarkModeToggle";
import TicketFilters from "@/app/components/TicketFilters";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Valid enum guards — prevents arbitrary strings reaching Prisma
// ─────────────────────────────────────────────────────────────────────────────
const VALID_STATUSES   = new Set<string>(["OPEN", "RESOLVED", "CLOSED"]);
const VALID_PRIORITIES = new Set<string>(["LOW", "NORMAL", "HIGH", "URGENT"]);

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
interface PageProps {
  searchParams: {
    q?:        string;
    status?:   string;
    priority?: string;
    assignee?: string;
    page?:     string;
  };
}

export default async function TicketsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isCustomer = session.user.role === "CUSTOMER";

  // ── Parse & sanitize URL params ─────────────────────────────────────────
  const rawQ        = (searchParams.q        ?? "").trim();
  const rawStatus   = (searchParams.status   ?? "").toUpperCase();
  const rawPriority = (searchParams.priority ?? "").toUpperCase();
  const rawAssignee = (searchParams.assignee ?? "").trim();
  const page        = Math.max(1, Number(searchParams.page) || 1);

  const statusFilter   = VALID_STATUSES.has(rawStatus)     ? (rawStatus   as TicketStatus)   : null;
  const priorityFilter = VALID_PRIORITIES.has(rawPriority) ? (rawPriority as TicketPriority) : null;
  // Customers cannot filter by assignee — ignore the param entirely
  const assigneeFilter = !isCustomer && rawAssignee ? rawAssignee : null;

  // ── Build RBAC-scoped where clause ───────────────────────────────────────
  // ticketWhere(session) always runs first. Additional filters can only
  // NARROW the RBAC-scoped set — they can never remove the companyId or
  // (for CUSTOMER) the customerId constraint.
  const where: Prisma.TicketWhereInput = {
    // ── RBAC base: { companyId } or { companyId, customerId, archived:false }
    ...ticketWhere(session),

    // ── Optional narrowing filters ────────────────────────────────────────
    ...(statusFilter   ? { status:   statusFilter   } : {}),
    ...(priorityFilter ? { priority: priorityFilter } : {}),

    // Assignee: "unassigned" is a magic value meaning assignedAgentId IS NULL
    ...(assigneeFilter === "unassigned"
      ? { assignedAgentId: null }
      : assigneeFilter
        ? { assignedAgentId: assigneeFilter }
        : {}),

    // ── Full-text search: subject OR customer.name ────────────────────────
    // This OR is INSIDE the same Prisma where object, so Prisma emits:
    //   WHERE company_id = $1 [AND customer_id = $2]   ← RBAC (always present)
    //         AND (subject ILIKE $3 OR customer.name ILIKE $3)
    // The RBAC pins cannot be removed by any search value.
    ...(rawQ
      ? {
          OR: [
            { id: { contains: rawQ.replace('#', '').toLowerCase() } },
            { subject:  { contains: rawQ, mode: "insensitive" as const } },
            { customer: { name: { contains: rawQ, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  // ── Run queries ──────────────────────────────────────────────────────────
  // All three share the same RBAC-scoped `where` — count is consistent.
  const [tickets, total, company, agents] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take:    PAGE_SIZE,
      skip:    (page - 1) * PAGE_SIZE,
      include: {
        customer:      { select: { name: true } },
        assignedAgent: { select: { name: true } },
      },
    }),
    prisma.ticket.count({ where }),   // ← same `where` — consistent with list
    prisma.company.findUnique({
      where:  { id: session.user.companyId },
      select: { name: true },
    }),
    // Agents list for assignee dropdown (hidden from CUSTOMER role)
    isCustomer
      ? Promise.resolve([] as { id: string; name: string | null }[])
      : prisma.user.findMany({
          where:   { companyId: session.user.companyId, role: { in: ["AGENT", "ADMIN"] } },
          select:  { id: true, name: true },
          orderBy: { name: "asc" },
        }),
  ]);

  // ── Count tabs (RBAC-scoped, excluding archived — same ticketWhere base) ─
  const rbacBase = ticketWhere(session);
  const [countOpen, countResolved, countClosed] = await Promise.all([
    prisma.ticket.count({ where: { ...rbacBase, status: "OPEN"     } }),
    prisma.ticket.count({ where: { ...rbacBase, status: "RESOLVED" } }),
    prisma.ticket.count({ where: { ...rbacBase, status: "CLOSED"   } }),
  ]);
  const countAll = countOpen + countResolved + countClosed;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AppShell
      sidebar={
        <Sidebar
          activePath="/tickets"
          userName={session.user.name}
          userRole={session.user.role}
          companyName={company?.name}
        />
      }
    >
      {/* Topbar */}
      <div className="topbar">
        <h2>Tickets</h2>
        <div className="topbar-right">
          <DarkModeToggle />
          {/* Search — rendered by TicketFilters but visually lives in the topbar */}
          <TicketFilters
            counts={{ all: countAll, open: countOpen, resolved: countResolved, closed: countClosed }}
            agents={agents}
            userRole={session.user.role}
          />
          <Link href="/tickets/new" className="btn btn-primary btn-sm">
            New ticket
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="content">
        {/* Tickets table */}
        <Panel>
          <div className="trow head" style={isCustomer ? { gridTemplateColumns: "70px 1fr 110px 100px 90px" } : undefined}>
            <div>ID</div>
            <div>Ticket</div>
            <div>Category</div>
            <div>Priority</div>
            {!isCustomer && <div>Assigned</div>}
            <div>Updated</div>
          </div>

          {tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">▤</div>
              <h3>
                {rawQ || statusFilter || priorityFilter || assigneeFilter
                  ? "No tickets match your filters"
                  : "No tickets yet"}
              </h3>
              <p>
                {rawQ || statusFilter || priorityFilter || assigneeFilter
                  ? "Try adjusting your search or filters."
                  : "When customers submit support requests, they'll appear here."}
              </p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                style={{ display: "contents" }}
              >
                <div className="trow" style={{ cursor: "pointer", ...(isCustomer ? { gridTemplateColumns: "70px 1fr 110px 100px 90px" } : {}) }}>
                  <div className="mono tcust">
                    #{ticket.id.slice(-4).toUpperCase()}
                  </div>
                  <div>
                    <div className="tsubj">{ticket.subject}</div>
                    <div className="tsub-meta">
                      {ticket.customer.name ?? "Unknown"} · {company?.name ?? ""}
                    </div>
                  </div>
                  <div className="tcust">General</div>
                  <div>
                    <Pill variant={priorityVariant(ticket.priority)}>
                      {ticket.priority.charAt(0) +
                        ticket.priority.slice(1).toLowerCase()}
                    </Pill>
                  </div>
                  {!isCustomer && (
                    <div className="tcust">
                      {ticket.assignedAgent?.name
                        ? ticket.assignedAgent.name.split(" ")[0] +
                          " " +
                          ticket.assignedAgent.name.split(" ").slice(-1)[0][0] +
                          "."
                        : "Unassigned"}
                    </div>
                  )}
                  <div className="tcust">{timeAgo(ticket.updatedAt)}</div>
                </div>
              </Link>
            ))
          )}
        </Panel>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            {page > 1 ? (
              <Link
                href={`/tickets?${new URLSearchParams({
                  ...(rawQ        ? { q:        rawQ        } : {}),
                  ...(rawStatus   ? { status:   rawStatus   } : {}),
                  ...(rawPriority ? { priority: rawPriority } : {}),
                  ...(rawAssignee ? { assignee: rawAssignee } : {}),
                  page: String(page - 1),
                }).toString()}`}
                className="btn btn-ghost btn-sm"
              >
                ← Previous
              </Link>
            ) : (
              <span className="btn btn-ghost btn-sm" style={{ opacity: 0.35, cursor: "default" }}>
                ← Previous
              </span>
            )}

            <span className="pinfo">
              Page {page} of {totalPages} · {total} ticket{total !== 1 ? "s" : ""}
            </span>

            {page < totalPages ? (
              <Link
                href={`/tickets?${new URLSearchParams({
                  ...(rawQ        ? { q:        rawQ        } : {}),
                  ...(rawStatus   ? { status:   rawStatus   } : {}),
                  ...(rawPriority ? { priority: rawPriority } : {}),
                  ...(rawAssignee ? { assignee: rawAssignee } : {}),
                  page: String(page + 1),
                }).toString()}`}
                className="btn btn-ghost btn-sm"
              >
                Next →
              </Link>
            ) : (
              <span className="btn btn-ghost btn-sm" style={{ opacity: 0.35, cursor: "default" }}>
                Next →
              </span>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
