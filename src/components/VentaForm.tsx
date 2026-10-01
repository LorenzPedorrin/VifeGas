import React, { useState, useEffect, useId } from 'react';
import { 
  ShoppingCart, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Plus, 
  Minus, 
  Package, 
  FileEdit
} from 'lucide-react';
import { InventarioConfig } from '../types';
import { registrarVentaAtomic } from '../firebase';

interface VentaFormProps {
  inventario: InventarioConfig;
  onVentaSuccess?: () => void;
}

export const VentaForm: React.FC<VentaFormProps> = ({
  inventario,
  onVentaSuccess
}) => {
  const [cantidad, setCantidad] = useState<number>(1);
  const [precio, setPrecio] = useState<number>(inventario.precioLista || 50);
  const [motivo, setMotivo] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync initial price if list price updates from Firestore
  useEffect(() => {
    if (inventario.precioLista > 0 && precio === 50) {
      setPrecio(inventario.precioLista);
    }
  }, [inventario.precioLista]);

  // Real-time calculated total
  const totalCalculado = Math.max(0, cantidad * (isNaN(precio) ? 0 : precio));

  const handleIncrement = () => {
    setCantidad((prev) => {
      const next = prev + 1;
      return next;
    });
    setErrorMessage(null);
  };

  const handleDecrement = () => {
    setCantidad((prev) => {
      if (prev <= 1) return 1;
      return prev - 1;
    });
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation 1: Cantidad
    if (!cantidad || cantidad <= 0 || !Number.isInteger(cantidad)) {
      setErrorMessage('Escribe una cantidad mayor a cero (número entero).');
      return;
    }

    // Validation 2: Stock check before initiating
    if (cantidad > inventario.stock) {
      setErrorMessage(`No hay suficiente stock. Disponible: ${inventario.stock} balones`);
      return;
    }

    // Validation 3: Price
    if (isNaN(precio) || precio < 0) {
      setErrorMessage('Escribe un precio válido.');
      return;
    }

    // Validation 4: Zero price requires motive
    if (precio === 0 && (!motivo || !motivo.trim())) {
      setErrorMessage('Si el precio es cero, escribe el motivo.');
      return;
    }

    // Double-click lock
    setIsSubmitting(true);

    try {
      await registrarVentaAtomic({
        cantidad,
        precio,
        motivo: motivo.trim() || undefined
      });

      // Visual success confirmation
      setSuccessMessage(`¡Venta guardada con éxito! Se descontaron ${cantidad} ${cantidad === 1 ? 'balón' : 'balones'}.`);
      
      // Reset form to list price & 1 unit
      setCantidad(1);
      setPrecio(inventario.precioLista || 50);
      setMotivo('');

      if (onVentaSuccess) {
        onVentaSuccess();
      }

      // Automatically hide success message after 4.5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4500);
    } catch (err: any) {
      console.error('Error al registrar venta:', err);
      // Case 1 & Case 3 & Case 11
      if (err.message && err.message.includes('No hay suficiente stock')) {
        setErrorMessage(err.message);
      } else if (!navigator.onLine) {
        setErrorMessage('Sin conexión. Revisa tu internet e intenta de nuevo.');
      } else {
        setErrorMessage('Ocurrió un problema, intenta de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPriceModified = Math.abs(precio - inventario.precioLista) > 0.01;

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-orange-600" />
              <span>Registrar Venta</span>
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Balón de gas de 10 kg
            </p>
          </div>

          {/* Quick Stock Indicator Badge */}
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Disponible
            </span>
            <span className={`text-xl sm:text-2xl font-black ${
              inventario.stock <= inventario.umbralMinimo ? 'text-amber-600' : 'text-slate-800'
            }`}>
              {inventario.stock} balones
            </span>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3 text-sm font-bold animate-fadeIn">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p>{successMessage}</p>
              <p className="text-xs font-medium text-emerald-600 mt-0.5">
                El stock se ha descontado automáticamente en tiempo real.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm font-bold animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo 1: Cantidad */}
          <div>
            <label className="block text-sm font-extrabold text-slate-800 mb-2">
              Cantidad de balones (10 kg)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={cantidad <= 1 || isSubmitting}
                className="w-14 h-14 bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-40 text-slate-700 rounded-2xl flex items-center justify-center font-bold transition-all text-xl"
              >
                <Minus className="w-6 h-6" />
              </button>

              <div className="flex-1 relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={cantidad}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setCantidad(isNaN(val) ? 1 : val);
                    setErrorMessage(null);
                  }}
                  required
                  disabled={isSubmitting}
                  className="w-full h-14 text-center text-3xl font-black bg-slate-50 border-2 border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 transition-all"
                />
              </div>

              <button
                type="button"
                onClick={handleIncrement}
                disabled={isSubmitting}
                className="w-14 h-14 bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-40 text-slate-700 rounded-2xl flex items-center justify-center font-bold transition-all text-xl"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            {cantidad > inventario.stock && (
              <p className="mt-2 text-xs font-bold text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Supera el stock disponible ({inventario.stock} balones)
              </p>
            )}
          </div>

          {/* Campo 2: Precio Unitario */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-extrabold text-slate-800">
                Precio unitario (S/.)
              </label>
              {isPriceModified && (
                <button
                  type="button"
                  onClick={() => setPrecio(inventario.precioLista)}
                  className="text-xs font-bold text-orange-600 hover:underline"
                >
                  Restablecer precio de lista (S/. {inventario.precioLista.toFixed(2)})
                </button>
              )}
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-black text-xl pointer-events-none">
                S/.
              </span>
              <input
                type="number"
                step="0.50"
                min="0"
                value={isNaN(precio) ? '' : precio}
                onChange={(e) => {
                  setPrecio(parseFloat(e.target.value));
                  setErrorMessage(null);
                }}
                required
                disabled={isSubmitting}
                className="w-full pl-14 pr-4 h-14 text-2xl font-black bg-slate-50 border-2 border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 transition-all"
              />
            </div>
            <p className="mt-1 text-xs font-medium text-slate-400">
              Precargado con el precio de lista. Puedes cambiarlo libremente.
            </p>
          </div>

          {/* Campo 3: Motivo opcional (o requerido si precio = 0) */}
          <div>
            <label className="block text-sm font-extrabold text-slate-800 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileEdit className="w-4 h-4 text-slate-500" />
                <span>Motivo {precio === 0 ? '(Obligatorio por precio S/. 0)' : '(Opcional)'}</span>
              </span>
              {precio === 0 && (
                <span className="text-xs font-bold text-amber-600">Requerido</span>
              )}
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={precio === 0 ? "Ej: Cortesía, apoyo familiar, préstamo" : "Ej: Descuento por compra múltiple, familiar"}
              disabled={isSubmitting}
              className={`w-full px-4 py-3.5 text-base bg-slate-50 border-2 ${
                precio === 0 && !motivo.trim() ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'
              } rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 transition-all font-medium`}
            />
          </div>

          {/* Cálculo automático del Total (Visible mientras escribe) */}
          <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 block">
                Total a Cobrar
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {cantidad} {cantidad === 1 ? 'balón' : 'balones'} × S/. {(isNaN(precio) ? 0 : precio).toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-3xl sm:text-4xl font-black text-amber-400">
                S/. {totalCalculado.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Botón de Guardar con protección de Doble Clic */}
          <button
            type="submit"
            disabled={isSubmitting || cantidad > inventario.stock}
            className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-[0.99] text-white text-lg font-black rounded-2xl shadow-xl shadow-orange-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
                <span>Guardar Venta (S/. {totalCalculado.toFixed(2)})</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
