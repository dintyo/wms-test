'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { format } from 'date-fns';
import { FC } from 'react';
import { Transaction } from './types';
import UndoTransaction from './UndoTransaction';
import useHistoryHook from './useHistoryHook';

export const StockHistoryTable: FC = () => {
  const { transactions, isLoading, error, handleUndo, isUndoingId } =
    useHistoryHook();
  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-[200px]'>
        <p>Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex justify-center items-center min-h-[200px] text-red-500'>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date/Time</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Item</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions?.map((transaction: Transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>
              {format(new Date(transaction.createdAt), 'PPpp')}
            </TableCell>
            <TableCell>{transaction.type}</TableCell>
            <TableCell>{transaction.item.sku}</TableCell>
            <TableCell>{transaction.quantity}</TableCell>
            <TableCell>{transaction.fromLocation?.label || '-'}</TableCell>
            <TableCell>{transaction.toLocation?.label || '-'}</TableCell>
            <TableCell>{transaction.status}</TableCell>
            <UndoTransaction
              transaction={transaction}
              onUndo={handleUndo}
              isUndoingId={isUndoingId}
            />
          </TableRow>
        ))}
        {transactions?.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className='text-center'>
              No transactions found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
