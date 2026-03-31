import { useState, useRef, useEffect } from 'react';
import type { Employee } from '../types';

interface EmployeeSelectorProps {
  employees: Employee[];
  selected: Employee | null;
  onSelect: (employee: Employee | null) => void;
}

export default function EmployeeSelector({ employees, selected, onSelect }: EmployeeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = search.trim()
    ? employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : employees;

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (emp: Employee) => {
    onSelect(emp);
    localStorage.setItem('agenda_sala_employee_id', String(emp.id));
    setSearch('');
    setOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    localStorage.removeItem('agenda_sala_employee_id');
    setSearch('');
  };

  return (
    <div className="px-4 py-4 bg-white border-b flex items-center gap-3 flex-wrap">
      <label className="text-base font-medium text-gray-600 whitespace-nowrap">Soy:</label>
      <div ref={containerRef} className="relative w-full max-w-sm">
        {selected && !open ? (
          <button
            onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}
            className="w-full text-left border border-gray-300 rounded-lg px-4 py-2 text-base bg-white hover:border-gray-400 flex items-center justify-between"
          >
            <span>{selected.name}</span>
            <span
              onClick={e => { e.stopPropagation(); handleClear(); }}
              className="text-gray-400 hover:text-gray-600 ml-2 text-lg leading-none"
            >
              &times;
            </span>
          </button>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar por nombre o apellido..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:ring-2 focus:ring-faymex-red focus:border-faymex-red"
          />
        )}

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto z-30">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400">No se encontraron resultados</div>
            ) : (
              filtered.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => handleSelect(emp)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-faymex-red/10 transition-colors border-b border-gray-100 last:border-b-0
                    ${selected?.id === emp.id ? 'bg-faymex-red/5 font-medium' : ''}`}
                >
                  {emp.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {!selected && !open && (
        <span className="text-sm text-gray-400">
          Selecciónate para poder reservar y cancelar
        </span>
      )}
    </div>
  );
}
