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

