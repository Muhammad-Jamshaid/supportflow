/**
 * RBAC-correct Prisma where clause for ticket queries.
 *
 * ADMIN / AGENT  →  { companyId, archived: false }
 * CUSTOMER       →  { companyId, customerId: session.user.id, archived: false }
 *
 * The `archived: false` default is baked in here so every existing call site
 * (list page, dashboard stats, analytics) automatically excludes archived
 * tickets with zero extra changes at each call site.
 *
 * The ONE place that intentionally needs archived tickets (the admin archive
 * view) should pass `includeArchived: true` as the second argument.
 *
 * Apply this to EVERY query that lists or fetches tickets.
 */
export function ticketWhere(
  session: { user: { companyId: string; id: string; role: string } },
  { includeArchived = false }: { includeArchived?: boolean } = {}
) {
  const archivedFilter = includeArchived ? {} : { archived: false };

  if (session.user.role === "CUSTOMER") {
    // CUSTOMER: only their own tickets — never another customer's ticket
    return {
      companyId:  session.user.companyId,
      customerId: session.user.id,   // ← critical RBAC filter
      ...archivedFilter,
    };
  }
  // ADMIN / AGENT: all tickets for the company
  return {
    companyId: session.user.companyId,
    ...archivedFilter,
  };
}
