import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const r = await prisma.user.updateMany({
    where: { email: "dghatauray@hotmail.co.uk" },
    data: { role: "ADMIN" },
  });
  console.log(`Updated ${r.count} user(s) to ADMIN.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
