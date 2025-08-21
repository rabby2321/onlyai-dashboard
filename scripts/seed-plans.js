// scripts/seed-plans.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.plan.upsert({
    where: { name: "5G Mobile Proxy — 1 Day" },
    update: {},
    create: { name: "5G Mobile Proxy — 1 Day", priceC: 900, durationD: 1 },
  });

  await prisma.plan.upsert({
    where: { name: "5G Mobile Proxy — 1 Week" },
    update: {},
    create: { name: "5G Mobile Proxy — 1 Week", priceC: 3000, durationD: 7 },
  });

  console.log("Plans upserted.");
}

main().finally(() => prisma.$disconnect());
