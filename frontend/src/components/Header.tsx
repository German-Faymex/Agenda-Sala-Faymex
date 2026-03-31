interface HeaderProps {
  onAdminClick: () => void;
}

export default function Header({ onAdminClick }: HeaderProps) {
  return (
    <header className="bg-faymex-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/logo-faymex.png" alt="Faymex" className="h-16 w-auto" />
          <div>
            <h1 className="text-2xl font-bold leading-tight">Agenda Sala</h1>
            <p className="text-sm text-gray-400">Sala de Reuniones</p>
          </div>
        </div>
        <button
          onClick={onAdminClick}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Admin
        </button>
      </div>
    </header>
  );
}
