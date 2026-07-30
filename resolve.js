const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const migrationName = '20260730000000_add_tracking_token';
  const migrationPath = path.join(__dirname, 'prisma/migrations', migrationName, 'migration.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  const checksum = crypto.createHash('sha256').update(sql).digest('hex');

  // Update the checksum in case the file was edited after initial insertion
  await prisma.$executeRawUnsafe(`
    UPDATE _prisma_migrations 
    SET checksum = $1
    WHERE migration_name = $2;
  `, checksum, migrationName);

  console.log(`Successfully recorded migration ${migrationName} as applied.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
