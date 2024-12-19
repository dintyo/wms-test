"use client";

import { useEffect, useState } from "react";
import { StockHistory } from "@/components/stock-history";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

export default function StockHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [undoLoading, setUndoLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<"type" | "status" | "createdAt">("createdAt");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch("/api/transactions/history");
        if (!response.ok) throw new Error("Failed to fetch transactions");
        const data = await response.json();
        setTransactions(data);
        setFilteredTransactions(data); // Initialize filtered transactions
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        toast({
          title: "Error",
          description: "Failed to fetch transactions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleUndo = async (transactionId: string) => {
    setUndoLoading(true);
    try {
      const response = await fetch(`/api/transactions/undo/${transactionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user123" }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Transaction undone successfully",
        });
        setTransactions((prev) =>
          prev.map((txn) =>
            txn.id === transactionId ? { ...txn, status: "UNDONE" } : txn
          )
        );
      } else {
        const { error } = await response.json();
        toast({
          title: "Error",
          description: error || "Failed to undo transaction",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to undo transaction:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setUndoLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const lowerCaseQuery = query.toLowerCase();
    setFilteredTransactions(
      transactions.filter((txn) =>
        txn.item.sku.toLowerCase().includes(lowerCaseQuery) ||
        txn.item.name.toLowerCase().includes(lowerCaseQuery)
      )
    );
  };

  const handleSort = (option: "type" | "status" | "createdAt") => {
    setSortOption(option);
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
      if (option === "createdAt") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a[option].localeCompare(b[option]);
    });
    setFilteredTransactions(sortedTransactions);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size={64} className="mr-2 h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full py-6">
      <h1 className="text-2xl font-bold mb-6">Stock History</h1>

      <div className="flex justify-end items-center gap-8 mb-6">
        <div className="flex flex-col space-y-1">
          <Label htmlFor="search" className="text-sm font-medium">
            Search
          </Label>
          <Input
            id="search"
            type="text"
            placeholder="SKU or Name"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-xs text-sm px-8 py-2 border-gray-300 rounded-md"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <Label htmlFor="sort" className="text-sm font-medium">
            Sort By
          </Label>
          <Select
            value={sortOption}
            onValueChange={(value) => handleSort(value as "type" | "status" | "createdAt")}
          >
            <SelectTrigger id="sort" className="max-w-xs text-sm px-8 py-2">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="type">Type</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="createdAt">Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {filteredTransactions.length > 0 ? (
        <StockHistory
          transactions={filteredTransactions}
          onUndo={handleUndo}
          loading={undoLoading}
        />
      ) : (
        <p className="text-gray-500">No transactions found.</p>
      )}
    </div>
  );
}
