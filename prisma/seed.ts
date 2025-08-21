import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Make sure your 3 plans exist (safe to run repeatedly)
  const PLANS = [
    { name: "5G Mobile Proxy — 1 Day",  priceC:  900,  durationD: 1 },
    { name: "5G Mobile Proxy — 1 Week", priceC: 3000, durationD: 7 },
    { name: "5G Mobile Proxy — 30 Days", priceC: 10000, durationD: 30 },
  ];
  for (const p of PLANS) {
    const existing = await prisma.plan.findFirst({ where: { durationD: p.durationD } });
    if (!existing) await prisma.plan.create({ data: p });
    else if (existing.name !== p.name || existing.priceC !== p.priceC) {
      await prisma.plan.update({ where: { id: existing.id }, data: { name: p.name, priceC: p.priceC } });
    }
  }

  // ---- Dummy endpoint inventory ----
  // Adjust these as you like
  const host = "la1.onlyai.local";
  const startPort = 10001;
  const count = 12;          // create/update 12 endpoints
  const protocol = "socks5"; // we support both on connect, stored value can be "socks5"

  for (let i = 0; i < count; i++) {
    const port = startPort + i;
    await prisma.endpoint.upsert({
      // requires @@unique([host, port]) in your Prisma schema (you added this already)
      where: { host_port: { host, port } },
      update: {
        protocol,
        authUser: `u${i + 1}`,
        authPass: `p${i + 1}`,
        status: "FREE",
        controllerPath: "",
      },
      create: {
        host,
        port,
        protocol,
        authUser: `u${i + 1}`,
        authPass: `p${i + 1}`,
        status: "FREE",
        controllerPath: "",
      },
    });
  }

  console.log(`Seed complete: ensured plans + ${count} endpoints on ${host}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
