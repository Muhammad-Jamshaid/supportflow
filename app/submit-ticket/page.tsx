import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface Props {
  searchParams: { companyId?: string };
}

/**
 * Legacy redirect: /submit-ticket?companyId=xxx → /support/[slug]
 * Keeps old links working after the slug-based URL was introduced.
 */
export default async function SubmitTicketRedirect({ searchParams }: Props) {
  const companyId = searchParams.companyId;

  if (!companyId) notFound();

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { slug: true },
  });

  if (!company) notFound();

  redirect(`/support/${company.slug}`);
}
