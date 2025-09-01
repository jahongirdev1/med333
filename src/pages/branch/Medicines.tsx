import React, { useState, useEffect } from 'react';
import { apiService } from '@/utils/api';
import { storage } from '@/utils/storage';
import { Package, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const BranchMedicines: React.FC = () => {
  const currentUser = storage.getCurrentUser();
  const branchId = currentUser?.branchId;

  const [items, setItems] = useState<any[]>([]);
  const [catMap, setCatMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [branchId]);

  useEffect(() => {
    (async () => {
      const res = await apiService.getCategories?.('medicine');
      const arr = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      const map: Record<string, string> = {};
      arr.forEach((c: any) => { if (c?.id) map[c.id] = c.name; });
      setCatMap(map);
    })();
  }, []);

  const fetchData = async () => {
    try {
      const medsRes = await apiService.getMedicines(branchId);
      setItems(medsRes?.data || []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((med: any) => {
    const catId = med.category_id ?? med.categoryId ?? '';
    const catName = catMap[catId] ?? '—';
    return (
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      catName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Загрузка лекарств...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Лекарства</h1>
        <p className="text-muted-foreground">Просмотр лекарств в филиале</p>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead className="text-right">Количество</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((med) => {
              const catId = med.category_id ?? med.categoryId ?? '';
              const catName = catMap[catId] ?? '—';
              return (
                <TableRow key={med.id}>
                  <TableCell className="font-medium">{med.name}</TableCell>
                  <TableCell>{catName}</TableCell>
                  <TableCell className="text-right">{(med.quantity ?? 0)} шт.</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-8">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {searchTerm ? 'Лекарства не найдены' : 'Лекарства пока нет'}
          </p>
        </div>
      )}
    </div>
  );
};

export default BranchMedicines;
