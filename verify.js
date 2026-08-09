const cheerio = require('cheerio');

const USER_COOKIE = "next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..DeeoCHEuxH2iSIWU.0m46EFaTpXt4AdLwc70Ox95-GdfomNctSjLzKi2-chcVT6CPR6ENDB8d1LCf5iFLLkJB4B_KFrMe0UwkwIAh39nLArveWodM50filPuTNTogsY1fqkgKbddgrKEpczxwZj0-XrzkHySCJKA6IHLIcad0YPE02SZJTbuNF7q3ayn4PdTzDoW2xTK-gYOL_uIGMcKTlXkAifyqSKBtBZHRV0Wp0RiWeMHoFa3WAq72o3ygSyC5KcfqK3lstj5hHCrPgPM6UV4FAG6XpS7P6IcvOCwk8jKv0o_54TxNl6-375HqkZb4uDJzHmtGdA.90fc86VtBNeSuuh_uQ2EAA";
const ADMIN_COOKIE = "next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..lma_fk8amaLx3LdB.YxVpIVlO9uGsXy_2qLHRFZ4Bl-HKNGUVhvTt4x04_HNsKaPUzy6coOqfJLkEjiYdEVjVPY3xVCfSVYhYhdqdjOUWAKJnkcADjmXtOnBa-EL43Ut9K7v5dJ6RPkifMi2W13vWxd1OBxlTlpKkCM3EE91pdeXd1e3bmcmxDw5R02wNUxT2bpQHnYqcVky1H0AqhlQV7kJk6_jNDY2DcypsSJCHK30BZYdQEsApIVz80RkiWhHmp_n9CwPcL4aLBjqOaqsdJiFh5paAse0M5oWhkveskwd_pxaKDAY.2NE_544LR_dJupYArCJmKQ";

async function run() {
  console.log("=== 1. 404 Anonymous ===");
  let res = await fetch("http://localhost:3000/random-404-url");
  let html = await res.text();
  let $ = cheerio.load(html);
  console.log("Status:", res.status);
  console.log("Has Sidebar?:", $('.sidebar').length > 0);
  console.log("Main Heading:", $('h3').text());

  console.log("\n=== 2. 404 Logged In (Regular Company User) ===");
  res = await fetch("http://localhost:3000/random-404-url", {
    headers: { cookie: USER_COOKIE }
  });
  html = await res.text();
  $ = cheerio.load(html);
  console.log("Status:", res.status);
  console.log("Has Sidebar?:", $('.sidebar').length > 0);
  console.log("Sidebar Active User Role:", $('.agent span').text());

  console.log("\n=== 3. /admin/analytics (Non-platform-owner) ===");
  res = await fetch("http://localhost:3000/admin/analytics", {
    headers: { cookie: USER_COOKIE },
    redirect: "manual"
  });
  console.log("Status:", res.status);
  if (res.status === 307 || res.status === 302) {
    console.log("Redirected to:", res.headers.get("location"));
  } else {
    console.log("Loaded without redirect. Length:", (await res.text()).length);
  }

  console.log("\n=== 4. /admin/analytics (Platform Owner) ===");
  res = await fetch("http://localhost:3000/admin/analytics", {
    headers: { cookie: ADMIN_COOKIE }
  });
  html = await res.text();
  $ = cheerio.load(html);
  console.log("Status:", res.status);
  console.log("Page Heading:", $('h2').text());
  console.log("Stat Cards:");
  $('.stat').each((i, el) => {
    console.log(" - " + $(el).find('.slabel').text() + ": " + $(el).find('.sval').text());
  });

  // Since DB is mocked for platform owner, total tickets might be 0. We just want to see it loads without crash.
  
  console.log("\n=== 5. Update Company to TEAM and Check Billing Usage Bar ===");
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.company.update({
    where: { id: "cmrz0loak0003mk23ihpb9ct1" },
    data: { plan: "TEAM" }
  });

  res = await fetch("http://localhost:3000/settings/billing", {
    headers: { cookie: USER_COOKIE }
  });
  html = await res.text();
  $ = cheerio.load(html);
  
  console.log("Status:", res.status);
  console.log("Usage Items:");
  $('span').each((i, el) => {
    const text = $(el).text();
    if (text === 'Active Agent Seats' || text === 'Tickets This Month') {
      const val = $(el).next('span').text();
      console.log(` - ${text}: ${val}`);
    }
  });
  
  // also verify progress bars
  const progressBars = $('div[style*="overflow: hidden"]').length;
  console.log("Progress Bars count:", progressBars);

  await prisma.$disconnect();
}
run();
