import type { Employee } from '../types';

interface EmployeeSelectorProps {
  employees: Employee[];
  selected: Employee | null;
  onSelect: (employee: Employee | null) => void;
}

export default function EmployeeSelector({ employees, selected, onSelect }: EmployeeSelectorProps) {
  return (
    <div className="px-4 py-4 bg-white border-b flex items-center gap-3 flex-wrap">
      <label className="text-base font-medium text-gray-600 whitespace-nowrap">Soy:</label>
      <select
        value={selected?.id || 0}
        onChange={e => {
          const id = Number(e.target.value);
          const emp = employees.find(emp => emp.id === id) || null;
          onSelect(emp);
          if (emp) {
            localStorage.setItem('agenda_sala_employee_id', String(emp.id));
          } else {
            localStorage.removeItem('agenda_sala_employee_id');
          }
        }}
        className="border border-gray-300 rounded-lg px-4 py-2 text-base focus:ring-2 focus:ring-faymex-red focus:border-faymex-red max-w-md"
      >
        <option value={0}>Seleccionar mi nombre...</option>
        {employees.map(emp => (
          <option key={emp.id} value={emp.id}>
            {emp.name} — {emp.position}
          </option>
        ))}
      </select>
      {!selected && (
        <span className="text-sm text-gray-400">
          Selecciónate para poder reservar y cancelar
        </span>
      )}
    </div>
  );
}
