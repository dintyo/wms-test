import { prisma } from '../lib/db';

describe('Stock Movement', () => {
  // Clear data before each test
  beforeEach(async () => {
    await prisma.transaction.deleteMany();
    await prisma.stock.deleteMany();
    await prisma.item.deleteMany();
    await prisma.location.deleteMany();
    await prisma.company.deleteMany();
  });

  it('should not allow moving more stock than available', async () => {
    // Create test company
    const company = await prisma.company.create({
      data: {
        code: 'TEST'
      }
    });

    // Create test locations
    const [fromLocation, toLocation] = await Promise.all([
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

    // Create test item
    const item = await prisma.item.create({
      data: {
        sku: 'TEST001',
        name: 'Test Item',
        barcode: '1234567890',
        companyId: company.id
      }
    });

    // Create initial stock
    await prisma.stock.create({
      data: {
        itemId: item.id,
        locationId: fromLocation.id,
        quantity: 5 // Only 5 items in stock
      }
    });

    // Attempt to move more items than available
    const moveTransaction = await prisma.transaction.create({
      data: {
        type: 'MOVE',
        quantity: 10, // Trying to move 10 items when only 5 exist
        itemId: item.id,
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id
      }
    });

    // Verify the stock quantities
    const fromStock = await prisma.stock.findUnique({
      where: {
        itemId_locationId: {
          itemId: item.id,
          locationId: fromLocation.id
        }
      }
    });

    const toStock = await prisma.stock.findUnique({
      where: {
        itemId_locationId: {
          itemId: item.id,
          locationId: toLocation.id
        }
      }
    });

    // Assertions
    expect(fromStock?.quantity).toBe(5); // Original location should still have 5 items
    expect(toStock?.quantity).toBeUndefined(); // No stock should be created in new location
  });

  it('should successfully move stock within available quantity', async () => {
    // Create test company
    const company = await prisma.company.create({
      data: {
        code: 'TEST'
      }
    });

    // Create test locations
    const [fromLocation, toLocation] = await Promise.all([
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

    // Create test item
    const item = await prisma.item.create({
      data: {
        sku: 'TEST001',
        name: 'Test Item',
        barcode: '1234567890',
        companyId: company.id
      }
    });

    // Create initial stock
    await prisma.stock.create({
      data: {
        itemId: item.id,
        locationId: fromLocation.id,
        quantity: 10
      }
    });

    // Move valid quantity of items
    await prisma.transaction.create({
      data: {
        type: 'MOVE',
        quantity: 5, // Moving 5 out of 10 items
        itemId: item.id,
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id
      }
    });

    // Verify the stock quantities
    const [fromStock, toStock] = await Promise.all([
      prisma.stock.findUnique({
        where: {
          itemId_locationId: {
            itemId: item.id,
            locationId: fromLocation.id
          }
        }
      }),
      prisma.stock.findUnique({
        where: {
          itemId_locationId: {
            itemId: item.id,
            locationId: toLocation.id
          }
        }
      })
    ]);

    // Assertions
    expect(fromStock?.quantity).toBe(5); // Should have 5 items left
    expect(toStock?.quantity).toBe(5); // Should have 5 items moved
  });

  it('should handle undo of stock movement correctly', async () => {
    // Create test company
    const company = await prisma.company.create({
      data: {
        code: 'TEST'
      }
    });

    // Create test locations
    const [fromLocation, toLocation] = await Promise.all([
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

    // Create test item
    const item = await prisma.item.create({
      data: {
        sku: 'TEST001',
        name: 'Test Item',
        barcode: '1234567890',
        companyId: company.id
      }
    });

    // Create initial stock
    await prisma.stock.create({
      data: {
        itemId: item.id,
        locationId: fromLocation.id,
        quantity: 10
      }
    });

    // Create and complete a move transaction
    const transaction = await prisma.transaction.create({
      data: {
        type: 'MOVE',
        quantity: 5,
        itemId: item.id,
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id
      }
    });

    // Undo the transaction
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'UNDONE',
        undoneAt: new Date()
      }
    });

    // Verify the stock quantities after undo
    const [fromStock, toStock] = await Promise.all([
      prisma.stock.findUnique({
        where: {
          itemId_locationId: {
            itemId: item.id,
            locationId: fromLocation.id
          }
        }
      }),
      prisma.stock.findUnique({
        where: {
          itemId_locationId: {
            itemId: item.id,
            locationId: toLocation.id
          }
        }
      })
    ]);

    // Assertions
    expect(fromStock?.quantity).toBe(10); // Should be back to original quantity
    expect(toStock?.quantity).toBe(0); // Should be empty again
  });

  // Cleanup after all tests
  afterAll(async () => {
    await prisma.transaction.deleteMany();
    await prisma.stock.deleteMany();
    await prisma.item.deleteMany();
    await prisma.location.deleteMany();
    await prisma.company.deleteMany();
    await prisma.$disconnect();
  });
});
