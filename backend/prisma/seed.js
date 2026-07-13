import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../src/config/database.js';

const SALT_ROUNDS = 10;

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@trackdev.local';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const name = process.env.ADMIN_NAME || 'Admin';

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password: hashedPassword, name, role: 'ADMIN' },
  });

  console.log(`Admin ready: ${admin.email} (id: ${admin.id})`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`Using default password "${password}" — set ADMIN_PASSWORD before seeding a real environment.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
