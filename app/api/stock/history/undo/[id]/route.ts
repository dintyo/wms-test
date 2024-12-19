// app/api/stock/undo/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: {
        item: true,
        fromLocation: true,
        toLocation: true
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.status === 'UNDONE') {
      return NextResponse.json(
        { error: 'Transaction already undone' },
        { status: 400 }
      );
    }

    // Verify stock levels before undoing
    if (transaction.type === 'MOVE' || transaction.type === 'REMOVE') {
      const destinationStock = await prisma.stock.findUnique({
        where: {
          itemId_locationId: {
            itemId: transaction.itemId,
            locationId: transaction.toLocationId!
          }
        }
      });

      if (
        !destinationStock ||
        destinationStock.quantity < transaction.quantity
      ) {
        return NextResponse.json(
          { error: 'Insufficient stock to undo this transaction' },
          { status: 400 }
        );
      }
    }

    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx: any) => {
      // Update transaction status
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'UNDONE',
          undoneAt: new Date()
        }
      });

      // Update stock levels
      switch (transaction.type) {
        case 'ADD':
          await tx.stock.update({
            where: {
              itemId_locationId: {
                itemId: transaction.itemId,
                locationId: transaction.toLocationId!
              }
            },
            data: {
              quantity: {
                decrement: transaction.quantity
              }
            }
          });
          break;

        case 'REMOVE':
          await tx.stock.update({
            where: {
              itemId_locationId: {
                itemId: transaction.itemId,
                locationId: transaction.fromLocationId!
              }
            },
            data: {
              quantity: {
                increment: transaction.quantity
              }
            }
          });
          break;

        case 'MOVE':
          await tx.stock.update({
            where: {
              itemId_locationId: {
                itemId: transaction.itemId,
                locationId: transaction.fromLocationId!
              }
            },
            data: {
              quantity: {
                increment: transaction.quantity
              }
            }
          });
          await tx.stock.update({
            where: {
              itemId_locationId: {
                itemId: transaction.itemId,
                locationId: transaction.toLocationId!
              }
            },
            data: {
              quantity: {
                decrement: transaction.quantity
              }
            }
          });
          break;
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to undo transaction:', error);
    return NextResponse.json(
      { error: 'Failed to undo transaction' },
      { status: 500 }
    );
  }
}
