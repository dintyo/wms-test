import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TransactionStatus, TransactionType } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId }: { userId: string } = await request.json();
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required to undo a transaction" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (transaction.status === TransactionStatus.UNDONE) {
      return NextResponse.json(
        { error: "Transaction has already been undone" },
        { status: 400 }
      );
    }

    const updates: any[] = [];

    if (transaction.type === TransactionType.REMOVE) {
      // Handle REMOVE: Add quantity back to stock
      const stock = await prisma.stock.findUnique({
        where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.fromLocationId! } },
      });

      if (!stock) {
        return NextResponse.json(
          { error: "Stock not found for this location" },
          { status: 400 }
        );
      }

      updates.push(
        prisma.stock.update({
          where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.fromLocationId! } },
          data: {
            quantity: { increment: transaction.quantity },
          },
        })
      );
    } else if (transaction.type === TransactionType.ADD) {
      // Handle ADD: Reduce quantity from stock
      const stock = await prisma.stock.findUnique({
        where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.toLocationId! } },
      });

      if (!stock || stock.quantity < transaction.quantity) {
        return NextResponse.json(
          { error: "Cannot undo. Insufficient stock at this location" },
          { status: 400 }
        );
      }

      // Reverse the stock addition
      updates.push(
        prisma.stock.update({
          where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.toLocationId! } },
          data: {
            quantity: { decrement: transaction.quantity },
          },
        })
      );
    } else if (transaction.type === TransactionType.MOVE) {
      // Handle MOVE: Reverse stock movement
      const fromStock = await prisma.stock.findUnique({
        where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.fromLocationId! } },
      });

      const toStock = await prisma.stock.findUnique({
        where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.toLocationId! } },
      });

      if (!toStock || toStock.quantity < transaction.quantity) {
        return NextResponse.json(
          { error: "Cannot undo. Insufficient stock at destination location" },
          { status: 400 }
        );
      }

      updates.push(
        prisma.stock.update({
          where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.fromLocationId! } },
          data: {
            quantity: { increment: transaction.quantity },
          },
        })
      );

      updates.push(
        prisma.stock.update({
          where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.toLocationId! } },
          data: {
            quantity: { decrement: transaction.quantity },
          },
        })
      );
    }

    // Update the transaction status
    updates.push(
      prisma.transaction.update({
        where: { id: params.id },
        data: {
          status: TransactionStatus.UNDONE,
          undoneAt: new Date(),
          undoneBy: userId,
          redoneAt: null,
          redoneBy: null,
        },
      })
    );

    // Execute all updates in a single transaction
    await prisma.$transaction(updates);

    return NextResponse.json({ message: "Transaction undone successfully" });
  } catch (error) {
    console.error("Failed to undo transaction:", error);
  
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "An unexpected error occurred", details: error.message },
        { status: 500 }
      );
    }
  
    return NextResponse.json(
      { error: "An unexpected error occurred", details: "Unknown error" },
      { status: 500 }
    );
  }    
}
