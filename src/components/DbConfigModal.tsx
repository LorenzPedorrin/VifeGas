import React, { useState } from 'react';
import { Database, CheckCircle, X, Info } from 'lucide-react';
import { FirestoreMapping } from '../types';
import { getFirestoreMapping, saveFirestoreMapping } from '../firebase';

interface DbConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const DbConfigModal: React.FC<DbConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const current = getFirestoreMapping();
  const [ventasCol, setVentasCol] = useState(current.ventasCollection);
  const [invCol, setInvCol] = useState(current.inventarioCollection);
  const [invDoc, setInvDoc] = useState(current.inventarioDocId);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newMapping: FirestoreMapping = {
      ventasCollection: ventasCol.trim() || 'ventas',
      inventarioCollection: invCol.trim() || 'inventario',
      inventarioDocId: invDoc.trim() || 'stock'
    };
    saveFirestoreMapping(newMapping);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onConfigSaved();
      onClose();
    }, 800);
  };

  const handleResetDefaults = () => {
    setVentasCol('ventas');
    setInvCol('inventario');
    setInvDoc('stock');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Colecciones de Firebase Firestore
              </h3>
              <p className="text-xs text-slate-500">
                Proyecto: <span className="font-bold text-slate-800">vifegas</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 mb-5 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Conexión directa a tu base de datos ya existente.</p>
            <p className="text-blue-800 mt-0.5">
              Aquí puedes verificar o sincronizar los nombres exactos que creaste en tu consola de Firebase.
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Configuración de colecciones guardada. Reiniciando listeners...</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Nombre de Colección de Ventas
            </label>
            <input
              type="text"
              value={ventasCol}
              onChange={(e) => setVentasCol(e.target.value)}
              placeholder="ventas"
              required
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Campos: cantidad, precio, total, motivo, fecha
            </p>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Nombre de Colección de Inventario
            </label>
            <input
              type="text"
              value={invCol}
              onChange={(e) => setInvCol(e.target.value)}
              placeholder="inventario"
              required
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              ID del Documento de Stock
            </label>
            <input
              type="text"
              value={invDoc}
              onChange={(e) => setInvDoc(e.target.value)}
              placeholder="stock"
              required
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Campos: stock, precioLista, umbralMinimo
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Restablecer valores por defecto
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl shadow-md transition-all"
            >
              Guardar y Conectar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
