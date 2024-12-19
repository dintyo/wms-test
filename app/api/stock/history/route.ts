// app/api/stock/history/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db'; // Update this import

export async function GET() {
  try {
    // First, let's count total transactions
    const count = await prisma.transaction.count();
    console.log('Total transactions:', count);

    // Get all transactions without includes first
    const simpleTransactions = await prisma.transaction.findMany();
    console.log('Simple transactions:', simpleTransactions);

    // Now with includes
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        item: {
          select: {
            sku: true,
            name: true
          }
        },
        fromLocation: {
          select: {
            label: true
          }
        },
        toLocation: {
          select: {
            label: true
          }
        }
      }
    });

    console.log('Full transactions:', transactions);

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock history', details: error },
      { status: 500 }
    );
  }
}
