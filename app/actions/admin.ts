"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plan } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updatePlanConfigAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.isPlatformOwner) {
    throw new Error("Unauthorized");
  }

  const plan = formData.get("plan") as Plan;
  const maxSeatsStr = formData.get("maxSeats") as string;
  const maxTicketsStr = formData.get("maxTickets") as string;

  const maxSeats = maxSeatsStr.trim() === "" ? null : parseInt(maxSeatsStr, 10);
  const maxTickets = maxTicketsStr.trim() === "" ? null : parseInt(maxTicketsStr, 10);

  await prisma.planConfig.upsert({
    where: { plan },
    update: {
      maxSeats,
      maxTickets,
    },
    create: {
      plan,
      maxSeats,
      maxTickets,
    }
  });

  revalidatePath("/admin/billing");
  revalidatePath("/settings/billing");
  revalidatePath("/settings/team");
}

export async function promotePlatformOwnerAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.isPlatformOwner) {
    throw new Error("Unauthorized");
  }

  const email = formData.get("email") as string;
  if (!email) return;

  await prisma.user.update({
    where: { email },
    data: { isPlatformOwner: true }
  });

  revalidatePath("/admin/team");
}

export async function demotePlatformOwnerAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.isPlatformOwner) {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  if (!id) return;
  
  // Prevent self-demotion to avoid locking out the last owner
  if (id === session.user.id) {
    throw new Error("Cannot demote yourself");
  }

  await prisma.user.update({
    where: { id },
    data: { isPlatformOwner: false }
  });

  revalidatePath("/admin/team");
}
