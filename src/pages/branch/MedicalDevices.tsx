import React, { useState, useEffect } from 'react';
import { apiService } from '@/utils/api';
import { storage } from '@/utils/storage';
import { Package, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BranchMedicalDevices: React.FC = () => {
  const currentUser = storage.getCurrentUser();
  const branchId = currentUser?.branchId;
  
  const [devices, setDevices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const fetchData = async () => {
    try {
      const [devicesRes, categoriesRes] = await Promise.all([
        apiService.getMedicalDevices(branchId),
        apiService.getMedicalDeviceCategories()
      ]);
      
      setDevices(devicesRes?.data || []);
      setCategories(categoriesRes?.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Без категории';
  };

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryName(device.category_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Загрузка ИМН...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Изделия медицинского назначения</h1>
        <p className="text-muted-foreground">Просмотр ИМН в филиале</p>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск ИМН..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDevices.map((device) => (
          <Card key={device.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{device.name}</CardTitle>
              <Badge variant="secondary">{getCategoryName(device.category_id)}</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Цена закупки:</span>
                  <span className="font-medium">{device.purchase_price?.toFixed(2)} ₸</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Количество:</span>
                  <Badge variant={device.quantity > 10 ? "default" : device.quantity > 0 ? "secondary" : "destructive"}>
                    {device.quantity} шт.
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="text-center py-8">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {searchTerm ? 'ИМН не найдены' : 'ИМН пока нет'}
          </p>
        </div>
      )}
    </div>
  );
};

export default BranchMedicalDevices;