// api/stock/undo/[transactionId].ts
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";


export async function POST(request: Request, { params }: { params: { transactionId: string } }) {
  try {
    const { transactionId } = params;

    // Find the transaction to undo
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        item: true, // Include item information in the transaction
        fromLocation: true,
        toLocation: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // If the transaction is already undone, no need to proceed
    if (transaction.status === "UNDONE") {
      return NextResponse.json({ error: "Transaction already undone" }, { status: 400 });
    }

    // Start the transaction for stock updates
    const stockUpdate = await prisma.$transaction(async (prisma) => {
        await prisma.stock.update({
            where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.fromLocationId! } },
            data: { quantity: { increment: transaction.quantity } },
          });

          await prisma.stock.update({
            where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.toLocationId! } },
            data: { quantity: { decrement: transaction.quantity } },
          });

      // Update the transaction status to 'UNDONE'
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "UNDONE" },
      });

      return updatedTransaction;
    });

    return NextResponse.json({ success: true, updatedTransaction: stockUpdate });
  } catch (error: any) {
    console.error("[UNDO TRANSACTION ERROR]:", error);
    return NextResponse.json({ error: "Failed to undo transaction", details: error.message }, { status: 500 });
  }
}
