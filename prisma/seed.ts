import { seedCrm } from "./crm-seed";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Converis2024", 12);
  await prisma.user.upsert({
    where: { email: "admin@converis.ai" },
    create: {
      email: "admin@converis.ai",
      password,
      name: "Administrator",
      role: "ADMIN",
      active: true,
    },
    update: {
      password,
      name: "Administrator",
      role: "ADMIN",
      active: true,
    },
  });
  console.log("Seeded admin@converis.ai (password: Converis2024)");

  await seedCrm(prisma);
  console.log("Seeded CRM demo data.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
