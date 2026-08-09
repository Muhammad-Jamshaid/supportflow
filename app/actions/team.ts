"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function revokeInviteAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const id = formData.get("id")?.toString();
  if (!id) throw new Error("Missing invite ID");

  await prisma.inviteToken.delete({
    where: {
      id,
      companyId: session.user.companyId,
    },
  });

  revalidatePath("/settings/team");
}
