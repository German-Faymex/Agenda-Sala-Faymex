export interface Employee {
  id: number;
  name: string;
  email: string;
  position: string;
  department: string;
  hierarchy_level: number;
  active: boolean;
}

export interface Reservation {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_position: string;
  employee_department: string;
  employee_hierarchy: number;
  date: string;
  start_time: string;
  end_time: string;
  subject: string | null;
  created_at: string;
  cancelled: boolean;
}

export interface OverrideInfo {
  overridden: boolean;
  displaced_employees: string[];
  message: string;
}

export interface ReservationResponse {
  reservation: Reservation;
  override_info: OverrideInfo;
}

export interface BulkUploadResult {
  created: number;
  errors: string[];
}
