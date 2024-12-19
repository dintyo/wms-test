import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Constants for roles and transaction types
const USER_ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF'
} as const;

const TRANSACTION_TYPES = {
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  MOVE: 'MOVE'
} as const;

async function main() {
  // Clear existing data
  await prisma.transaction.deleteMany();
  await prisma.putawayBatch.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();
  await prisma.company.deleteMany();

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.transaction.deleteMany();
  // ... other deletes ...

  // After creating transactions
  const transactionCount = await prisma.transaction.count();
  console.log(`Verified ${transactionCount} transactions in database`);

  // Query one transaction to verify data
  const sampleTransaction = await prisma.transaction.findFirst({
    include: {
      item: true,
      fromLocation: true,
      toLocation: true
    }
  });
  console.log('Sample transaction:', sampleTransaction);

  // Create test company
  const company = await prisma.company.create({
    data: {
      code: 'TEST'
    }
  });

  // Create test locations
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        label: 'A-01-01',
        aisle: 'A',
        bay: '01',
        height: '01',
        type: 'STANDARD'
      }
    }),
    prisma.location.create({
      data: {
        label: 'A-01-02',
        aisle: 'A',
        bay: '01',
        height: '02',
        type: 'STANDARD'
      }
    })
  ]);

  // Create test user
  const user = await prisma.user.create({
    data: {
      username: 'test',
      passwordHash: 'test123',
      role: 'ADMIN',
      companyId: company.id
    }
  });

  // Create test items
  const items = await Promise.all([
    prisma.item.create({
      data: {
        sku: 'TEST001',
        name: 'Test Item 1',
        barcode: '1234567890',
        companyId: company.id
      }
    }),
    prisma.item.create({
      data: {
        sku: 'TEST002',
        name: 'Test Item 2',
        barcode: '0987654321',
        companyId: company.id
      }
    })
  ]);

  // Create test stock
  await Promise.all([
    prisma.stock.create({
      data: {
        itemId: items[0].id,
        locationId: locations[0].id,
        quantity: 10
      }
    }),
    prisma.stock.create({
      data: {
        itemId: items[1].id,
        locationId: locations[1].id,
        quantity: 5
      }
    })
  ]);

  // Add transactions
  const now = new Date();
  const transactions = await Promise.all([
    // ADD transaction
    prisma.transaction.create({
      data: {
        type: TRANSACTION_TYPES.ADD,
        quantity: 15,
        itemId: items[0].id,
        toLocationId: locations[0].id,
        userId: user.id,
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      }
    }),

    // REMOVE transaction
    prisma.transaction.create({
      data: {
        type: TRANSACTION_TYPES.REMOVE,
        quantity: 5,
        itemId: items[0].id,
        fromLocationId: locations[0].id,
        userId: user.id,
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      }
    }),

    // MOVE transaction
    prisma.transaction.create({
      data: {
        type: TRANSACTION_TYPES.MOVE,
        quantity: 3,
        itemId: items[0].id,
        fromLocationId: locations[0].id,
        toLocationId: locations[1].id,
        userId: user.id,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      }
    }),

    // UNDONE transaction
    prisma.transaction.create({
      data: {
        type: TRANSACTION_TYPES.REMOVE,
        quantity: 2,
        itemId: items[1].id,
        fromLocationId: locations[1].id,
        userId: user.id,
        status: 'UNDONE',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        undoneAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }
    }),

    // Recent ADD transaction
    prisma.transaction.create({
      data: {
        type: TRANSACTION_TYPES.ADD,
        quantity: 8,
        itemId: items[1].id,
        toLocationId: locations[1].id,
        userId: user.id,
        createdAt: new Date() // Today
      }
    }),

    // Recent MOVE transaction
    prisma.transaction.create({
      data: {
        type: TRANSACTION_TYPES.MOVE,
        quantity: 4,
        itemId: items[1].id,
        fromLocationId: locations[1].id,
        toLocationId: locations[0].id,
        userId: user.id,
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000) // 1 hour ago
      }
    })
  ]);

  console.log('Database seeded successfully');
  console.log(`Created ${transactions.length} transactions`);
}

main()
  .catch((e) => {
    console.error(e);
    // Instead of process.exit(1), just throw the error
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
