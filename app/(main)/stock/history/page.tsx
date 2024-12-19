import { StockHistoryTable } from '@/components/history';

export default function StockHistoryPage() {
  return (
    <div className='container mx-auto py-6'>
      <h1 className='text-2xl font-bold mb-4'>Stock History</h1>
      <StockHistoryTable />
    </div>
  );
}
