
import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { storage } from '@/utils/storage';
import { apiService } from '@/utils/api';
import { toast } from '@/hooks/use-toast';
import { Users, Heart, CheckCircle } from 'lucide-react';

const Dispensing: React.FC = () => {
  const currentUser = storage.getCurrentUser();
  const branchId = currentUser?.branchId;
  
  const [dispensings, setDispensings] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [medicalDevices, setMedicalDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedMedicines, setSelectedMedicines] = useState<Array<{medicineId: string, quantity: number}>>([]);
  const [selectedDevices, setSelectedDevices] = useState<Array<{deviceId: string, quantity: number}>>([]);

  useEffect(() => {
    fetchData();
  }, [branchId]);

  const fetchData = async () => {
    try {
      const [dispensingsRes, medicinesRes, devicesRes, employeesRes, patientsRes, categoriesRes] = await Promise.all([
        apiService.getDispensingRecords(branchId),
        apiService.getMedicines(branchId),
        apiService.getMedicalDevices(branchId),
        apiService.getEmployees(branchId),
        apiService.getPatients(branchId),
        apiService.getCategories()
      ]);

      if (dispensingsRes.data) setDispensings(dispensingsRes.data);
      if (medicinesRes.data) setMedicines(medicinesRes.data.filter(m => m.quantity > 0));
      if (devicesRes.data) setMedicalDevices(devicesRes.data.filter(d => d.quantity > 0));
      if (employeesRes.data) setEmployees(employeesRes.data);
      if (patientsRes.data) setPatients(patientsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching dispensing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedicinesByCategory = (categoryId: string) => {
    return medicines.filter(medicine => medicine.category_id === categoryId);
  };

  const getDevicesByCategory = (categoryId: string) => {
    return medicalDevices.filter(device => device.category_id === categoryId);
  };

  const updateSelectedMedicine = (index: number, medicineId: string, quantity: number) => {
    const updated = [...selectedMedicines];
    updated[index] = { medicineId, quantity };
    setSelectedMedicines(updated);
  };

  const updateSelectedDevice = (index: number, deviceId: string, quantity: number) => {
    const updated = [...selectedDevices];
    updated[index] = { deviceId, quantity };
    setSelectedDevices(updated);
  };

  const medicinesPayload = selectedMedicines
    .filter((r) => r.medicineId && r.quantity >= 0)
    .map((r) => ({ id: r.medicineId, quantity: r.quantity }));

  const devicesPayload = selectedDevices
    .filter((r) => r.deviceId && r.quantity >= 0)
    .map((r) => ({ id: r.deviceId, quantity: r.quantity }));

  const hasInsufficientStock =
    selectedMedicines.some((s) => {
      const med = medicines.find((m) => m.id === s.medicineId);
      return s.quantity > 0 && med && s.quantity > med.quantity;
    }) ||
    selectedDevices.some((s) => {
      const dev = medicalDevices.find((d) => d.id === s.deviceId);
      return s.quantity > 0 && dev && s.quantity > dev.quantity;
    });

  const hasItemsToDispense = medicinesPayload.length > 0 || devicesPayload.length > 0;

  const handleDispense = async () => {
    if (!selectedEmployee || !selectedPatient || !hasItemsToDispense) {
      toast({ title: 'Ошибка', description: 'Выберите сотрудника, пациента и товары для выдачи', variant: 'destructive' });
      return;
    }

    if (hasInsufficientStock) {
      toast({ title: 'Ошибка', description: 'Недостаточно товаров на складе', variant: 'destructive' });
      return;
    }

    const patient = patients.find(p => p.id === selectedPatient);
    const employee = employees.find(e => e.id === selectedEmployee);
    const payload = {
      patient_id: selectedPatient,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}` : '',
      employee_id: selectedEmployee,
      employee_name: employee ? `${employee.first_name} ${employee.last_name}` : '',
      branch_id: branchId!,
      medicines: medicinesPayload,
      medical_devices: devicesPayload,
    };

    try {
      const response = await apiService.createDispensingRecord(payload);
      if (response.error) {
        try {
          const detail = JSON.parse(response.error);
          if (detail.code === 'insufficient_stock') {
            const msg = detail.items
              .map((i: any) => `${i.type}: запрошено ${i.requested}, доступно ${i.available}`)
              .join('\n');
            toast({ title: 'Недостаточно товаров', description: msg, variant: 'destructive' });
          } else {
            toast({ title: 'Ошибка', description: response.error, variant: 'destructive' });
          }
        } catch {
          toast({ title: 'Ошибка', description: response.error, variant: 'destructive' });
        }
        return;
      }

      // Deduct stock locally
      setMedicines((prev) =>
        prev
          .map((m) => {
            const used = medicinesPayload.find((mp) => mp.id === m.id);
            return used ? { ...m, quantity: m.quantity - used.quantity } : m;
          })
          .filter((m) => m.quantity > 0),
      );

      setMedicalDevices((prev) =>
        prev
          .map((d) => {
            const used = devicesPayload.find((dp) => dp.id === d.id);
            return used ? { ...d, quantity: d.quantity - used.quantity } : d;
          })
          .filter((d) => d.quantity > 0),
      );

      // Reset quantities for dispensed rows
      setSelectedMedicines((prev) =>
        prev.map((m) =>
          medicinesPayload.find((mp) => mp.id === m.medicineId)
            ? { ...m, quantity: 0 }
            : m,
        ),
      );
      setSelectedDevices((prev) =>
        prev.map((d) =>
          devicesPayload.find((dp) => dp.id === d.deviceId)
            ? { ...d, quantity: 0 }
            : d,
        ),
      );

      // refresh dispensing history
      const dispRes = await apiService.getDispensingRecords(branchId);
      if (dispRes.data) setDispensings(dispRes.data);

      toast({ title: 'Выдача успешно сохранена' });

      await apiService
        .markDispensedOnCalendar(selectedPatient, new Date().toISOString())
        .catch(() => {});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось выдать товары';
      toast({ title: 'Ошибка', description: message, variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Загрузка...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Выдача лекарств</h1>
        <p className="text-gray-600 mt-2">Выдача лекарств пациентам</p>
      </div>

      {/* Dispensing form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Выдать лекарства</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label>Выберите сотрудника</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите сотрудника" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Выберите пациента</Label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите пациента" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name} - {patient.illness}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-6">
          <Label className="text-lg font-semibold">Товары для выдачи по категориям</Label>
          
          {/* Render categories */}
          {categories.map((category) => {
            const categoryMedicines = getMedicinesByCategory(category.id);
            const categoryDevices = getDevicesByCategory(category.id);

            if (categoryMedicines.length === 0 && categoryDevices.length === 0) return null;

            const medicineSelection = selectedMedicines.find((m) =>
              categoryMedicines.some((cm) => cm.id === m.medicineId),
            );
            const medicineItem = medicines.find((m) => m.id === medicineSelection?.medicineId);
            const medicineInsufficient =
              medicineSelection &&
              medicineItem &&
              medicineSelection.quantity > medicineItem.quantity;

            const deviceSelection = selectedDevices.find((d) =>
              categoryDevices.some((cd) => cd.id === d.deviceId),
            );
            const deviceItem = medicalDevices.find((d) => d.id === deviceSelection?.deviceId);
            const deviceInsufficient =
              deviceSelection &&
              deviceItem &&
              deviceSelection.quantity > deviceItem.quantity;

            return (
              <div key={category.id} className="mb-4 p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">{category.name}</h3>

                {/* Medicines in this category */}
                {categoryMedicines.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <Label>Лекарство</Label>
                      <Select
                        value={medicineSelection?.medicineId || ''}
                        onValueChange={(value) => {
                          if (medicineSelection) {
                            const index = selectedMedicines.indexOf(medicineSelection);
                            updateSelectedMedicine(index, value, medicineSelection.quantity);
                          } else {
                            setSelectedMedicines([
                              ...selectedMedicines,
                              { medicineId: value, quantity: 0 },
                            ]);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите лекарство" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryMedicines.map((medicine) => (
                            <SelectItem key={medicine.id} value={medicine.id}>
                              {medicine.name} (остаток: {medicine.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Количество</Label>
                      <Input
                        inputMode="numeric"
                        pattern="^[0-9]*$"
                        value={medicineSelection?.quantity ?? 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          if (medicineSelection) {
                            const index = selectedMedicines.indexOf(medicineSelection);
                            updateSelectedMedicine(index, medicineSelection.medicineId, value);
                          }
                        }}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          if (medicineSelection) {
                            const index = selectedMedicines.indexOf(medicineSelection);
                            updateSelectedMedicine(index, medicineSelection.medicineId, isNaN(value) ? 0 : value);
                          }
                        }}
                      />
                      {medicineInsufficient && (
                        <p className="text-sm text-red-500 mt-1">
                          Недостаточно на складе (доступно: {medicineItem?.quantity})
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Medical devices in this category */}
                {categoryDevices.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>ИМН</Label>
                      <Select
                        value={deviceSelection?.deviceId || ''}
                        onValueChange={(value) => {
                          if (deviceSelection) {
                            const index = selectedDevices.indexOf(deviceSelection);
                            updateSelectedDevice(index, value, deviceSelection.quantity);
                          } else {
                            setSelectedDevices([
                              ...selectedDevices,
                              { deviceId: value, quantity: 0 },
                            ]);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите ИМН" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryDevices.map((device) => (
                            <SelectItem key={device.id} value={device.id}>
                              {device.name} (остаток: {device.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Количество</Label>
                      <Input
                        inputMode="numeric"
                        pattern="^[0-9]*$"
                        value={deviceSelection?.quantity ?? 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          if (deviceSelection) {
                            const index = selectedDevices.indexOf(deviceSelection);
                            updateSelectedDevice(index, deviceSelection.deviceId, value);
                          }
                        }}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value || '0', 10);
                          if (deviceSelection) {
                            const index = selectedDevices.indexOf(deviceSelection);
                            updateSelectedDevice(index, deviceSelection.deviceId, isNaN(value) ? 0 : value);
                          }
                        }}
                      />
                      {deviceInsufficient && (
                        <p className="text-sm text-red-500 mt-1">
                          Недостаточно на складе (доступно: {deviceItem?.quantity})
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Button
          onClick={handleDispense}
          disabled={!selectedEmployee || !selectedPatient || !hasItemsToDispense || hasInsufficientStock}
        >
          Выдать товары
        </Button>
      </div>

      {/* Recent dispensings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">История выдач</h2>
        </div>
        <div className="p-6">
          {dispensings.length > 0 ? (
            <div className="space-y-4">
              {dispensings.slice(-10).reverse().map((dispensing) => (
                <div key={dispensing.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1" />
                      <div>
                        <h3 className="font-semibold">Выдача #{dispensing.id.slice(-8)}</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <Heart className="h-4 w-4 mr-1 text-red-500" />
                            <span>Пациент: {dispensing.patient_name}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1 text-blue-500" />
                            <span>Сотрудник: {dispensing.employee_name}</span>
                          </div>
                          <p>Дата: {new Date(dispensing.date).toLocaleString('ru-RU')}</p>
                          {dispensing.medicines && dispensing.medicines.length > 0 && (
                            <div>
                              <p className="font-medium">Лекарства:</p>
                              {dispensing.medicines.map((medicine: any, idx: number) => (
                                <p key={idx} className="ml-4">• {medicine.medicine_name} - {medicine.quantity} шт.</p>
                              ))}
                            </div>
                          )}
                          {dispensing.medical_devices && dispensing.medical_devices.length > 0 && (
                            <div>
                              <p className="font-medium">ИМН:</p>
                              {dispensing.medical_devices.map((device: any, idx: number) => (
                                <p key={idx} className="ml-4">• {device.device_name} - {device.quantity} шт.</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Выдано
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">История выдач пуста</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dispensing;
