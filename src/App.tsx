/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  subscribeToInventario, 
  subscribeToVentas 
} from './firebase';
import { InventarioConfig, Venta } from './types';
import { Navbar, ActiveTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { VentaForm } from './components/VentaForm';
import { InventarioView } from './components/InventarioView';
import { HistorialView } from './components/HistorialView';
import { ReporteView } from './components/ReporteView';
import { DbConfigModal } from './components/DbConfigModal';

export default function App() {
  // Active view tab (starts directly in dashboard)
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Real-time state
  const [inventario, setInventario] = useState<InventarioConfig>({
    stock: 0,
    precioLista: 50,
    umbralMinimo: 5
  });
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  // DB Config Modal
  const [isDbConfigOpen, setIsDbConfigOpen] = useState(false);
  const [syncKey, setSyncKey] = useState(0);

  // Real-time Firestore Listeners (Conexión directa inmediata, sin pantalla de login)
  useEffect(() => {
    setDbError(null);

    // Subscribe to inventory doc
    const unsubInv = subscribeToInventario(
      (data) => {
        setInventario(data);
      },
      (err) => {
        console.error('Error al escuchar inventario:', err);
        setDbError('No se pudo leer el documento de inventario.');
      }
    );

    // Subscribe to sales collection
    const unsubVentas = subscribeToVentas(
      (list) => {
        setVentas(list);
      },
      (err) => {
        console.error('Error al escuchar ventas:', err);
        setDbError('No se pudo leer la colección de ventas.');
      }
    );

    return () => {
      unsubInv();
      unsubVentas();
    };
  }, [syncKey]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top and Mobile Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDbConfig={() => setIsDbConfigOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {dbError && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-sm font-semibold flex items-center justify-between">
            <span>Nota: {dbError} Puedes verificar los nombres de las colecciones arriba.</span>
            <button
              onClick={() => setIsDbConfigOpen(true)}
              className="text-xs font-black underline text-amber-800"
            >
              Configurar colecciones
            </button>
          </div>
        )}

        {/* View Switcher */}
        {activeTab === 'dashboard' && (
          <Dashboard
            inventario={inventario}
            ventas={ventas}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'venta' && (
          <VentaForm
            inventario={inventario}
            onVentaSuccess={() => {}}
          />
        )}

        {activeTab === 'inventario' && (
          <InventarioView inventario={inventario} />
        )}

        {activeTab === 'historial' && (
          <HistorialView
            ventas={ventas}
            inventario={inventario}
          />
        )}

        {activeTab === 'reporte' && (
          <ReporteView ventas={ventas} />
        )}
      </main>

      {/* DB Configuration Modal */}
      <DbConfigModal
        isOpen={isDbConfigOpen}
        onClose={() => setIsDbConfigOpen(false)}
        onConfigSaved={() => {
          // Reconnect listeners with updated mappings
          setSyncKey((prev) => prev + 1);
        }}
      />
    </div>
  );
}
