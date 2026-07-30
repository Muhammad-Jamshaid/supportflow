import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SupportFormClient from "./SupportFormClient";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const company = await prisma.company.findUnique({
    where: { slug: params.slug },
    select: { name: true },
  });
  return {
    title: company ? `${company.name} — Submit a Support Ticket` : "Support",
  };
}

export default async function SupportPage({ params }: Props) {
  const company = await prisma.company.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true },
  });

  if (!company) notFound();

  return (
    <SupportFormClient
      companyId={company.id}
      companyName={company.name}
    />
  );
}
