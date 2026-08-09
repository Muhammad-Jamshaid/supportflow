import { prisma } from "./prisma";

// Fallbacks if PlanConfig is somehow missing in DB
export const FALLBACK_FREE_PLAN_TICKET_LIMIT = 100;
export const FALLBACK_FREE_PLAN_SEAT_LIMIT = 2;

export async function checkTicketLimit(companyId: string): Promise<string | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { plan: true },
  });

  if (!company) return null;

  const planConfig = await prisma.planConfig.findUnique({
    where: { plan: company.plan }
  });

  // If maxTickets is null, it's unlimited
  if (planConfig && planConfig.maxTickets === null) {
    return null;
  }

  const limit = planConfig?.maxTickets ?? FALLBACK_FREE_PLAN_TICKET_LIMIT;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const ticketCount = await prisma.ticket.count({
    where: {
      companyId,
      createdAt: { gte: startOfMonth },
    },
  });

  if (ticketCount >= limit) {
    return `This workspace has reached its monthly ticket limit (${limit}). Please upgrade your plan.`;
  }

  return null;
}
