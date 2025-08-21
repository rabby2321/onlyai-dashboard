// prisma/seed.mjs
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// … keep your existing PLANS / upsertPlans …

async function upsertEndpoint(host, port, user, pass) {
  const existing = await prisma.endpoint.findFirst({ where: { host, port } });
  if (!existing) {
    await prisma.endpoint.create({
      data: {
        host,
        port,
        protocol: "socks5,http",
        authUser: user,
        authPass: pass,
        controllerPath: "static",
        status: "FREE",
      },
    });
  } else {
    // refresh creds/protocol & mark FREE (so it’s available)
    await prisma.endpoint.update({
      where: { id: existing.id },
      data: {
        protocol: "socks5,http",
        authUser: user,
        authPass: pass,
        status: "FREE",
      },
    });
  }
}

async function seedEndpoints() {
  // keep your existing test pool if you want (or remove it)
  // await … (your old la1.onlyai.local loop)

  // === REAL PROXIES YOU SENT ===
  await upsertEndpoint("24.199.107.62", 21805, "G3PV2YFP", "G3PV2YFP");
  await upsertEndpoint("24.199.107.62", 51047, "GX5A29AY", "GX5A29AY");
  await upsertEndpoint("24.199.107.62", 56936, "T4GFGWVJ", "T4GFGWVJ");
}

async function main() {
  await upsertPlans();
  await seedEndpoints();
  console.log("✓ Plans upserted and endpoints seeded.");
}

main().finally(() => prisma.$disconnect());
