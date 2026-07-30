/**
 * Backfill script: generates unique slugs for existing companies that have none.
 * Run once after the migration: npx ts-node --skip-project prisma/backfill-slugs.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")   // remove non-alphanumeric chars
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/-+/g, "-")             // collapse consecutive hyphens
    .replace(/^-|-$/g, "");          // trim leading/trailing hyphens
}

async function main() {
  const companies = await prisma.company.findMany({
    where: { slug: "" }, // after migration, empty strings need backfilling
  });

  console.log(`Found ${companies.length} companies to backfill.`);

  for (const company of companies) {
    let base = toSlug(company.name) || "workspace";
    let slug = base;
    let attempt = 0;

    // Ensure uniqueness
    while (true) {
      const existing = await prisma.company.findUnique({ where: { slug } });
      if (!existing || existing.id === company.id) break;
      attempt++;
      slug = `${base}-${attempt}`;
    }

    await prisma.company.update({
      where: { id: company.id },
      data: { slug },
    });

    console.log(`  ${company.name} → ${slug}`);
  }

  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
