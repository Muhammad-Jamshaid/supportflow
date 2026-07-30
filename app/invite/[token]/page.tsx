import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AcceptInviteForm from "./AcceptInviteForm";

interface Props {
  params: { token: string };
}

export const metadata = { title: "Accept Invitation — SupportFlow" };

export default async function InvitePage({ params }: Props) {
  const invite = await prisma.inviteToken.findUnique({
    where: { token: params.token },
    include: { company: { select: { name: true } } },
  });

  // Token not found, already used, or expired — show 404
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    notFound();
  }

  return (
    <div className="auth-page">
      <AcceptInviteForm
        token={params.token}
        email={invite.email}
        companyName={invite.company.name}
      />
    </div>
  );
}
