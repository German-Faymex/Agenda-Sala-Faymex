import { useState } from 'react';
import type { Employee } from '../types';
import { adminLogin, getAdminEmployees, createEmployee, toggleEmployee, deleteEmployee, bulkUploadEmployees } from '../api';

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // New employee form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', position: '', department: '', hierarchy_level: 4 });

  const reload = async () => {
    const emps = await getAdminEmployees(password);
    setEmployees(emps);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await adminLogin(password);
      setAuthenticated(true);
      await reload();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createEmployee(password, form);
      setForm({ name: '', email: '', position: '', department: '', hierarchy_level: 4 });
      setShowForm(false);
      await reload();
      setMessage('Empleado creado');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await toggleEmployee(password, id);
      await reload();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteEmployee(password, id);
      setConfirmDeleteId(null);
      await reload();
      setMessage('Empleado eliminado');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const result = await bulkUploadEmployees(password, file);
      setMessage(`${result.created} empleados creados${result.errors.length ? `. Errores: ${result.errors.join(', ')}` : ''}`);
      await reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  if (!authenticated) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
          <div className="bg-faymex-black text-white px-6 py-4 rounded-t-xl">
            <h2 className="text-lg font-bold">Administración</h2>
          </div>
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-faymex-red"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm">Cancelar</button>
              <button type="submit" className="flex-1 px-4 py-2 bg-faymex-red text-white rounded-lg text-sm font-medium hover:bg-faymex-red-dark">Entrar</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-faymex-black text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-lg font-bold">Panel de Administración</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
          {message && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">{message}</div>}

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-faymex-red text-white rounded-lg text-sm font-medium hover:bg-faymex-red-dark"
            >
              {showForm ? 'Cancelar' : '+ Agregar Empleado'}
            </button>
            <label className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer">
              {loading ? 'Cargando...' : 'Cargar Excel'}
              <input type="file" accept=".xlsx,.xls" onChange={handleBulkUpload} className="hidden" />
            </label>
            <div className="text-xs text-gray-500 flex items-center">
              Formato: nombre, email, cargo, departamento, nivel_jerarquia (1-4)
            </div>
          </div>

          {/* New employee form */}
          {showForm && (
            <form onSubmit={handleCreate} className="bg-faymex-gray rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" required />
                <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" required />
                <input placeholder="Cargo" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" required />
                <input placeholder="Departamento" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div className="flex gap-3 items-center">
                <select value={form.hierarchy_level} onChange={e => setForm({ ...form, hierarchy_level: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm">
                  <option value={1}>Nivel 1 — Dirección</option>
                  <option value={2}>Nivel 2 — Gerencia</option>
                  <option value={3}>Nivel 3 — Jefatura</option>
                  <option value={4}>Nivel 4 — Empleado</option>
                </select>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Crear</button>
              </div>
            </form>
          )}

          {/* Employee list */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-faymex-gray">
                <tr>
                  <th className="text-left px-3 py-2">Nombre</th>
                  <th className="text-left px-3 py-2 hidden sm:table-cell">Cargo</th>
                  <th className="text-left px-3 py-2 hidden md:table-cell">Departamento</th>
                  <th className="text-center px-3 py-2">Nivel</th>
                  <th className="text-center px-3 py-2">Estado</th>
                  <th className="text-center px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className={`border-t ${!emp.active ? 'opacity-50' : ''}`}>
                    <td className="px-3 py-2">{emp.name}</td>
                    <td className="px-3 py-2 hidden sm:table-cell">{emp.position}</td>
                    <td className="px-3 py-2 hidden md:table-cell">{emp.department}</td>
                    <td className="px-3 py-2 text-center">{emp.hierarchy_level}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${emp.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {emp.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => handleToggle(emp.id)}
                          className={`text-xs px-2 py-1 rounded ${emp.active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                        >
                          {emp.active ? 'Desactivar' : 'Activar'}
                        </button>
                        {confirmDeleteId === emp.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(emp.id)}
                              className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs px-2 py-1 rounded text-gray-500 hover:bg-gray-100"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(emp.id)}
                            className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
