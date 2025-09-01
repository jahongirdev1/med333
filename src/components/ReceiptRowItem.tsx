import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

export interface ReceiptRow {
  id: string;
  itemType: 'medicine' | 'medical_device';
  itemId: string | null;
  itemName: string;
  qty: number;
}

interface CatalogItem {
  id: string;
  name: string;
  quantity?: number;
  branch_id?: string | null;
}

interface ReceiptRowItemProps {
  row: ReceiptRow;
  medicines: CatalogItem[];
  devices: CatalogItem[];
  onUpdate: (id: string, field: keyof ReceiptRow, value: unknown) => void;
  onRemove: (id: string) => void;
  activeTab: 'medicine' | 'medical_device';
}

const ReceiptRowItem: React.FC<ReceiptRowItemProps> = ({
  row,
  medicines,
  devices,
  onUpdate,
  onRemove,
  activeTab,
}) => {
  const options = activeTab === 'medicine' ? medicines : devices;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
      <div>
        <Label>{activeTab === 'medicine' ? 'Лекарство' : 'ИМН'}</Label>
        <Select
          value={row.itemId ?? ''}
          onValueChange={(val) => {
            const item = options.find((i) => i.id === val);
            onUpdate(row.id, 'itemId', val);
            onUpdate(row.id, 'itemName', item?.name ?? '');
          }}
          disabled={options.length === 0}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={activeTab === 'medicine' ? 'Выберите лекарство' : 'Выберите ИМН'}
            />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name} (текущее: {o.quantity ?? 0} шт.)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Количество</Label>
        <Input
          type="number"
          value={row.qty}
          min={1}
          onChange={(e) =>
            onUpdate(row.id, 'qty', Math.max(1, Number(e.target.value) || 0))
          }
        />
      </div>
      <div className="flex items-end">
        <Button
          variant="destructive"
          onClick={() => onRemove(row.id)}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Удалить
        </Button>
      </div>
    </div>
  );
};

export default ReceiptRowItem;

