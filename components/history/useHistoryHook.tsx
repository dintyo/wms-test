import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Transaction } from './types';

const useHistoryHook = (initialTransactions?: Transaction[]) => {
  const [transactions, setTransactions] = useState<Transaction[]>(
    initialTransactions || []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [undoingIds, setUndoingIds] = useState<Set<string>>(new Set());

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stock/history');
      if (!response.ok) throw new Error('Failed to fetch stock history');
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load stock history',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndo = async (transactionId: string) => {
    try {
      // Add this ID to undoing set
      setUndoingIds((prev) => new Set(prev).add(transactionId));
      setTransactions((currentTransactions) =>
        currentTransactions.map((transaction) =>
          transaction.id === transactionId
            ? {
                ...transaction,
                status: 'UNDONE',
                undoneAt: new Date().toISOString()
              }
            : transaction
        )
      );
      const response = await fetch(`/api/stock/history/undo/${transactionId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        setTransactions((currentTransactions) =>
          currentTransactions.map((transaction) =>
            transaction.id === transactionId
              ? {
                  ...transaction,
                  status: 'COMPLETED',
                  undoneAt: null
                }
              : transaction
          )
        );
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to undo transaction',
        variant: 'destructive'
      });
    } finally {
      // Remove this ID from undoing set
      setUndoingIds((prev) => {
        const next = new Set(prev);
        next.delete(transactionId);
        return next;
      });
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  return {
    transactions,
    isLoading,
    error,
    handleUndo,
    isUndoingId: (id: string) => undoingIds.has(id)
  };
};
export default useHistoryHook;
