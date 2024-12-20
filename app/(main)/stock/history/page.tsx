"use client"; // This will make the component a Client Component

import React, { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Item {
  sku: string;
  name: string;
  quantity: number;
}

interface FromLocation {
  id: string;
  label: string;
}

interface ToLocation {
  id: string;
  label: string;
}

interface StockHistoryEntry {
  id: string;
  createdAt: string;
  type: string;
  item: Item;
  fromLocation: FromLocation;
  toLocation: ToLocation;
  status: "COMPLETED" | "UNDONE";
}

const StockHistoryPage: React.FC = () => {
  const [stockHistory, setStockHistory] = useState<StockHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStockHistory = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/stock/history");
        const data = await response.json();

        if (Array.isArray(data.stockHistory)) {
          setStockHistory(data.stockHistory);
        } else {
          toast({
            variant: "destructive",
            title: "Invalid data format",
            description: "Something went wrong while fetching stock history.",
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to fetch stock history",
          description: "Failed to fetch stock history.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStockHistory();
  }, []);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("en-US");
    const formattedTime = date.toLocaleTimeString("en-US", { hour12: false });
    return `${formattedDate} ${formattedTime}`;
  };

  const handleUndo = async (transactionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stock/undo/${transactionId}`, { method: "POST" });
      if (response.ok) {
        toast({
          variant: "success",
          title: "Transaction Undone",
          description: "The stock transaction has been undone successfully.",
        });
        setStockHistory((prevState) =>
          prevState.map((entry) =>
            entry.id === transactionId ? { ...entry, status: "UNDONE" } : entry
          )
        );
      } else {
        toast({
          variant: "destructive",
          title: "Undo Failed",
          description: "Something went wrong while undoing the transaction.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Undo Failed",
        description: "Something went wrong while undoing the transaction.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRedo = async (transactionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stock/redo/${transactionId}`, { method: 'POST' });
      if (response.ok) {
        toast({
          variant: 'success',
          title: 'Transaction Redone',
          description: 'The stock transaction has been redone successfully.',
        });
        setStockHistory((prevState) =>
          prevState.map((entry) =>
            entry.id === transactionId
              ? { ...entry, status: 'COMPLETED' }
              : entry
          )
        );
      } else {
        toast({
          variant: 'destructive',
          title: 'Redo Failed',
          description: 'Something went wrong while redoing the transaction.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Redo Failed',
        description: 'Something went wrong while redoing the transaction.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Stock History</h1>
      {loading && <div className="animate-spin">Loading...</div>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date/Time</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Locations</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stockHistory?.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{formatDateTime(entry.createdAt)}</TableCell>
              <TableCell>{entry.type}</TableCell>
              <TableCell>{entry.item.name}</TableCell>
              <TableCell>
                {entry.fromLocation.label} to {entry.toLocation.label}
              </TableCell>
              <TableCell>{entry.status}</TableCell>
              <TableCell>
              {entry.status === "COMPLETED" && (
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={() => handleUndo(entry.id)}
                  >
                    Undo
                  </button>
                )}
                {entry.status === "UNDONE" && (
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded"
                    onClick={() => handleRedo(entry.id)}
                  >
                    Redo
                  </button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default StockHistoryPage;
