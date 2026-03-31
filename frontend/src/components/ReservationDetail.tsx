import { useState } from 'react';
import type { Reservation, Employee } from '../types';

interface ReservationDetailProps {
  reservation: Reservation;
  selectedEmployee: Employee | null;
  onClose: () => void;
  onCancel: (reservationId: number, employeeId: number) => void;
  onOverride: (date: string, startTime: string) => void;
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

export default function ReservationDetail({
  reservation, selectedEmployee, onClose, onCancel, onOverride, loading
}: ReservationDetailProps) {
  const isOwner = selectedEmployee?.id === reservation.employee_id;
  const canOverride = selectedEmployee
    && !isOwner
    && selectedEmployee.hierarchy_level < reservation.employee_hierarchy;
  const [confirmCancel, setConfirmCancel] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="bg-faymex-black text-white px-6 py-4 rounded-t-xl">
          <h2 className="text-lg font-bold">Detalle de Reserva</h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Reservado por</span>
              <span className="text-sm font-medium">{reservation.employee_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Cargo</span>
              <span className="text-sm">{reservation.employee_position}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Fecha</span>
              <span className="text-sm font-medium">{formatReadableDate(reservation.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Horario</span>
              <span className="text-sm font-medium">{reservation.start_time} - {reservation.end_time}</span>
            </div>
            {reservation.subject && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Asunto</span>
                <span className="text-sm">{reservation.subject}</span>
              </div>
            )}
          </div>

          {/* Override option */}
          {canOverride && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
              Tienes mayor jerarquía. Puedes reservar este horario y se le notificará a {reservation.employee_name}.
            </div>
          )}

          {/* Cancel confirmation */}
          {confirmCancel && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-sm text-red-800">
              <p className="font-semibold">¿Estás seguro?</p>
              <p>Esta acción no se puede deshacer.</p>
            </div>
          )}

          <div className="flex gap-3 pt-2 flex-wrap">
            <button
              onClick={() => { setConfirmCancel(false); onClose(); }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Cerrar
            </button>
            {canOverride && (
              <button
                onClick={() => {
                  onClose();
                  onOverride(reservation.date, reservation.start_time);
                }}
                className="flex-1 px-4 py-2 bg-faymex-red text-white rounded-lg text-sm font-medium hover:bg-faymex-red-dark"
              >
                Reservar con prioridad
              </button>
            )}
            {isOwner && !confirmCancel && (
              <button
                onClick={() => setConfirmCancel(true)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Cancelar Reserva
              </button>
            )}
            {isOwner && confirmCancel && (
              <button
                onClick={() => onCancel(reservation.id, reservation.employee_id)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 disabled:opacity-50"
              >
                {loading ? 'Cancelando...' : 'Sí, Cancelar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
