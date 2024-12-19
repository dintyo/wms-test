import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      select: {
        id: true,
        type: true,
        status: true,
        quantity: true,
        createdAt: true,
        item: {
          select: {
            sku: true,
            name: true,
          },
        },
        fromLocation: {
          select: {
            label: true,
          },
        },
        toLocation: {
          select: {
            label: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Failed to fetch transaction history:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction history" },
      { status: 500 }
    );
  }
}
