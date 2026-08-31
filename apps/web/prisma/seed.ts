import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create the Global System Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'learnit-system' },
    update: {},
    create: {
      name: 'Learn-it HCL System',
      slug: 'learnit-system',
      tenantType: 'system',
      description: 'Global system organization for platform administration.',
    },
  });

  console.log(`✅ Organization created: ${org.name}`);

  // 1.5 Create Global Custom Roles
  const defaultRoles = [
    { name: 'Super Admin', slug: 'super_admin' },
    { name: 'Organization Admin', slug: 'org_admin' },
  ];

  for (const role of defaultRoles) {
    // Prisma's unique compound index with nullable fields requires a findFirst fallback
    const existing = await prisma.customRole.findFirst({
      where: {
        tenantId: null,
        slug: role.slug,
      },
    });

    if (!existing) {
      await prisma.customRole.create({
        data: {
          tenantId: null, // null means global role
          name: role.name,
          slug: role.slug,
        },
      });
      console.log(`✅ Global Role created: ${role.name}`);
    }
  }

  // 2. Create the initial SUPER_ADMIN user
  const email = 'superadmin@learnit.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const superAdmin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: org.id,
        email: email,
      },
    },
    update: {},
    create: {
      tenantId: org.id,
      email: email,
      fullName: 'System Super Admin',
      hashedPassword: hashedPassword,
      role: 'super_admin',
      isVerified: true,
      isActive: true,
    },
  });

  console.log(`✅ Super Admin created: ${superAdmin.email}`);
  if (!process.env.SUPER_ADMIN_PASSWORD) {
    console.log(`🔑 Default Password: Admin123!`);
    console.log(`⚠️  Please change this password immediately in a production environment.`);
  }

  console.log('📖 Executing seed_generated.sql to populate demo data...');
  try {
    const sqlPath = path.join(__dirname, 'seed_generated.sql');
    if (fs.existsSync(sqlPath)) {
      const sqlStr = fs.readFileSync(sqlPath, 'utf8');
      const statements = sqlStr.split(';').filter((s) => s.trim().length > 0);
      for (const statement of statements) {
        await prisma.$executeRawUnsafe(statement);
      }
      console.log(`✅ Executed ${statements.length} SQL statements from seed_generated.sql`);
    } else {
      console.log('⚠️ seed_generated.sql not found, skipping demo data seed.');
    }
  } catch (err) {
    console.error('⚠️ Failed to execute seed_generated.sql:', err);
  }

  console.log('✨ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
