import React, { useMemo } from 'react';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  ShoppingCart, 
  FileText, 
  History, 
  Flame, 
  ArrowRight,
  Clock
} from 'lucide-react';
import { InventarioConfig, Venta } from '../types';
import { ActiveTab } from './Navbar';

interface DashboardProps {
  inventario: InventarioConfig;
  ventas: Venta[];
  setActiveTab: (tab: ActiveTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  inventario,
  ventas,
  setActiveTab
}) => {
  // Calculate today's stats vs all-time stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let ingresosTotales = 0;
    let balonesVendidosTotales = 0;
    let ingresosHoy = 0;
    let balonesHoy = 0;
    let ventasHoyCount = 0;

    ventas.forEach((v) => {
      ingresosTotales += v.total;
      balonesVendidosTotales += v.cantidad;

      const vDate = new Date(v.fecha);
      vDate.setHours(0, 0, 0, 0);
      if (vDate.getTime() === today.getTime()) {
        ingresosHoy += v.total;
        balonesHoy += v.cantidad;
        ventasHoyCount++;
      }
    });

    return {
      ingresosTotales,
      balonesVendidosTotales,
      ingresosHoy,
      balonesHoy,
      ventasHoyCount,
      totalVentasCount: ventas.length
    };
  }, [ventas]);

  const isLowStock = inventario.stock <= inventario.umbralMinimo;
  const recentVentas = ventas.slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Welcome & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Panel de Control</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              En tiempo real
            </span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Negocio de Balones de Gas 10 kg
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl self-start sm:self-auto">
          <Clock className="w-4 h-4 text-orange-600" />
          <span>Precio de lista: S/. {inventario.precioLista.toFixed(2)}</span>
        </div>
      </div>

      {/* Alerta de Stock Bajo (Si stock <= umbral) */}
      {isLowStock && (
        <div className="p-4 sm:p-5 bg-amber-500/10 border-2 border-amber-500 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-bounce-subtle">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-900">
                ¡Alerta de Stock Bajo!
              </h3>
              <p className="text-sm font-medium text-amber-800">
                Quedan solo <strong className="font-bold underline">{inventario.stock} balones</strong> disponibles.
                El umbral mínimo configurado es de {inventario.umbralMinimo} balones.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('inventario')}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Package className="w-4 h-4" />
            <span>Reabastecer ahora</span>
          </button>
        </div>
      )}

      {/* Primary KPI Cards (Ingresos Totales, Balones Vendidos, Stock Disponible) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stock Disponible */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isLowStock 
            ? 'bg-red-50/70 border-red-200 text-red-950' 
            : 'bg-white border-slate-200 text-slate-900'
        } shadow-sm`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Stock Disponible
            </span>
            <div className={`p-2.5 rounded-xl ${isLowStock ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tight">
              {inventario.stock}
            </span>
            <span className="text-sm font-bold text-slate-500">
              balones de 10 kg
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Umbral de alerta: {inventario.umbralMinimo} balones</span>
            <button 
              onClick={() => setActiveTab('inventario')}
              className="font-bold text-orange-600 hover:underline"
            >
              Gestionar
            </button>
          </div>
        </div>

        {/* Ingresos Totales */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Ingresos Totales
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tight text-emerald-700">
              S/. {stats.ingresosTotales.toFixed(2)}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Hoy: <strong className="font-bold text-emerald-600">S/. {stats.ingresosHoy.toFixed(2)}</strong></span>
            <span>{stats.totalVentasCount} ventas registradas</span>
          </div>
        </div>

        {/* Balones Vendidos */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Balones Vendidos
            </span>
            <div className="p-2.5 rounded-xl bg-blue-600 text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tight text-blue-900">
              {stats.balonesVendidosTotales}
            </span>
            <span className="text-sm font-bold text-slate-500">
              balones
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Hoy vendidos: <strong className="font-bold text-blue-600">{stats.balonesHoy} balones</strong></span>
            <span>({stats.ventasHoyCount} ventas)</span>
          </div>
        </div>
      </div>

      {/* Botones Grandes de Navegación Rápida */}
      <div>
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-3">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <button
            onClick={() => setActiveTab('venta')}
            className="p-5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-[0.98] text-white shadow-lg shadow-orange-600/25 transition-all text-left flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <span className="text-xl font-black block">Registrar Venta</span>
              <span className="text-xs font-medium text-orange-100">
                Anotar salida y descontar stock
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('inventario')}
            className="p-5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 active:scale-[0.98] text-slate-900 shadow-sm transition-all text-left flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <span className="text-xl font-black block">Inventario</span>
              <span className="text-xs font-medium text-slate-500">
                Reabastecer y ajustar precio
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('historial')}
            className="p-5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 active:scale-[0.98] text-slate-900 shadow-sm transition-all text-left flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <span className="text-xl font-black block">Historial</span>
              <span className="text-xs font-medium text-slate-500">
                Ver, editar o anular ventas
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('reporte')}
            className="p-5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 active:scale-[0.98] text-slate-900 shadow-sm transition-all text-left flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <span className="text-xl font-black block">Reportes</span>
              <span className="text-xs font-medium text-slate-500">
                Descargar .md e imprimir PDF
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Últimas Ventas Realizadas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900">
            Últimas Ventas Registradas
          </h2>
          {ventas.length > 0 && (
            <button
              onClick={() => setActiveTab('historial')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>Ver todas ({ventas.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentVentas.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <Flame className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">Aún no hay ventas registradas</p>
            <p className="text-xs text-slate-400 mt-1">Usa el botón de Registrar Venta para comenzar.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentVentas.map((v) => (
              <div key={v.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-base">
                      {v.cantidad} {v.cantidad === 1 ? 'balón' : 'balones'}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      S/. {v.precio.toFixed(2)} c/u
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {v.fecha.toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {v.motivo && (
                      <span className="ml-2 text-amber-700 font-medium italic">
                        · {v.motivo}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-700">
                    S/. {v.total.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
