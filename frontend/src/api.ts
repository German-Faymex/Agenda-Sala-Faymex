const BASE = import.meta.env.VITE_API_URL || '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${res.status}`);
  }
  return res.json();
}

// Employees
export const getEmployees = () => request<import('./types').Employee[]>('/api/employees');

// Reservations
export const getSlots = () => request<string[]>('/api/reservations/slots');

export const getReservationsByDate = (date: string) =>
  request<import('./types').Reservation[]>(`/api/reservations/date/${date}`);

export const getReservationsForWeek = (startDate: string) =>
  request<import('./types').Reservation[]>(`/api/reservations/week?start_date=${startDate}`);

export const createReservation = (data: {
  employee_id: number;
  date: string;
  start_time: string;
  end_time: string;
  subject?: string;
}) =>
  request<import('./types').ReservationResponse>('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const cancelReservation = (id: number, employeeId: number) =>
  request<{ message: string }>(`/api/reservations/${id}?employee_id=${employeeId}`, {
    method: 'DELETE',
  });

// Admin
export const adminLogin = (password: string) =>
  request<{ message: string }>('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

const adminHeaders = (password: string) => ({ 'X-Admin-Password': password });

export const getAdminEmployees = (password: string) =>
  request<import('./types').Employee[]>('/api/admin/employees', {
    headers: adminHeaders(password),
  });

export const createEmployee = (password: string, data: Omit<import('./types').Employee, 'id' | 'active'>) =>
  request<import('./types').Employee>('/api/admin/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...adminHeaders(password) },
    body: JSON.stringify(data),
  });

export const updateEmployee = (password: string, id: number, data: Omit<import('./types').Employee, 'id' | 'active'>) =>
  request<import('./types').Employee>(`/api/admin/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...adminHeaders(password) },
    body: JSON.stringify(data),
  });

export const toggleEmployee = (password: string, id: number) =>
  request<{ message: string }>(`/api/admin/employees/${id}/toggle`, {
    method: 'PATCH',
    headers: adminHeaders(password),
  });

export const deleteEmployee = (password: string, id: number) =>
  request<{ message: string }>(`/api/admin/employees/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(password),
  });

export const bulkUploadEmployees = (password: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return request<import('./types').BulkUploadResult>(
    '/api/admin/employees/bulk',
    { method: 'POST', headers: adminHeaders(password), body: formData }
  );
};
