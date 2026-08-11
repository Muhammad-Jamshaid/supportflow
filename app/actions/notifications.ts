"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getNotificationsAction() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized", notifications: [] };

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return { notifications };
}

export async function markNotificationsAsReadAction() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return { ok: true };
}

export async function markNotificationAsReadAction(notificationId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  await prisma.notification.updateMany({
    where: { 
      id: notificationId,
      userId: session.user.id 
    },
    data: { isRead: true },
  });

  return { ok: true };
}
