"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfileName(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { ok: false, error: "Unauthorized" };

    const name = formData.get("name")?.toString().trim();
    if (!name) return { ok: false, error: "Name is required" };

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    });

    revalidatePath("/settings");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to update profile" };
  }
}

export async function updateWorkspaceName(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") return { ok: false, error: "Unauthorized" };

    const companyName = formData.get("companyName")?.toString().trim();
    if (!companyName) return { ok: false, error: "Workspace name is required" };

    await prisma.company.update({
      where: { id: session.user.companyId },
      data: { name: companyName },
    });

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to update workspace" };
  }
}
