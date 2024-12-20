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
        { error: "User ID is required to redo a transaction" },
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

    if (transaction.status !== TransactionStatus.UNDONE) {
      return NextResponse.json(
        { error: "Transaction must be undone to be redone" },
        { status: 400 }
      );
    }

    const updates: any[] = [];

    if (transaction.type === TransactionType.REMOVE) {
      // Handle REMOVE: Deduct quantity from stock
      const stock = await prisma.stock.findUnique({
        where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.fromLocationId! } },
      });

      if (!stock || stock.quantity < transaction.quantity) {
        return NextResponse.json(
          { error: "Insufficient stock to redo this transaction" },
          { status: 400 }
        );
      }

      updates.push(
        prisma.stock.update({
          where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.fromLocationId! } },
          data: {
            quantity: { decrement: transaction.quantity },
          },
        })
      );
    } else if (transaction.type === TransactionType.ADD) {
      // Handle ADD: Add quantity back to stock
      updates.push(
        prisma.stock.update({
          where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.toLocationId! } },
          data: {
            quantity: { increment: transaction.quantity },
          },
        })
      );
    } else if (transaction.type === TransactionType.MOVE) {
      // Handle MOVE: Reverse the undo of stock movement
      const fromStock = await prisma.stock.findUnique({
        where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.fromLocationId! } },
      });

      if (!fromStock || fromStock.quantity < transaction.quantity) {
        return NextResponse.json(
          { error: "Insufficient stock at source location to redo this transaction" },
          { status: 400 }
        );
      }

      updates.push(
        prisma.stock.update({
          where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.toLocationId! } },
          data: {
            quantity: { increment: transaction.quantity },
          },
        })
      );

      updates.push(
        prisma.stock.update({
          where: { itemId_locationId: { itemId: transaction.itemId, locationId: transaction.fromLocationId! } },
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
          status: TransactionStatus.REDONE,
          undoneAt: null,
          undoneBy: null,
          redoneAt: new Date(),
          redoneBy: userId,
        },
      })
    );

    // Execute all updates in a single transaction
    await prisma.$transaction(updates);

    return NextResponse.json({ message: "Transaction redone successfully" });
  } catch (error) {
    console.error("Failed to redo transaction:", error);

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
