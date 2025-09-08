import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/utils/api';

const ReportsWarehouse: React.FC = () => {
  const [type, setType] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateReport = async () => {
    if (!type) {
      toast({ title: 'Выберите тип отчёта', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      if (type === 'stock') {
        const data = await apiService.getWarehouseStock({ dateFrom, dateTo });
        setRows(data);
      } else {
        const data = await apiService.getWarehouseArrivals({ dateFrom, dateTo });
        setRows(data);
      }
    } catch {
      toast({ title: 'Ошибка получения отчёта', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    if (!type) {
      toast({ title: 'Выберите тип отчёта', variant: 'destructive' });
      return;
    }
    try {
      if (type === 'stock') {
        await apiService.exportWarehouseStockXlsx({ dateFrom, dateTo });
      } else {
        await apiService.exportWarehouseArrivalsXlsx({ dateFrom, dateTo });
      }
    } catch {
      toast({ title: 'Ошибка экспорта', variant: 'destructive' });
    }
  };

  const renderTable = () => {
    if (rows.length === 0) return null;
    if (type === 'stock') {
      return (
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Количество</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{row.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    return (
      <Table className="mt-4">
        <TableHeader>
          <TableRow>
            <TableHead>Дата и время</TableHead>
            <TableHead>Поступило</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>{row.datetime || row.date || row.created_at}</TableCell>
              <TableCell>
                {(row.items || []).map((i: any) => `${i.name} — ${i.quantity ?? i.qty}`).join('; ')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Отчёты склада</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <Label>Тип отчёта</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stock">Остатки</SelectItem>
                <SelectItem value="arrivals">Поступления</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Дата с</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label>Дата по</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={generateReport} disabled={loading}>Сгенерировать отчёт</Button>
            <Button variant="outline" onClick={exportReport}>Экспорт в Excel</Button>
          </div>
        </div>
        {renderTable()}
      </CardContent>
    </Card>
  );
};

export default ReportsWarehouse;
