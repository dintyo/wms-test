export type Transaction = {
  id: string;
  type: string;
  quantity: number;
  status: string;
  createdAt: string;
  undoneAt: string | null;
  item: { sku: string; name: string };
  fromLocation?: { label: string };
  toLocation?: { label: string };
};
