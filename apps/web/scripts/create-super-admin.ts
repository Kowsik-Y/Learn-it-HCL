import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as readline from "readline";

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  console.log("🚀 Super Admin Creation Script");

  rl.question("Email: ", async (email) => {
    if (!email) {
      console.log("Email is required.");
      process.exit(1);
    }

    rl.question("Password: ", async (password) => {
      if (!password) {
        console.log("Password is required.");
        process.exit(1);
      }

      rl.question("Full Name: ", async (fullName) => {
        try {
          // Check if a user with this email already exists
          const existingUser = await prisma.user.findFirst({
            where: { email },
          });

          if (existingUser) {
            console.log(`❌ User with email ${email} already exists.`);
            process.exit(1);
          }

          let systemOrg = await prisma.organization.findUnique({
            where: { slug: "system-admin" }
          });
          
          if (!systemOrg) {
             systemOrg = await prisma.organization.create({
               data: {
                 name: "System Administration",
                 slug: "system-admin",
                 tenantType: "system"
               }
             });
          }

          console.log("Creating Super Admin...");
          const hashedPassword = await bcrypt.hash(password, 10);

          const user = await prisma.user.create({
            data: {
              tenantId: systemOrg.id,
              email,
              hashedPassword,
              fullName: fullName || "Super Admin",
              role: "super_admin",
              isActive: true,
            },
          });

          console.log(`✅ Super Admin created successfully: ${user.email}`);
        } catch (error) {
          console.error("❌ Failed to create super admin:", error);
        } finally {
          await prisma.$disconnect();
          rl.close();
        }
      });
    });
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
