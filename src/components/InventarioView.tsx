import React, { useState } from 'react';
import { 
  Package, 
  PlusCircle, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  DollarSign, 
  BellRing,
  RefreshCw
} from 'lucide-react';
import { InventarioConfig } from '../types';
import { reabastecerStockAtomic, actualizarConfiguracionAtomic } from '../firebase';

interface InventarioViewProps {
  inventario: InventarioConfig;
}

export const InventarioView: React.FC<InventarioViewProps> = ({ inventario }) => {
  // Reabastecimiento state
  const [cantidadReabastecer, setCantidadReabastecer] = useState<number>(10);
  const [isReabasteciendo, setIsReabasteciendo] = useState(false);
  const [reabastecerSuccess, setReabastecerSuccess] = useState<string | null>(null);
  const [reabastecerError, setReabastecerError] = useState<string | null>(null);

  // Configuración state
  const [precioListaInput, setPrecioListaInput] = useState<number>(inventario.precioLista);
  const [umbralInput, setUmbralInput] = useState<number>(inventario.umbralMinimo);
  const [stockManualInput, setStockManualInput] = useState<number>(inventario.stock);
  const [showAjusteManual, setShowAjusteManual] = useState(false);

  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  // Handle Restock (Reabastecimiento)
  const handleReabastecer = async (e: React.FormEvent) => {
    e.preventDefault();
    setReabastecerError(null);
    setReabastecerSuccess(null);

    const qty = Math.floor(cantidadReabastecer);
    if (!qty || qty <= 0) {
      setReabastecerError('La cantidad de reabastecimiento debe ser un número entero mayor a cero.');
      return;
    }

    setIsReabasteciendo(true);
    try {
      const nuevoStock = await reabastecerStockAtomic(qty);
      setReabastecerSuccess(`¡Reabastecimiento exitoso! Se agregaron +${qty} balones. Stock actual: ${nuevoStock}`);
      setCantidadReabastecer(10);
      setTimeout(() => setReabastecerSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error al reabastecer:', err);
      if (!navigator.onLine) {
        setReabastecerError('Sin conexión. Revisa tu internet e intenta de nuevo.');
      } else {
        setReabastecerError(err.message || 'Ocurrió un problema, intenta de nuevo.');
      }
    } finally {
      setIsReabasteciendo(false);
    }
  };

  // Handle Save Business / Inventory Config
  const handleGuardarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigError(null);
    setConfigSuccess(null);

    if (isNaN(precioListaInput) || precioListaInput < 0) {
      setConfigError('Ingresa un precio de lista válido.');
      return;
    }
    if (isNaN(umbralInput) || umbralInput < 0 || !Number.isInteger(umbralInput)) {
      setConfigError('El umbral mínimo debe ser un número entero mayor o igual a cero.');
      return;
    }

    setIsSavingConfig(true);
    try {
      await actualizarConfiguracionAtomic({
        precioLista: precioListaInput,
        umbralMinimo: umbralInput,
        stockManual: showAjusteManual ? stockManualInput : undefined
      });
      setConfigSuccess('Configuración actualizada correctamente en la base de datos.');
      setShowAjusteManual(false);
      setTimeout(() => setConfigSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error al guardar configuración:', err);
      setConfigError('Ocurrió un problema al guardar la configuración.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const isLowStock = inventario.stock <= inventario.umbralMinimo;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-8 h-8 text-orange-600" />
            <span>Control de Inventario</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Gestión en tiempo real del balón de gas de 10 kg
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold self-start sm:self-auto">
          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
          <span>Sincronizado con Firestore</span>
        </div>
      </div>

      {/* Stock Status Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border-2 transition-all ${
        isLowStock 
          ? 'bg-amber-50/70 border-amber-400' 
          : 'bg-white border-slate-200'
      } shadow-sm`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1">
              Producto Único: Balón 10 kg
            </span>
            <div className="flex items-baseline gap-3">
              <span className={`text-5xl sm:text-6xl font-black tracking-tight ${
                isLowStock ? 'text-amber-600' : 'text-slate-900'
              }`}>
                {inventario.stock}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-slate-600">
                balones disponibles
              </span>
            </div>
            {isLowStock ? (
              <div className="mt-3 flex items-center gap-2 text-amber-800 font-bold text-sm bg-amber-100/70 px-3 py-1.5 rounded-xl inline-flex">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Stock bajo: igual o menor al umbral ({inventario.umbralMinimo} balones)</span>
              </div>
            ) : (
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Stock óptimo (Umbral de alerta en {inventario.umbralMinimo} balones)
              </p>
            )}
          </div>

          <div className="bg-slate-100 p-4 rounded-2xl sm:text-right border border-slate-200/80">
            <span className="text-xs font-bold text-slate-500 block">Precio de lista configurado</span>
            <span className="text-2xl font-black text-slate-900">
              S/. {inventario.precioLista.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Formulario 1: Reabastecimiento de Stock (Ingreso de nuevos balones) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Reabastecimiento de Stock
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Registra el camión o pedido de balones recibidos para sumarlos al stock actual.
            </p>
          </div>
        </div>

        {reabastecerSuccess && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{reabastecerSuccess}</span>
          </div>
        )}

        {reabastecerError && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold flex items-center gap-2 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{reabastecerError}</span>
          </div>
        )}

        <form onSubmit={handleReabastecer} className="space-y-4">
          <div>
            <label className="block text-sm font-extrabold text-slate-800 mb-2">
              Cantidad de balones que ingresaron
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                min="1"
                step="1"
                value={cantidadReabastecer}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setCantidadReabastecer(isNaN(val) ? 1 : val);
                  setReabastecerError(null);
                }}
                required
                disabled={isReabasteciendo}
                placeholder="Ej: 20"
                className="flex-1 h-14 px-4 text-2xl font-black bg-slate-50 border-2 border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
              />
              <button
                type="submit"
                disabled={isReabasteciendo}
                className="h-14 px-8 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-95 text-white font-black rounded-2xl shadow-lg shadow-orange-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-base"
              >
                {isReabasteciendo ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    <span>Sumar al Stock</span>
                  </>
                )}
              </button>
            </div>
            {/* Quick preset buttons */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-400 font-bold">Rápido:</span>
              {[5, 10, 20, 30, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCantidadReabastecer(preset)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Formulario 2: Configuración del Negocio (Precio de lista y Umbral mínimo) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Configuración de Precios y Alertas
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Personaliza el precio de lista precargado y la alerta de stock mínimo.
            </p>
          </div>
        </div>

        {configSuccess && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{configSuccess}</span>
          </div>
        )}

        {configError && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold flex items-center gap-2 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{configError}</span>
          </div>
        )}

        <form onSubmit={handleGuardarConfig} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Precio de Lista */}
            <div>
              <label className="block text-sm font-extrabold text-slate-800 mb-2">
                Precio de lista habitual (S/.)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-black">
                  S/.
                </span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={precioListaInput}
                  onChange={(e) => setPrecioListaInput(parseFloat(e.target.value) || 0)}
                  required
                  disabled={isSavingConfig}
                  className="w-full pl-11 pr-4 h-12 text-lg font-bold bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 text-slate-900"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Aparecerá precargado cada vez que abras "Registrar Venta".
              </p>
            </div>

            {/* Umbral Mínimo */}
            <div>
              <label className="block text-sm font-extrabold text-slate-800 mb-2">
                Umbral mínimo para alerta (balones)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <BellRing className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={umbralInput}
                  onChange={(e) => setUmbralInput(parseInt(e.target.value, 10) || 0)}
                  required
                  disabled={isSavingConfig}
                  className="w-full pl-10 pr-4 h-12 text-lg font-bold bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 text-slate-900"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Se mostrará alerta si el stock baja a esta cantidad o menos.
              </p>
            </div>
          </div>

          {/* Ajuste manual extraordinario (opcional para inventarios físicos) */}
          <div className="pt-2">
            {!showAjusteManual ? (
              <button
                type="button"
                onClick={() => setShowAjusteManual(true)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
              >
                ¿Deseas corregir manualmente el stock actual por conteo físico?
              </button>
            ) : (
              <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 mt-2">
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Corregir stock físico directamente:
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stockManualInput}
                  onChange={(e) => setStockManualInput(parseInt(e.target.value, 10) || 0)}
                  className="w-40 h-10 px-3 text-base font-bold bg-white border border-slate-300 rounded-lg"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Solo usar si hubo rotura, pérdida o conteo manual desfasado.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSavingConfig}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSavingConfig ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando cambios...</span>
              </>
            ) : (
              <span>Guardar Configuración</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
