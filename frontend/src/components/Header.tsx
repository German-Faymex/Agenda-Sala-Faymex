interface HeaderProps {
  onAdminClick: () => void;
}

export default function Header({ onAdminClick }: HeaderProps) {
  return (
    <header className="bg-faymex-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <img src="/logo-faymex.png" alt="Faymex" className="h-48 w-auto" />
          <div>
            <h1 className="text-3xl font-bold leading-tight">Agenda Sala</h1>
            <p className="text-base text-gray-400">Sala de Reuniones</p>
          </div>
        </div>
        <button
          onClick={onAdminClick}
          className="text-base text-gray-400 hover:text-white transition-colors"
        >
          Admin
        </button>
      </div>
    </header>
  );
}
