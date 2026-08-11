"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// Generates a URL-safe slug from a company name.
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Returns a unique slug
async function uniqueSlug(base: string): Promise<string> {
  const clean = toSlug(base) || "workspace";
  let slug = clean;
  let attempt = 0;
  while (true) {
    const existing = await prisma.company.findUnique({ where: { slug } });
    if (!existing) return slug;
    attempt++;
    slug = `${clean}-${attempt}`;
  }
}

export async function completeSetup(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.companyId) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const companyName = formData.get("companyName") as string;

  if (!name || !companyName) {
    throw new Error("Name and Company Name are required");
  }

  const slug = await uniqueSlug(companyName);

  await prisma.company.update({
    where: { id: session.user.companyId },
    data: {
      name: companyName,
      slug,
      needsOnboarding: false,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name,
    },
  });

  redirect("/signup/plan");
}
