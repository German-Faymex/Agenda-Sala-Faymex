import type { Employee } from '../types';

interface EmployeeSelectorProps {
  employees: Employee[];
  selected: Employee | null;
  onSelect: (employee: Employee | null) => void;
}

export default function EmployeeSelector({ employees, selected, onSelect }: EmployeeSelectorProps) {
  return (
    <div className="px-4 py-3 bg-white border-b flex items-center gap-3 flex-wrap">
      <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Soy:</label>
      <select
        value={selected?.id || 0}
        onChange={e => {
          const id = Number(e.target.value);
          onSelect(employees.find(emp => emp.id === id) || null);
        }}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-faymex-red focus:border-faymex-red max-w-xs"
      >
        <option value={0}>Seleccionar mi nombre...</option>
        {employees.map(emp => (
          <option key={emp.id} value={emp.id}>
            {emp.name} — {emp.position}
          </option>
        ))}
      </select>
      {selected && (
        <span className="text-xs px-2 py-1 rounded-full bg-faymex-gray text-faymex-black">
          Nivel {selected.hierarchy_level}: {
            selected.hierarchy_level === 1 ? 'Dirección' :
            selected.hierarchy_level === 2 ? 'Gerencia' :
            selected.hierarchy_level === 3 ? 'Jefatura' : 'Empleado'
          }
        </span>
      )}
    </div>
  );
}
