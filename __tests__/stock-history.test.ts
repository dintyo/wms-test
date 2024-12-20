import { prisma } from "@/lib/db";
import { TransactionType } from "@prisma/client";
import request from "supertest";

let stockId: string;
let itemId: string;
let locationAId: string;
let locationBId: string;
const isLocalDatabase = process.env.DATABASE_URL?.includes("localhost");

beforeAll(async () => {
  if (!isLocalDatabase) {
    // Skip tests if the database is not local to avoid unintended data manipulation in non-test environments.
    console.warn(
    "Tests skipped: `DATABASE_URL` does not point to a local database."
  );
  return;
}

  // Clean up all related tables to ensure a consistent test environment.
  await prisma.transaction.deleteMany();
  await prisma.putawayBatch.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.item.deleteMany();
  await prisma.location.deleteMany();
  await prisma.company.deleteMany();

  // Create test data for company, locations, items, and initial stock to set up a controlled environment.
  const company = await prisma.company.create({
    data: { code: "TEST" },
  });

  const locations = await Promise.all([
    prisma.location.create({
      data: {
        label: "A-01-01",
        aisle: "A",
        bay: "01",
        height: "01",
        type: "STANDARD",
      },
    }),
    prisma.location.create({
      data: {
        label: "A-01-02",
        aisle: "A",
        bay: "01",
        height: "02",
        type: "STANDARD",
      },
    }),
  ]);
  locationAId = locations[0].id;
  locationBId = locations[1].id;

  const item = await prisma.item.create({
    data: {
      sku: "TEST001",
      name: "Test Item",
      barcode: "1234567890",
      companyId: company.id,
    },
  });
  itemId = item.id;

  const stock = await prisma.stock.create({
    data: {
      itemId: item.id,
      locationId: locationAId,
      quantity: 10,
    },
  });
  stockId = stock.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Warehouse API Tests with Undo", () => {
  it("Remove stock and undo", async () => {
    // Simulate removing stock from inventory and check for successful API response.
    const removeResponse = await request("http://localhost:3000")
      .post("/api/stock/remove")
      .send({
        items: [{ stockId, quantity: 5 }],
      });
    expect(removeResponse.status).toBe(200);
    
    // Fetch the latest REMOVE transaction to use for testing undo functionality.
    const transaction = await prisma.transaction.findFirst({
      where: { type: TransactionType.REMOVE },
      orderBy: { createdAt: "desc" },
    });
    const undoResponse = await request("http://localhost:3000")
      .post(`/api/transactions/undo/${transaction?.id}`)
      .send({ userId: "user123" });
    expect(undoResponse.status).toBe(200);

    const stockAfterUndo = await prisma.stock.findUnique({ where: { id: stockId } });
    expect(stockAfterUndo?.quantity).toBe(10);
  });

  it("Move stock and undo", async () => {
    const moveResponse = await request("http://localhost:3000")
      .post("/api/stock/move")
      .send({
        items: [{ stockId, quantity: 3 }],
        fromLocation: "A-01-01",
        toLocation: "A-01-02",
      });
    expect(moveResponse.status).toBe(200);

    const transaction = await prisma.transaction.findFirst({
      where: { type: TransactionType.MOVE },
      orderBy: { createdAt: "desc" },
    });
    const undoResponse = await request("http://localhost:3000")
      .post(`/api/transactions/undo/${transaction?.id}`)
      .send({ userId: "user123" });
    expect(undoResponse.status).toBe(200);

    const sourceStock = await prisma.stock.findUnique({ where: { id: stockId } });
    const destinationStock = await prisma.stock.findFirst({
      where: { locationId: locationBId, itemId },
    });
    expect(sourceStock?.quantity).toBe(10);
  });

  it("Add stock and undo", async () => {
    const putawayResponse = await request("http://localhost:3000")
      .post("/api/stock/putaway-batch")
      .send({
        items: [{ itemId, quantity: 5 }],
        locationLabel: "A-01-01",
      });
    expect(putawayResponse.status).toBe(200);

    const transaction = await prisma.transaction.findFirst({
      where: { type: TransactionType.ADD },
      orderBy: { createdAt: "desc" },
    });
    const undoResponse = await request("http://localhost:3000")
      .post(`/api/transactions/undo/${transaction?.id}`)
      .send({ userId: "user123" });
    expect(undoResponse.status).toBe(200);

    const stockAfterUndo = await prisma.stock.findUnique({ where: { id: stockId } });
    expect(stockAfterUndo?.quantity).toBe(10);
  });

  it("Move stock, remove it, and attempt to undo (should fail due to negative stock)", async () => {
    // Move stock to a different location, removing it afterward, and attempt to undo the move.
    const moveResponse = await request("http://localhost:3000")
      .post("/api/stock/move")
      .send({
        items: [{ stockId, quantity: 5 }],
        fromLocation: "A-01-01",
        toLocation: "A-01-02",
      });
    expect(moveResponse.status).toBe(200);

    const destinationStock = await prisma.stock.findFirst({
      where: { locationId: locationBId, itemId },
    });
    
    // Attempting to remove stock from the destination to set up the failure condition for the undo.
    const removeResponse = await request("http://localhost:3000")
      .post("/api/stock/remove")
      .send({
        items: [{ stockId: destinationStock?.id!, quantity: 5 }],
      });
    expect(removeResponse.status).toBe(200);

    const transaction = await prisma.transaction.findFirst({
      where: { type: TransactionType.MOVE },
      orderBy: { createdAt: "desc" },
    });
    const undoResponse = await request("http://localhost:3000")
      .post(`/api/transactions/undo/${transaction?.id}`)
      .send({ userId: "user123" });
    expect(undoResponse.status).toBe(400);

    const undoError = JSON.parse(undoResponse.text);
    expect(undoError.error).toBe("Cannot undo. Insufficient stock at destination location");
  });
});
