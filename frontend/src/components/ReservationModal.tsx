import { useState, useMemo } from 'react';
import type { Employee, Reservation } from '../types';

interface ReservationModalProps {
  date: string;
  startTime: string;
  slots: string[];
  employees: Employee[];
  selectedEmployee: Employee | null;
  existingReservations: Reservation[];
  onClose: () => void;
  onSubmit: (data: {
    employee_id: number;
    date: string;
    start_time: string;
    end_time: string;
    subject?: string;
  }) => void;
  loading: boolean;
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function formatReadableDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${DAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

function formatDuration(startTime: string, endTime: string): string {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const totalMin = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMin < 60) return `${totalMin} min`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export default function ReservationModal({
  date, startTime, slots, employees, selectedEmployee,
  existingReservations, onClose, onSubmit, loading
}: ReservationModalProps) {
  const [employeeId, setEmployeeId] = useState(selectedEmployee?.id || 0);
  const [endTime, setEndTime] = useState('');
  const [subject, setSubject] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const readableDate = formatReadableDate(date);

  // Available end times: consecutive slots after startTime
  const endTimeOptions = useMemo(() => {
    const startIdx = slots.indexOf(startTime);
    if (startIdx === -1) return [];

    const options: string[] = [];
    for (let i = startIdx; i < slots.length; i++) {
      const slot = slots[i];
      const [h, m] = slot.split(':').map(Number);
      const nextEnd = m + 30 >= 60
        ? `${String(h + 1).padStart(2, '0')}:00`
        : `${String(h).padStart(2, '0')}:30`;
      options.push(nextEnd);
    }
    return options;
  }, [slots, startTime]);

  // Check which end times would conflict
  const conflictInfo = useMemo(() => {
    if (!employeeId) return {};
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return {};

    const info: Record<string, { canOverride: boolean; blockedBy: string }> = {};
    for (const et of endTimeOptions) {
      for (const r of existingReservations) {
        if (r.date !== date) continue;
        if (r.start_time < et && r.end_time > startTime) {
          const canOverride = employee.hierarchy_level < r.employee_hierarchy;
          info[et] = {
            canOverride,
            blockedBy: `${r.employee_name} (${r.start_time}-${r.end_time})`
          };
          if (!canOverride) break;
        }
      }
    }
    return info;
  }, [employeeId, endTimeOptions, existingReservations, date, startTime, employees]);

  const hasOverride = endTime && conflictInfo[endTime]?.canOverride;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !endTime) return;

    // If this will override someone, require confirmation first
    if (hasOverride && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    onSubmit({
      employee_id: employeeId,
      date,
      start_time: startTime,
      end_time: endTime,
      subject: subject.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="bg-faymex-black text-white px-6 py-4 rounded-t-xl">
          <h2 className="text-lg font-bold">Nueva Reserva</h2>
          <p className="text-sm text-gray-300">{readableDate} desde {startTime}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Employee selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
            <select
              value={employeeId}
              onChange={e => { setEmployeeId(Number(e.target.value)); setShowConfirm(false); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-faymex-red focus:border-faymex-red"
              required
            >
              <option value={0}>Seleccionar empleado...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
            <select
              value={endTime}
              onChange={e => { setEndTime(e.target.value); setShowConfirm(false); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-faymex-red focus:border-faymex-red"
              required
            >
              <option value="">Seleccionar duración...</option>
              {endTimeOptions.map(et => {
                const conflict = conflictInfo[et];
                const blocked = conflict && !conflict.canOverride;
                const duration = formatDuration(startTime, et);
                return (
                  <option key={et} value={et} disabled={!!blocked}>
                    {startTime} - {et} ({duration})
                    {blocked ? ` — Ocupado por ${conflict.blockedBy}` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asunto <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Ej: Reunión de equipo, Entrevista..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-faymex-red focus:border-faymex-red"
            />
          </div>

          {/* Override confirmation */}
          {showConfirm && hasOverride && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-sm text-red-800">
              <p className="font-semibold mb-1">Confirmar desplazamiento</p>
              <p>Esta reserva anulará la de <strong>{conflictInfo[endTime]!.blockedBy}</strong>. Se le notificará por correo.</p>
              <p className="mt-2 text-red-600 font-medium">Presiona "Reservar" nuevamente para confirmar.</p>
            </div>
          )}

          {/* Override warning (before confirmation) */}
          {!showConfirm && endTime && conflictInfo[endTime]?.canOverride && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
              <strong>Atención:</strong> Esta reserva desplazará a {conflictInfo[endTime].blockedBy}.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !employeeId || !endTime}
              className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed
                ${showConfirm ? 'bg-red-600 hover:bg-red-700' : 'bg-faymex-red hover:bg-faymex-red-dark'}`}
            >
              {loading ? 'Reservando...' : showConfirm ? 'Confirmar Desplazamiento' : 'Reservar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
