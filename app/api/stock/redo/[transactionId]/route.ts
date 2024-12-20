// /app/api/stock/redo/[transactionId]/route.ts

import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";


export async function POST(req: Request, { params }: { params: { transactionId: string } }) {
  const { transactionId } = params;

  try {
    // Retrieve the undone transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    // Ensure the transaction is in 'UNDONE' status before it can be redone
    if (transaction.status !== 'UNDONE') {
      return NextResponse.json({ message: 'Transaction cannot be redone' }, { status: 400 });
    }

    // Ensure stock quantities can accommodate the redo
    const currentStock = await prisma.stock.findFirst({
      where: { itemId: transaction.itemId, locationId: transaction.toLocationId! },
    });

    if (!currentStock) {
      return NextResponse.json({ message: 'Stock not found to redo the transaction' }, { status: 400 });
    }

    // Proceed with the redo logic: update the transaction status back to 'COMPLETED' and update time
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'COMPLETED',
        createdAt: new Date(),
      },
    });

    // Update stock quantities after the redo
    await prisma.stock.update({
        where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.fromLocationId! } },
        data: { quantity: { decrement: transaction.quantity } },
      });

      await prisma.stock.update({
        where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.toLocationId! } },
        data: { quantity: { increment: transaction.quantity } },
      });

    return NextResponse.json({ status: 'COMPLETED', message: 'Transaction successfully redone' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'An error occurred while redoing the transaction' }, { status: 500 });
  }
}
