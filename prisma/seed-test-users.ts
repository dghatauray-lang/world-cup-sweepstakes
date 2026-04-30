import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const fakeUsers = [
  { name: "Alice Johnson", email: "alice@test.com" },
  { name: "Bob Smith", email: "bob@test.com" },
  { name: "Charlie Brown", email: "charlie@test.com" },
  { name: "Diana Prince", email: "diana@test.com" },
  { name: "Ethan Hunt", email: "ethan@test.com" },
  { name: "Fiona Green", email: "fiona@test.com" },
  { name: "George King", email: "george@test.com" },
  { name: "Hannah Lee", email: "hannah@test.com" },
  { name: "Ivan Cole", email: "ivan@test.com" },
  { name: "Julia Fox", email: "julia@test.com" },
];

async function main() {
  console.log("Creating 10 test users...");
  for (const u of fakeUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, role: "USER" },
    });
  }
  console.log("Done. Now run the draft from /admin.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
