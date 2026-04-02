import { useMemo, useRef, useEffect } from 'react';
import type { Reservation, Employee } from '../types';
import DayHeader from './DayHeader';

interface WeekCalendarProps {
  weekStart: Date;
  reservations: Reservation[];
  slots: string[];
  onSlotClick: (date: string, startTime: string) => void;
  onReservationClick: (reservation: Reservation) => void;
  selectedEmployee: Employee | null;
}

const ROW_HEIGHT = 60;

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function WeekCalendar({
  weekStart, reservations, slots, onSlotClick, onReservationClick, selectedEmployee
}: WeekCalendarProps) {
  const dates = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  // Map: date -> slot -> { reservation, position } where position = 'first' | 'middle' | 'last' | 'single'
  const slotInfo = useMemo(() => {
    const map: Record<string, Record<string, { reservation: Reservation; position: 'first' | 'middle' | 'last' | 'single' }>> = {};
    for (const r of reservations) {
      if (!map[r.date]) map[r.date] = {};

      const coveredSlots: string[] = [];
      let slotTime = r.start_time;
      while (slotTime < r.end_time) {
        coveredSlots.push(slotTime);
        const [h, m] = slotTime.split(':').map(Number);
        slotTime = m + 30 >= 60
          ? `${String(h + 1).padStart(2, '0')}:00`
          : `${String(h).padStart(2, '0')}:30`;
      }

      for (let idx = 0; idx < coveredSlots.length; idx++) {
        const pos = coveredSlots.length === 1 ? 'single'
          : idx === 0 ? 'first'
          : idx === coveredSlots.length - 1 ? 'last'
          : 'middle';
        map[r.date][coveredSlots[idx]] = { reservation: r, position: pos };
      }
    }
    return map;
  }, [reservations]);

  const today = formatDate(new Date());
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Auto-scroll to today's column on mobile
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayIndex = dates.findIndex(d => formatDate(d) === today);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || todayIndex < 0) return;
    // Each day column width = (totalWidth - 90px timeCol) / 5
    // Scroll so today's column is roughly centered
    const colWidth = (el.scrollWidth - 90) / 5;
    const targetScroll = 90 + colWidth * todayIndex - el.clientWidth / 2 + colWidth / 2;
    el.scrollLeft = Math.max(0, targetScroll);
  }, [todayIndex, weekStart]);

  return (
    <div ref={scrollRef} className="overflow-x-auto">
      <div className="min-w-[700px]">
        <div className="sticky top-0 z-10">
          <DayHeader weekStart={weekStart} />
        </div>
        {slots.map((slot) => {
          const [slotH, slotM] = slot.split(':').map(Number);

          return (
            <div key={slot} className="grid grid-cols-[90px_repeat(5,1fr)] border-b relative" style={{ height: `${ROW_HEIGHT}px` }}>
              {/* Current time indicator */}
              {slotH === currentHour && currentMinute >= slotM && currentMinute < slotM + 30 && (
                <div
                  className="absolute left-[90px] right-0 border-t-2 border-faymex-red z-20 pointer-events-none"
                  style={{ top: `${((currentMinute - slotM) / 30) * 100}%` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-faymex-red -mt-[5px] -ml-[5px]" />
                </div>
              )}

              <div className="p-2 text-sm text-gray-500 border-r flex items-center justify-center font-mono">
                {slot}
              </div>

              {dates.map((d, i) => {
                const dateStr = formatDate(d);
                const isToday = dateStr === today;
                const isSlotPast = dateStr < today || (isToday && (slotH < currentHour || (slotH === currentHour && slotM <= currentMinute)));
                const info = slotInfo[dateStr]?.[slot];

                // Occupied slot — part of a reservation
                if (info) {
                  const { reservation, position } = info;
                  const isMyReservation = selectedEmployee?.id === reservation.employee_id;
                  const bgColor = isMyReservation ? 'bg-faymex-red' : 'bg-faymex-black/80';
                  const hoverColor = isMyReservation ? 'hover:brightness-110' : 'hover:bg-faymex-black';
                  const roundTop = position === 'first' || position === 'single' ? 'rounded-t-md' : '';
                  const roundBottom = position === 'last' || position === 'single' ? 'rounded-b-md' : '';

                  return (
                    <div
                      key={i}
                      className={`border-r last:border-r-0 px-0.5 ${position === 'first' || position === 'single' ? 'pt-0.5' : ''} ${position === 'last' || position === 'single' ? 'pb-0.5' : ''}`}
                    >
                      <button
                        onClick={() => onReservationClick(reservation)}
                        className={`w-full h-full ${bgColor} ${hoverColor} text-white text-left px-3 flex flex-col justify-center transition-all ${roundTop} ${roundBottom}`}
                        title={`${reservation.employee_name}${reservation.subject ? ' — ' + reservation.subject : ''}\n${reservation.start_time}-${reservation.end_time}`}
                      >
                        {(position === 'first' || position === 'single') && (
                          <div className="font-semibold truncate text-sm leading-tight">{reservation.employee_name}</div>
                        )}
                        {(position === 'first' || position === 'single') && reservation.subject && (
                          <div className="truncate opacity-80 text-xs leading-tight">{reservation.subject}</div>
                        )}
                        {(position === 'single' || position === 'last') && (
                          <div className="opacity-70 text-xs leading-tight">{reservation.start_time}-{reservation.end_time}</div>
                        )}
                        {position === 'middle' && reservation.subject && (
                          <div className="truncate opacity-80 text-xs leading-tight">{reservation.subject}</div>
                        )}
                      </button>
                    </div>
                  );
                }

                // Empty slot
                return (
                  <div
                    key={i}
                    className={`border-r last:border-r-0 p-1 ${isToday && !isSlotPast ? 'bg-faymex-red/5' : ''} ${isSlotPast ? 'bg-gray-200/70' : ''}`}
                    style={isSlotPast ? {
                      backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(0,0,0,0.04) 4px, rgba(0,0,0,0.04) 5px)',
                    } : undefined}
                  >
                    {!isSlotPast && (
                      <button
                        onClick={() => onSlotClick(dateStr, slot)}
                        className="w-full h-full rounded-md border border-dashed border-transparent hover:border-green-400 hover:bg-green-50 transition-colors flex items-center justify-center group"
                      >
                        <span className="text-xs text-gray-300 group-hover:text-green-600 transition-colors">
                          +
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
