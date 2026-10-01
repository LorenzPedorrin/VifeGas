import React, { useState, useEffect } from 'react';
import { Flame, LayoutDashboard, ShoppingCart, Package, History, FileText, WifiOff, Database } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'venta' | 'inventario' | 'historial' | 'reporte';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenDbConfig: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenDbConfig
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'venta', label: 'Nueva Venta', icon: ShoppingCart },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'reporte', label: 'Reportes', icon: FileText },
  ] as const;

  return (
    <>
      {/* Offline Alert Banner (Caso 3: Pérdida de conexión) */}
      {!isOnline && (
        <div className="bg-red-600 text-white px-4 py-2.5 text-center text-sm font-bold flex items-center justify-center gap-2 shadow-md sticky top-0 z-50 animate-pulse">
          <WifiOff className="w-5 h-5 flex-shrink-0" />
          <span>Sin conexión. Revisa tu internet</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-md shadow-orange-600/30">
                <Flame className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  VifeGas
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-orange-950 text-orange-400 border border-orange-800/60 hidden sm:inline-block">
                    10 kg
                  </span>
                </span>
                <p className="text-[11px] text-slate-400 -mt-1 hidden sm:block">Control de ventas y stock</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as ActiveTab)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right side controls: DB Mapping */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenDbConfig}
                title="Configuración de colecciones Firestore"
                className="px-3 py-2 text-slate-300 hover:text-orange-400 hover:bg-slate-800 rounded-xl transition-colors text-xs font-bold border border-slate-700/80 flex items-center gap-1.5"
              >
                <Database className="w-4 h-4 text-orange-400" />
                <span>Colecciones</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Celular primero con botones grandes para fácil pulsación) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 px-2 py-1.5 no-print shadow-xl">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-bold transition-all ${
                  isActive
                    ? 'text-orange-400 bg-orange-950/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-orange-400 scale-110' : 'text-slate-400'}`} />
                <span className="truncate w-full text-center leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
