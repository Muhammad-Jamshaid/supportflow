"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfileName(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const name = formData.get("name")?.toString().trim();
  if (!name) throw new Error("Name is required");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  revalidatePath("/settings");
}
export async function updateWorkspaceName(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const companyName = formData.get("companyName")?.toString().trim();
  if (!companyName) throw new Error("Workspace name is required");

  await prisma.company.update({
    where: { id: session.user.companyId },
    data: { name: companyName },
  });

  revalidatePath("/", "layout");
}
