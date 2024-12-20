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
import { TransactionStatus } from "@prisma/client";

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
  onRedo: (transactionId: string) => Promise<void>;
  undoLoading: boolean;
  redoLoading: boolean;
}

export function StockHistory({
    transactions,
    onUndo,
    onRedo,
    undoLoading,
    redoLoading,
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
                          txn.status === TransactionStatus.COMPLETED ? "text-green-500" : TransactionStatus.UNDONE ? "text-red-500" : "text-yellow-500"
                        }
                      >
                        {txn.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {txn.status !== TransactionStatus.UNDONE && (
                        <Button
                          onClick={() => onUndo(txn.id)}
                          disabled={undoLoading}
                          className="flex-1 sm:flex-none"
                        >
                          {undoLoading ? "Undoing..." : "Undo"}
                        </Button>
                      )}
                      {txn.status === TransactionStatus.UNDONE && (
                        <Button
                          onClick={() => onRedo(txn.id)}
                          disabled={redoLoading}
                          className="flex-1 sm:flex-none bg-green-500"
                        >
                          {redoLoading ? "Redoing..." : "Redo"}
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
  
