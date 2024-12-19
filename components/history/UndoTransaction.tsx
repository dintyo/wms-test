'use client';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import { Transaction } from './types';

type UndoTransactionProps = {
  transaction: Transaction;
  onUndo: (id: string) => Promise<void>;
  isUndoingId: (id: string) => boolean;
};

export default function UndoTransaction({
  transaction,
  onUndo,
  isUndoingId
}: UndoTransactionProps) {
  const isThisUndoing = isUndoingId(transaction.id);

  return (
    <TableCell>
      {transaction.status === 'COMPLETED' && (
        <Button
          variant='secondary'
          size='sm'
          onClick={() => onUndo(transaction.id)}
          disabled={isThisUndoing}
          className='min-w-[100px]'
        >
          {isThisUndoing ? 'Undoing...' : 'Undo'}
        </Button>
      )}
    </TableCell>
  );
}
