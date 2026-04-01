import { useState, useEffect, useCallback } from 'react';
import type { Employee, Reservation } from './types';
import { getEmployees, getSlots, getReservationsForWeek, createReservation, cancelReservation } from './api';
import Header from './components/Header';
import EmployeeSelector from './components/EmployeeSelector';
import WeekNavigator from './components/WeekNavigator';
import WeekCalendar from './components/WeekCalendar';
import DayHeader from './components/DayHeader';
import ReservationModal from './components/ReservationModal';
import ReservationDetail from './components/ReservationDetail';
import AdminPanel from './components/AdminPanel';
import Toast from './components/Toast';

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Modals
  const [newReservation, setNewReservation] = useState<{ date: string; startTime: string } | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Load initial data + restore identity from localStorage
  useEffect(() => {
    Promise.all([
      getEmployees(),
      getSlots(),
    ]).then(([emps, sl]) => {
      setEmployees(emps);
      setSlots(sl);

      // Restore saved identity
      const savedId = localStorage.getItem('agenda_sala_employee_id');
      if (savedId) {
        const emp = emps.find(e => e.id === Number(savedId));
        if (emp) setSelectedEmployee(emp);
      }
    }).catch(console.error).finally(() => setInitialLoading(false));
  }, []);

  // Load reservations for current week
  const loadReservations = useCallback(async () => {
    try {
      const data = await getReservationsForWeek(formatDate(weekStart));
      setReservations(data);
    } catch (err) {
      console.error(err);
    }
  }, [weekStart]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadReservations, 30000);
    return () => clearInterval(interval);
  }, [loadReservations]);

  // Week navigation
  const today = getMonday(new Date());
  const maxWeek = new Date(today);
  maxWeek.setDate(maxWeek.getDate() + 14);

  const canGoPrev = weekStart > today;
  const canGoNext = weekStart < maxWeek;

  const goToPrev = () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekStart(prev);
  };
  const goToNext = () => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    setWeekStart(next);
  };
  const goToToday = () => setWeekStart(getMonday(new Date()));

  // Create reservation
  const handleCreateReservation = async (data: {
    employee_id: number;
    date: string;
    start_time: string;
    end_time: string;
    subject?: string;
  }) => {
    setLoading(true);
    try {
      const result = await createReservation(data);
      setNewReservation(null);
      await loadReservations();

      if (result.override_info.overridden) {
        setToast({
          message: `Reserva creada. Se desplazó a: ${result.override_info.displaced_employees.join(', ')}`,
          type: 'warning',
        });
      } else {
        setToast({ message: 'Reserva creada exitosamente', type: 'success' });
      }
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Cancel reservation
  const handleCancelReservation = async (reservationId: number, employeeId: number) => {
    setLoading(true);
    try {
      await cancelReservation(reservationId, employeeId);
      setSelectedReservation(null);
      await loadReservations();
      setToast({ message: 'Reserva cancelada', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-faymex-gray flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-faymex-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Cargando agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-faymex-gray">
      <div className="sticky top-0 z-30">
        <Header onAdminClick={() => setShowAdmin(true)} />
        <EmployeeSelector
          employees={employees}
          selected={selectedEmployee}
          onSelect={setSelectedEmployee}
        />
        <WeekNavigator
          weekStart={weekStart}
          onPrev={goToPrev}
          onNext={goToNext}
          onToday={goToToday}
          canGoNext={canGoNext}
          canGoPrev={canGoPrev}
        />
        <DayHeader weekStart={weekStart} />
      </div>

      <div className="bg-white shadow-sm">
        <WeekCalendar
          weekStart={weekStart}
          reservations={reservations}
          slots={slots}
          onSlotClick={(date, startTime) => setNewReservation({ date, startTime })}
          onReservationClick={setSelectedReservation}
          selectedEmployee={selectedEmployee}
        />
      </div>

      {/* Modals */}
      {newReservation && (
        <ReservationModal
          date={newReservation.date}
          startTime={newReservation.startTime}
          slots={slots}
          employees={employees}
          selectedEmployee={selectedEmployee}
          existingReservations={reservations}
          onClose={() => setNewReservation(null)}
          onSubmit={handleCreateReservation}
          loading={loading}
        />
      )}

      {selectedReservation && (
        <ReservationDetail
          reservation={selectedReservation}
          selectedEmployee={selectedEmployee}
          onClose={() => setSelectedReservation(null)}
          onCancel={handleCancelReservation}
          onOverride={(date, startTime) => {
            setSelectedReservation(null);
            setNewReservation({ date, startTime });
          }}
          loading={loading}
        />
      )}

      {showAdmin && <AdminPanel onClose={() => { setShowAdmin(false); getEmployees().then(setEmployees); }} />}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
