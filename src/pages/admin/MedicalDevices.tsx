import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/utils/api';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

interface Device {
  id: string;
  name: string;
  category_id: string;
  purchase_price: number;
  quantity: number;
}

interface Category {
  id: string;
  name: string;
}

const AdminMedicalDevices: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    purchase_price: 0,
    quantity: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [devicesResult, categoriesResult] = await Promise.all([
        apiService.getMedicalDevices(),
        apiService.getMedicalDeviceCategories(),
      ]);
      if (devicesResult.data) setDevices(devicesResult.data as Device[]);
      if (categoriesResult.data) setCategories(categoriesResult.data as Category[]);
    } catch (error) {
      toast({ title: "Ошибка", description: "Не удалось загрузить данные", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', category_id: '', purchase_price: 0, quantity: 0 });
    setEditingDevice(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category_id || !formData.purchase_price || !formData.quantity) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля и выберите категорию',
        variant: 'destructive',
      });
      return;
    }

    try {
      const payload = { ...formData, sell_price: 0 };
      if (editingDevice) {
        const result = await apiService.updateMedicalDevice(editingDevice.id, payload);
        if (!result.error) {
          setDevices((prev) =>
            prev.map((d) => (d.id === editingDevice.id ? { ...payload, id: editingDevice.id } : d))
          );
          toast({ title: 'Успешно', description: 'ИМН обновлено' });
        } else {
          toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
        }
      } else {
        const result = await apiService.createMedicalDevice(payload);
        if (result.data) {
          setDevices((prev) => [...prev, result.data as Device]);
          toast({ title: 'Успешно', description: 'ИМН создано' });
        } else {
          toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
        }
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: editingDevice ? 'Не удалось обновить ИМН' : 'Не удалось создать ИМН',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      category_id: device.category_id,
      purchase_price: device.purchase_price,
      quantity: device.quantity,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить это ИМН?')) {
      try {
        const result = await apiService.deleteMedicalDevice(id);
        if (!result.error) {
          setDevices((prev) => prev.filter((d) => d.id !== id));
          toast({ title: 'Успешно', description: 'ИМН удалено' });
        } else {
          toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
        }
      } catch (error) {
        toast({ title: 'Ошибка', description: 'Не удалось удалить ИМН', variant: 'destructive' });
      }
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Загрузка...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Изделия медицинского назначения</h1>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />Добавить ИМН
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDevice ? 'Редактировать ИМН' : 'Создать новое ИМН'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Название</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <Label>Категория</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Цена закупки</Label>
                <Input
                  type="number"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Количество</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSubmit} className="flex-1">
                  {editingDevice ? 'Обновить' : 'Создать'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Отмена
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Список ИМН ({devices.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Количество</TableHead>
                <TableHead>Цена закупки</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>{device.name}</TableCell>
                  <TableCell>{device.quantity}</TableCell>
                  <TableCell>{device.purchase_price}₸</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(device)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(device.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {devices.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ИМН не добавлены</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMedicalDevices;