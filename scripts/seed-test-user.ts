import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "testadmin@example.com";
  const password = "password123";
  const passwordHash = await hash(password, 10);

  const company = await prisma.company.create({
    data: {
      name: "Test Subagent Company",
      slug: "test-subagent-company",
    },
  });

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "Test Admin",
      role: "ADMIN",
      companyId: company.id,
    },
  });

  console.log("Created test user: testadmin@example.com / password123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
