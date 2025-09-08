import type { DispensingRow, IncomingRow } from '@/types';

export const API_BASE_URL = 'http://localhost:8000';

interface LoginData {
  login: string;
  password: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
      });

      if (!response.ok) {
        let detail = `HTTP error! status: ${response.status}`;
        try {
          const maybeJson = await response.json();
          if (maybeJson?.detail) {
            detail = typeof maybeJson.detail === 'string'
              ? maybeJson.detail
              : JSON.stringify(maybeJson.detail);
          }
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      return { data };
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private normalizeData<T = any>(res: any): T {
    // Some endpoints return { data: [...] }, others { data: { data: [...] } }
    if (!res) return [] as any;
    if (Array.isArray(res)) return res as any;
    if (res?.data?.data) return res.data.data as T;
    if (res?.data) return res.data as T;
    return res as T;
  }

  private normalizeArray<T = any>(res: any): T[] {
    // Accept { data: [...] } OR [...] OR fallback to []
    if (Array.isArray(res?.data?.data)) return res.data.data as T[];
    if (Array.isArray(res?.data)) return res.data as T[];
    if (Array.isArray(res)) return res as T[];
    return [];
  }

  private async requestWithFallback<T = any>(paths: string[]): Promise<{ data?: T; error?: string }> {
    let lastErr: string | undefined;
    for (const p of paths) {
      const res = await this.request<T>(p);
      if (!res?.error) return res;
      lastErr = res.error;
    }
    return { error: lastErr ?? 'Unknown error' };
  }

  async download(url: string) {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const disposition = res.headers.get('content-disposition');
    let fileName = 'report.xlsx';
    if (disposition) {
      const match = /filename="?([^";]+)"?/i.exec(disposition);
      if (match && match[1]) fileName = match[1];
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  // Auth
  async login(credentials: LoginData) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Users
  async getUsers() {
    return this.request<any[]>('/users');
  }

  async createUser(user: any) {
    return this.request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(userId: string, user: any) {
    return this.request<any>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(userId: string) {
    return this.request<any>(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Branches
  async getBranches() {
    return this.request<any[]>('/branches');
  }

  async createBranch(branch: any) {
    return this.request<any>('/branches', {
      method: 'POST',
      body: JSON.stringify(branch),
    });
  }

  async updateBranch(branchId: string, branch: any) {
    return this.request<any>(`/branches/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify(branch),
    });
  }

  async deleteBranch(branchId: string) {
    return this.request<any>(`/branches/${branchId}`, {
      method: 'DELETE',
    });
  }

  // Medicines
  async getMedicines(branchId?: string) {
    const params = branchId ? `?branch_id=${branchId}` : '';
    return this.request<any[]>(`/medicines${params}`);
  }

  async createMedicine(medicine: any) {
    return this.request<any>('/medicines', {
      method: 'POST',
      body: JSON.stringify(medicine),
    });
  }

  async updateMedicine(medicineId: string, medicine: any) {
    return this.request<any>(`/medicines/${medicineId}`, {
      method: 'PUT',
      body: JSON.stringify(medicine),
    });
  }

  async deleteMedicine(medicineId: string) {
    return this.request<any>(`/medicines/${medicineId}`, {
      method: 'DELETE',
    });
  }

  // Employees
  async getEmployees(branchId?: string) {
    const params = branchId ? `?branch_id=${branchId}` : '';
    return this.request<any[]>(`/employees${params}`);
  }

  async createEmployee(employee: any) {
    return this.request<any>('/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    });
  }

  async updateEmployee(employeeId: string, employee: any) {
    return this.request<any>(`/employees/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(employee),
    });
  }

  async deleteEmployee(employeeId: string) {
    return this.request<any>(`/employees/${employeeId}`, {
      method: 'DELETE',
    });
  }

  // Patients
  async getPatients(branchId?: string) {
    const params = branchId ? `?branch_id=${branchId}` : '';
    return this.request<any[]>(`/patients${params}`);
  }

  async createPatient(patient: any) {
    return this.request<any>('/patients', {
      method: 'POST',
      body: JSON.stringify(patient),
    });
  }

  async updatePatient(patientId: string, patient: any) {
    return this.request<any>(`/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(patient),
    });
  }

  async deletePatient(patientId: string) {
    return this.request<any>(`/patients/${patientId}`, {
      method: 'DELETE',
    });
  }

  // Transfers
  async getTransfers(branchId?: string) {
    const params = branchId ? `?branch_id=${branchId}` : '';
    return this.request<any[]>(`/transfers${params}`);
  }

  async createTransfers(transfers: any[]) {
    return this.request<any>('/transfers', {
      method: 'POST',
      body: JSON.stringify({ transfers }),
    });
  }

  // Dispensings
  async getDispensings(branchId?: string) {
    const params = branchId ? `?branch_id=${branchId}` : '';
    const res = await this.request<any>(`/dispensing_records${params}`);
    if (res.data && 'data' in res.data) {
      return { data: res.data.data };
    }
    return res;
  }

  // Arrivals
  // GET arrivals (optional filter by type)
  async getArrivals(itemType?: string) {
    const params = itemType ? `?item_type=${itemType}` : '';
    const res = await this.request<any>(`/arrivals${params}`);

    // Normalize to array
    if (Array.isArray(res?.data)) {
      return { data: res.data };
    }
    if (Array.isArray(res?.data?.data)) {
      return { data: res.data.data };
    }
    return { data: [] as any[] };
  }

  // POST arrivals
  createArrivals(arrivals: any[]) {
    return this.request<any>('/arrivals', {
      method: 'POST',
      body: JSON.stringify({ arrivals }),
    });
  }

  // Medical Device Categories (proxy to categories API)
  async getMedicalDeviceCategories() {
    // Use unified categories endpoint
    return this.request<any[]>(`/categories?type=medical_device`);
  }

  async createMedicalDeviceCategory(category: any) {
    return this.request<any>('/categories', {
      method: 'POST',
      body: JSON.stringify({ ...category, type: 'medical_device' }),
    });
  }

  async updateMedicalDeviceCategory(categoryId: string, categoryData: any) {
    return this.request<any>(`/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify({ ...categoryData, type: 'medical_device' }),
    });
  }

  async deleteMedicalDeviceCategory(categoryId: string) {
    return this.request<any>(`/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // Medical Devices
  async getMedicalDevices(branchId?: string) {
    const params = branchId ? `?branch_id=${branchId}` : '';
    return this.request<any[]>(`/medical_devices${params}`);
  }

  async createMedicalDevice(device: any) {
    return this.request<any>('/medical_devices', {
      method: 'POST',
      body: JSON.stringify(device),
    });
  }

  async updateMedicalDevice(deviceId: string, device: any) {
    return this.request<any>(`/medical_devices/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(device),
    });
  }

  async deleteMedicalDevice(deviceId: string) {
    return this.request<any>(`/medical_devices/${deviceId}`, {
      method: 'DELETE',
    });
  }

  // Shipments
  async getShipments(branchId?: string) {
    const url = branchId ? `/shipments?branch_id=${branchId}` : '/shipments';
    const res = await this.request<any>(url);
    if (res.data && 'data' in res.data) {
      return { data: res.data.data };
    }
    return res;
  }

  async createShipment(shipment: any) {
    return this.request<any>('/shipments', {
      method: 'POST',
      body: JSON.stringify(shipment),
    });
  }

  async acceptShipment(shipmentId: string) {
    return this.request<any>(`/shipments/${shipmentId}/accept`, {
      method: 'POST',
    });
  }

  async rejectShipment(shipmentId: string, reason: string) {
    return this.request<any>(`/shipments/${shipmentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async cancelShipment(shipmentId: string) {
    return this.request<any>(`/shipments/${shipmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled' }),
    });
  }

  async retryShipment(shipmentId: string) {
    return this.request<any>(`/shipments/${shipmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'pending' }),
    });
  }

  // Notifications
  async getNotifications(branchId: string) {
    return this.request<any[]>(`/notifications?branch_id=${branchId}`);
  }

  async markNotificationRead(notificationId: string) {
    return this.request<any>(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  // Reports
  async generateReport(params: any) {
    return this.request<any[]>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getReportDetails(reportType: string, itemId: string) {
    return this.request<any>(`/reports/${reportType}/${itemId}`);
  }

  // Warehouse reports
  async getWarehouseStock(params: { date_from?: string; date_to?: string }) {
    const qs = new URLSearchParams();
    if (params.date_from) qs.set('date_from', params.date_from);
    if (params.date_to) qs.set('date_to', params.date_to);
    const res = await this.request<any>(`/admin/warehouse/reports/stock?${qs.toString()}`);
    return { data: this.normalizeArray(res) };
  }

  async getWarehouseArrivals(params: { date_from?: string; date_to?: string }) {
    const qs = new URLSearchParams();
    if (params.date_from) qs.set('date_from', params.date_from);
    if (params.date_to) qs.set('date_to', params.date_to);
    const res = await this.request<any>(`/admin/warehouse/reports/arrivals?${qs.toString()}`);
    return { data: this.normalizeArray(res) };
  }

  async getWarehouseDispatches(params: { date_from?: string; date_to?: string }) {
    const qs = new URLSearchParams();
    if (params.date_from) qs.set('date_from', params.date_from);
    if (params.date_to) qs.set('date_to', params.date_to);
    const res = await this.request<any>(`/admin/warehouse/reports/dispatches?${qs.toString()}`);
    return { data: this.normalizeArray(res) };
  }

  async exportWarehouseStockXlsx(params: { date_from?: string; date_to?: string }) {
    const qs = new URLSearchParams();
    if (params.date_from) qs.set('date_from', params.date_from);
    if (params.date_to) qs.set('date_to', params.date_to);
    const url = `${API_BASE_URL}/admin/warehouse/reports/stock?${qs.toString()}&export=excel`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `warehouse_stock_${params.date_to || 'today'}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async exportWarehouseArrivalsXlsx(params: { date_from?: string; date_to?: string }) {
    const qs = new URLSearchParams();
    if (params.date_from) qs.set('date_from', params.date_from);
    if (params.date_to) qs.set('date_to', params.date_to);
    qs.set('export', 'excel');
    const response = await fetch(`${API_BASE_URL}/admin/warehouse/reports/arrivals?${qs.toString()}`);
    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition');
    let fileName = 'report.xlsx';
    if (disposition) {
      const match = /filename="?([^";]+)"?/i.exec(disposition);
      if (match && match[1]) fileName = match[1];
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async exportWarehouseDispatchesXlsx(params: { date_from?: string; date_to?: string }) {
    const qs = new URLSearchParams();
    if (params.date_from) qs.set('date_from', params.date_from);
    if (params.date_to) qs.set('date_to', params.date_to);
    const url = `${API_BASE_URL}/admin/warehouse/reports/dispatches?${qs.toString()}&export=excel`;
    return this.download(url);
  }

  // Categories (updated with type parameter)
  async getCategoriesByType(type?: string) {
    let url = '/categories';
    if (type) {
      url += `?type=${type}`;
    }
    return this.request<any[]>(url);
  }

  async updateCategory(categoryId: string, categoryData: any) {
    return this.request<any>(`/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(categoryId: string) {
    return this.request<any>(`/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // Medicine Categories
  async getMedicineCategories() {
    return this.request<any[]>('/medicine-categories');
  }

  async createMedicineCategory(categoryData: any) {
    return this.request<any>('/medicine-categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateMedicineCategory(categoryId: string, categoryData: any) {
    return this.request<any>(`/medicine-categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteMedicineCategory(categoryId: string) {
    return this.request<any>(`/medicine-categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // ---------- Calendar endpoints (admin + branch compatible) ----------

  // Monthly summary: which days have dispensings (optionally by branch)
  async getCalendarDispensingSummary(params: {
    start: string;    // 'YYYY-MM-01'
    end: string;      // 'YYYY-MM-30/31' (inclusive or exclusive is handled by backend)
    branch_id?: string;
  }) {
    const q = new URLSearchParams({ start: params.start, end: params.end });
    if (params.branch_id) q.set('branch_id', params.branch_id);
    q.set('aggregate', '1');

    const res = await this.requestWithFallback<{ date: string; count: number }[]>(
      [`/calendar/dispensing?${q.toString()}`, `/admin/calendar/dispensing?${q.toString()}`]
    );
    if (res.error) return res;

    return { data: this.normalizeData(res) };
  }

  // All records for a specific date (optionally by branch)
  async getDispensingByDate(params: { date: string; branch_id?: string }) {
    const q = new URLSearchParams({ date: params.date });
    if (params.branch_id) q.set('branch_id', params.branch_id);

    const res = await this.requestWithFallback<Array<{
      id: string;
      time: string; // 'HH:mm:ss'
      patient_name: string;
      employee_name: string;
      branch_name: string;
    }>>([`/calendar/dispensing?${q.toString()}`, `/admin/calendar/dispensing?${q.toString()}`]);

    if (res.error) return res;
    return { data: this.normalizeData(res) };
  }

  // Record details for modal
  async getDispensingRecord(recordId: string) {
    const res = await this.request<any>(`/dispensing_records/${recordId}`);
    if (res.error) return res;
    return { data: this.normalizeData(res) };
  }

  // Calendar
  async getDispensingCalendar(params: {
    branch_id: string;
    month: string;
    patient_id?: string;
  }) {
    let url = `/calendar/dispensing?branch_id=${params.branch_id}&month=${params.month}`;
    if (params.patient_id) {
      url += `&patient_id=${params.patient_id}`;
    }
    const res = await this.request<any>(url);
    if (res.data && 'data' in res.data) {
      return { data: res.data.data };
    }
    return res;
  }

  async getDispensingDayDetails(branchId: string, patientId: string, date: string) {
    const url = `/calendar/dispensing/day?branch_id=${branchId}&patient_id=${patientId}&date=${date}`;
    const res = await this.request<any>(url);
    if (res.data && 'data' in res.data) {
      return { data: res.data.data };
    }
    return res;
  }

  // Get dispensing records
  async getDispensingRecords(branchId?: string) {
    let url = '/dispensing_records';
    if (branchId) {
      url += `?branch_id=${branchId}`;
    }
    const res = await this.request<any>(url);
    if (res.data && 'data' in res.data) {
      return { data: res.data.data };
    }
    return res;
  }

  // Create dispensing record
  async createDispensingRecord(body: {
    patient_id: string;
    patient_name?: string;
    employee_id: string;
    employee_name?: string;
    branch_id: string;
    medicines: { id: string; name?: string; quantity: number }[];
    medical_devices: { id: string; name?: string; quantity: number }[];
  }) {
    return this.request<any>('/dispensing', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Legacy compatibility
  async createDispensingRecordLegacy(payload: {
    patient_id: string;
    employee_id: string;
    branch_id: string;
    items: { type: 'medicine' | 'medical_device'; item_id: string; quantity: number }[];
  }) {
    const medicines = payload.items
      .filter(i => i.type === 'medicine')
      .map(i => ({ id: i.item_id, quantity: i.quantity }));
    const medical_devices = payload.items
      .filter(i => i.type === 'medical_device')
      .map(i => ({ id: i.item_id, quantity: i.quantity }));
    return this.createDispensingRecord({
      patient_id: payload.patient_id,
      employee_id: payload.employee_id,
      branch_id: payload.branch_id,
      medicines,
      medical_devices,
    });
  }

  async getDispensingReport(params: { branch_id: string; date_from: string; date_to: string }): Promise<{ data: DispensingRow[] }> {
    const q = new URLSearchParams(params as any).toString();
    const res = await this.request<any>(`/reports/dispensings?${q}`);
    if (res.error) return res as any;
    return { data: this.normalizeData(res) } as { data: DispensingRow[] };
  }

  async getIncomingReport(params: { branch_id: string; date_from: string; date_to: string }): Promise<{ data: IncomingRow[] }> {
    const q = new URLSearchParams(params as any).toString();
    const res = await this.request<any>(`/reports/incoming?${q}`);
    if (res.error) return res as any;
    return { data: this.normalizeData(res) } as { data: IncomingRow[] };
  }

  async getStockReport(params: { branch_id: string; date_from?: string; date_to?: string }) {
    const qs = new URLSearchParams(params as any).toString();
    const res = await this.request<any>(`/reports/stock?${qs}`);
    if (res.error) return res as any;
    return { data: this.normalizeData(res) };
  }

  async getStockItemDetails(params: {
    branch_id: string;
    type: 'medicine' | 'medical_device';
    item_id: string;
    date_from?: string;
    date_to?: string;
  }) {
    const q = new URLSearchParams(params as any).toString();
    const res = await this.request<any>(`/reports/stock/item_details?${q}`);
    if (res.error) return res;
    return { data: this.normalizeData(res) };
  }

  // Mark calendar event as dispensed
  async markDispensedOnCalendar(patientId: string, dateISO: string) {
    return this.request<any>('/calendar/mark-dispensed', {
      method: 'POST',
      body: JSON.stringify({ patient_id: patientId, date: dateISO }),
    });
  }

  // Main getCategories function
  async getCategories(type?: string) {
    let url = '/categories';
    if (type) {
      url += `?type=${type}`;
    }
    return this.request<any[]>(url);
  }

  // Create category function
  async createCategoryNew(data: any) {
    return this.request('/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
}

export const apiService = new ApiService();