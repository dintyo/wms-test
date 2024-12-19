"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  type: string;
  status: string;
  quantity: number;
  item: {
    sku: string;
    name: string;
  };
  fromLocation?: {
    label: string;
  } | null;
  toLocation?: {
    label: string;
  } | null;
  createdAt: string;
}

interface StockHistoryProps {
  transactions: Transaction[];
  onUndo: (transactionId: string) => Promise<void>;
  loading: boolean;
}

export function StockHistory({
  transactions,
  onUndo,
  loading,
}: StockHistoryProps) {
  return (
    <div className="space-y-6">
      {transactions.length > 0 ? (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>From Location</TableHead>
                <TableHead>To Location</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell>
                    {new Date(txn.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{txn.type}</TableCell>
                  <TableCell>{txn.item.sku}</TableCell>
                  <TableCell>{txn.item.name}</TableCell>
                  <TableCell>
                    {txn.fromLocation?.label || "-"}
                  </TableCell>
                  <TableCell>{txn.toLocation?.label || "-"}</TableCell>
                  <TableCell className="text-right">{txn.quantity}</TableCell>
                  <TableCell>
                    <span
                      className={
                        txn.status === "COMPLETED"
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {txn.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {txn.status === "COMPLETED" && (
                      <Button
                        onClick={() => onUndo(txn.id)}
                        disabled={loading}
                        className="flex-1 sm:flex-none"
                      >
                        {loading ? "Undoing..." : "Undo"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          No stock history found.
        </p>
      )}
    </div>
  );
}
