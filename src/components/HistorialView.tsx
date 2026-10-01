import React, { useState, useMemo } from 'react';
import { 
  History, 
  Calendar, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  X, 
  Search, 
  DollarSign, 
  Flame, 
  Package
} from 'lucide-react';
import { Venta, InventarioConfig } from '../types';
import { editarVentaAtomic, eliminarVentaAtomic } from '../firebase';

interface HistorialViewProps {
  ventas: Venta[];
  inventario: InventarioConfig;
}

export const HistorialView: React.FC<HistorialViewProps> = ({ ventas, inventario }) => {
  // Date filters
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterError, setFilterError] = useState<string | null>(null);

  // Edit modal state
  const [editingVenta, setEditingVenta] = useState<Venta | null>(null);
  const [editCantidad, setEditCantidad] = useState<number>(1);
  const [editPrecio, setEditPrecio] = useState<number>(50);
  const [editMotivo, setEditMotivo] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete modal state
  const [deletingVenta, setDeletingVenta] = useState<Venta | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Global action notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Quick Preset Filters
  const handlePreset = (type: 'today' | '7days' | 'month' | 'all') => {
    setFilterError(null);
    const now = new Date();
    const toISODate = (d: Date) => d.toISOString().split('T')[0];

    if (type === 'all') {
      setFilterStartDate('');
      setFilterEndDate('');
      return;
    }

    if (type === 'today') {
      const todayStr = toISODate(now);
      setFilterStartDate(todayStr);
      setFilterEndDate(todayStr);
      return;
    }

    if (type === '7days') {
      const start = new Date();
      start.setDate(now.getDate() - 6);
      setFilterStartDate(toISODate(start));
      setFilterEndDate(toISODate(now));
      return;
    }

    if (type === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setFilterStartDate(toISODate(start));
      setFilterEndDate(toISODate(now));
      return;
    }
  };

  // Validate and filter sales list
  const filteredVentas = useMemo(() => {
    // Caso 9: Validación de rango de fechas
    if (filterStartDate && filterEndDate && filterEndDate < filterStartDate) {
      setFilterError('La fecha final no puede ser anterior a la inicial.');
      return [];
    }

    return ventas.filter((v) => {
      const vDateStr = v.fecha.toISOString().split('T')[0];
      if (filterStartDate && vDateStr < filterStartDate) return false;
      if (filterEndDate && vDateStr > filterEndDate) return false;
      return true;
    });
  }, [ventas, filterStartDate, filterEndDate]);

  // Open Edit Modal
  const openEditModal = (venta: Venta) => {
    setEditingVenta(venta);
    setEditCantidad(venta.cantidad);
    setEditPrecio(venta.precio);
    setEditMotivo(venta.motivo || '');
    setEditError(null);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVenta) return;
    setEditError(null);

    if (!editCantidad || editCantidad <= 0 || !Number.isInteger(editCantidad)) {
      setEditError('Escribe una cantidad mayor a cero (número entero).');
      return;
    }
    if (isNaN(editPrecio) || editPrecio < 0) {
      setEditError('Escribe un precio válido.');
      return;
    }
    if (editPrecio === 0 && (!editMotivo || !editMotivo.trim())) {
      setEditError('Si el precio es cero, escribe el motivo.');
      return;
    }

    setIsSavingEdit(true);
    try {
      await editarVentaAtomic(
        editingVenta.id,
        {
          cantidad: editCantidad,
          precio: editPrecio,
          motivo: editMotivo.trim() || undefined
        },
        editingVenta.cantidad
      );

      setActionSuccess('Venta actualizada y stock recalculado correctamente.');
      setEditingVenta(null);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error al editar venta:', err);
      if (err.message && err.message.includes('No hay suficiente stock')) {
        setEditError(err.message);
      } else if (!navigator.onLine) {
        setEditError('Sin conexión. Revisa tu internet e intenta de nuevo.');
      } else {
        setEditError('Ocurrió un problema, intenta de nuevo.');
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingVenta) return;
    setDeleteError(null);
    setIsDeleting(true);

    try {
      await eliminarVentaAtomic(deletingVenta.id, deletingVenta.cantidad);
      setActionSuccess(`Venta eliminada. Se devolvieron +${deletingVenta.cantidad} balones al stock.`);
      setDeletingVenta(null);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error('Error al eliminar venta:', err);
      if (!navigator.onLine) {
        setDeleteError('Sin conexión. Revisa tu internet e intenta de nuevo.');
      } else {
        setDeleteError('Ocurrió un problema, intenta de nuevo.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats for the active filter
  const totalFiltrado = filteredVentas.reduce((acc, v) => acc + v.total, 0);
  const balonesFiltrados = filteredVentas.reduce((acc, v) => acc + v.cantidad, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-8 h-8 text-orange-600" />
            <span>Historial de Ventas</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Registro cronológico en tiempo real (más reciente a más antigua)
          </p>
        </div>

        {/* Totals in filter badge */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total en pantalla</span>
            <span className="text-lg font-black text-emerald-700">S/. {totalFiltrado.toFixed(2)}</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Balones</span>
            <span className="text-lg font-black text-slate-800">{balonesFiltrados} und.</span>
          </div>
        </div>
      </div>

      {/* Action Success Toast */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Date Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-black text-slate-800">Filtrar por fecha:</span>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handlePreset('today')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={() => handlePreset('7days')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => handlePreset('month')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Este mes
            </button>
            <button
              onClick={() => handlePreset('all')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors"
            >
              Ver Todas
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Desde:
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => {
                setFilterStartDate(e.target.value);
                setFilterError(null);
              }}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Hasta:
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => {
                setFilterEndDate(e.target.value);
                setFilterError(null);
              }}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Caso 9: Error de rango */}
        {filterError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{filterError}</span>
          </div>
        )}
      </div>

      {/* Lista de Ventas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredVentas.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Flame className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-base font-bold text-slate-600">No se encontraron ventas para este período</p>
            <p className="text-xs text-slate-400 mt-1">Prueba cambiando el filtro o registra una venta nueva.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredVentas.map((venta) => {
              const dateStr = venta.fecha.toLocaleDateString('es-PE', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });
              const timeStr = venta.fecha.toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={venta.id} 
                  className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left: Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-black text-slate-900">
                        {venta.cantidad} {venta.cantidad === 1 ? 'balón' : 'balones'} (10 kg)
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        S/. {venta.precio.toFixed(2)} c/u
                      </span>
                      {venta.precio === 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Gratis / S/. 0
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                      <span>{dateStr}, {timeStr}</span>
                      {venta.motivo && (
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 font-semibold">
                          Motivo: {venta.motivo}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Total and Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                      <span className="text-xl font-black text-emerald-700">
                        S/. {venta.total.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(venta)}
                        className="p-2.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
                        title="Editar venta"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingVenta(venta);
                          setDeleteError(null);
                        }}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Eliminar venta y devolver stock"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Editar Venta (Caso 5) */}
      {editingVenta && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-orange-600" />
                <span>Editar Venta</span>
              </h3>
              <button
                onClick={() => setEditingVenta(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                <span>Stock disponible actual: <strong>{inventario.stock} balones</strong>.</span>
                <span className="block mt-0.5 text-slate-400">
                  Cantidad original de esta venta: {editingVenta.cantidad} balones.
                </span>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Nueva Cantidad de balones
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={editCantidad}
                  onChange={(e) => setEditCantidad(parseInt(e.target.value, 10) || 1)}
                  required
                  className="w-full h-12 px-3 text-lg font-black bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Precio Unitario (S/.)
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={editPrecio}
                  onChange={(e) => setEditPrecio(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full h-12 px-3 text-lg font-black bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1">
                  Motivo {editPrecio === 0 ? '(Obligatorio por precio S/. 0)' : '(Opcional)'}
                </label>
                <input
                  type="text"
                  value={editMotivo}
                  onChange={(e) => setEditMotivo(e.target.value)}
                  placeholder="Motivo del precio o corrección"
                  className="w-full h-11 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 text-slate-900"
                />
              </div>

              <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-sm">
                <span>Nuevo Total:</span>
                <span className="text-xl font-black text-amber-400">
                  S/. {(editCantidad * editPrecio).toFixed(2)}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVenta(null)}
                  disabled={isSavingEdit}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminar Venta (Caso 6) */}
      {deletingVenta && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 animate-scaleIn">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-slate-900">
              ¿Seguro que quieres eliminar esta venta?
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              Se anulará la venta de <strong>{deletingVenta.cantidad} {deletingVenta.cantidad === 1 ? 'balón' : 'balones'}</strong> (S/. {deletingVenta.total.toFixed(2)}) y se devolverán automáticamente al stock disponible.
            </p>

            {deleteError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeletingVenta(null)}
                disabled={isDeleting}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
              >
                No, cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Sí, eliminar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
