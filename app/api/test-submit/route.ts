import { NextResponse } from "next/server";
import { submitTicketAction } from "@/app/actions/public";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const company = await prisma.company.findFirst();
  if (!company) {
    return NextResponse.json({ error: "No company found" }, { status: 400 });
  }

  const formData = new FormData();
  formData.append("companyId", company.id);
  formData.append("name", "Real Key Tester");
  formData.append("email", "realkeytester@example.com");
  formData.append("subject", "My account is locked and I can't login");
  formData.append("description", "Every time I try to login it says account locked. I really need to get in to download my invoice.");

  const start = Date.now();
  const result = await submitTicketAction(formData);
  const end = Date.now();

  return NextResponse.json({
    result,
    timeMs: end - start
  });
}
