import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stockHistory = await prisma.transaction.findMany({
      include: {
        item: true,        // Include item details like SKU
        fromLocation: true, // Include from location details
        toLocation: true,   // Include to location details
      },
      orderBy: {
        createdAt: "desc",  // Order by most recent transactions
      },
    });
    return NextResponse.json({ success: true, stockHistory });
  } catch (error: any) {
    console.error("[FETCH STOCK HISTORY]", error);
    return NextResponse.json(
      { error: "Failed to fetch stock history", details: error.message },
      { status: 500 }
    );
  }
}
