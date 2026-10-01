import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  collection,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { Venta, InventarioConfig, FirestoreMapping } from './types';

// Exact Firebase project configuration for "vifegas"
export const firebaseConfig = {
  apiKey: "AIzaSyDmoJswHihCSd2Bh5H8u_mox2-FwJ3IbZE",
  authDomain: "vifegas.firebaseapp.com",
  projectId: "vifegas",
  storageBucket: "vifegas.firebasestorage.app",
  messagingSenderId: "301808709416",
  appId: "1:301808709416:web:140057d5794dce7cf32a1d",
  measurementId: "G-597W5WCY87"
};

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);

// Stored mappings for collections and doc IDs (defaults to 'ventas' and 'inventario/stock')
const STORAGE_KEY_MAPPING = 'vifegas_firestore_mapping';

export function getFirestoreMapping(): FirestoreMapping {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MAPPING);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // fallback
  }
  return {
    ventasCollection: 'ventas',
    inventarioCollection: 'inventario',
    inventarioDocId: 'stock'
  };
}

export function saveFirestoreMapping(mapping: FirestoreMapping): void {
  localStorage.setItem(STORAGE_KEY_MAPPING, JSON.stringify(mapping));
}

// Convert Firestore timestamp or string to JS Date
export function parseDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (value.seconds !== undefined) {
    return new Date(value.seconds * 1000);
  }
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Listen to inventory document in real time
export function subscribeToInventario(
  onUpdate: (data: InventarioConfig) => void,
  onError: (error: Error) => void
): () => void {
  const mapping = getFirestoreMapping();
  const invDocRef = doc(db, mapping.inventarioCollection, mapping.inventarioDocId);

  return onSnapshot(
    invDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.data();
        onUpdate({
          stock: typeof raw.stock === 'number' ? raw.stock : (raw.stockActual ?? 0),
          precioLista: typeof raw.precioLista === 'number' ? raw.precioLista : (raw.precio_lista ?? 50),
          umbralMinimo: typeof raw.umbralMinimo === 'number' ? raw.umbralMinimo : (raw.umbral_minimo ?? 5),
          ultimaActualizacion: raw.ultimaActualizacion ? parseDate(raw.ultimaActualizacion) : undefined
        });
      } else {
        // Document doesn't exist yet, return safe initial defaults
        onUpdate({
          stock: 0,
          precioLista: 50,
          umbralMinimo: 5
        });
      }
    },
    (err) => {
      onError(err);
    }
  );
}

// Listen to sales collection in real time
export function subscribeToVentas(
  onUpdate: (ventas: Venta[]) => void,
  onError: (error: Error) => void
): () => void {
  const mapping = getFirestoreMapping();
  const colRef = collection(db, mapping.ventasCollection);
  
  // Try ordering by fecha descending
  let q = query(colRef, orderBy('fecha', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Venta[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          cantidad: Number(d.cantidad) || 0,
          precio: Number(d.precio) || 0,
          total: Number(d.total) || 0,
          motivo: d.motivo || '',
          fecha: parseDate(d.fecha || d.createdAt || d.timestamp),
          fechaRaw: d.fecha
        });
      });
      onUpdate(list);
    },
    (err) => {
      // If error might be missing index on 'fecha', fallback to un-ordered query
      console.warn("Retrying subscribe to ventas without orderBy:", err);
      const fallbackUnsub = onSnapshot(
        colRef,
        (snap) => {
          const list: Venta[] = [];
          snap.forEach((docSnap) => {
            const d = docSnap.data();
            list.push({
              id: docSnap.id,
              cantidad: Number(d.cantidad) || 0,
              precio: Number(d.precio) || 0,
              total: Number(d.total) || 0,
              motivo: d.motivo || '',
              fecha: parseDate(d.fecha || d.createdAt || d.timestamp),
              fechaRaw: d.fecha
            });
          });
          // Sort client-side descending
          list.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
          onUpdate(list);
        },
        onError
      );
      return fallbackUnsub;
    }
  );
}

// ATOMIC TRANSACTION: Register Sale & Deduct Stock
export async function registrarVentaAtomic(params: {
  cantidad: number;
  precio: number;
  motivo?: string;
}): Promise<void> {
  const mapping = getFirestoreMapping();
  const invDocRef = doc(db, mapping.inventarioCollection, mapping.inventarioDocId);
  const ventasColRef = collection(db, mapping.ventasCollection);
  const newVentaRef = doc(ventasColRef);

  await runTransaction(db, async (transaction) => {
    const invSnap = await transaction.get(invDocRef);
    let currentStock = 0;
    let precioLista = params.precio;
    let umbralMinimo = 5;

    if (invSnap.exists()) {
      const data = invSnap.data();
      currentStock = typeof data.stock === 'number' ? data.stock : (data.stockActual ?? 0);
      precioLista = typeof data.precioLista === 'number' ? data.precioLista : params.precio;
      umbralMinimo = typeof data.umbralMinimo === 'number' ? data.umbralMinimo : 5;
    }

    // Verify stock availability
    if (currentStock < params.cantidad) {
      throw new Error(`No hay suficiente stock. Disponible: ${currentStock} balones`);
    }

    const nuevoStock = currentStock - params.cantidad;
    const total = params.cantidad * params.precio;

    // 1. Write sale document
    transaction.set(newVentaRef, {
      cantidad: params.cantidad,
      precio: params.precio,
      total: total,
      motivo: params.motivo ? params.motivo.trim() : null,
      fecha: serverTimestamp()
    });

    // 2. Update inventory document
    transaction.set(
      invDocRef,
      {
        stock: nuevoStock,
        precioLista: precioLista,
        umbralMinimo: umbralMinimo,
        ultimaActualizacion: serverTimestamp()
      },
      { merge: true }
    );
  });
}

// ATOMIC TRANSACTION: Restock (Reabastecimiento)
export async function reabastecerStockAtomic(cantidadAdicional: number): Promise<number> {
  if (cantidadAdicional <= 0 || !Number.isInteger(cantidadAdicional)) {
    throw new Error('La cantidad de reabastecimiento debe ser un número entero mayor a cero.');
  }

  const mapping = getFirestoreMapping();
  const invDocRef = doc(db, mapping.inventarioCollection, mapping.inventarioDocId);

  return await runTransaction(db, async (transaction) => {
    const invSnap = await transaction.get(invDocRef);
    let currentStock = 0;
    let precioLista = 50;
    let umbralMinimo = 5;

    if (invSnap.exists()) {
      const data = invSnap.data();
      currentStock = typeof data.stock === 'number' ? data.stock : (data.stockActual ?? 0);
      precioLista = typeof data.precioLista === 'number' ? data.precioLista : 50;
      umbralMinimo = typeof data.umbralMinimo === 'number' ? data.umbralMinimo : 5;
    }

    const nuevoStock = currentStock + cantidadAdicional;

    transaction.set(
      invDocRef,
      {
        stock: nuevoStock,
        precioLista: precioLista,
        umbralMinimo: umbralMinimo,
        ultimaActualizacion: serverTimestamp()
      },
      { merge: true }
    );

    return nuevoStock;
  });
}

// Update settings (Precio de lista y umbral mínimo)
export async function actualizarConfiguracionAtomic(params: {
  precioLista?: number;
  umbralMinimo?: number;
  stockManual?: number;
}): Promise<void> {
  const mapping = getFirestoreMapping();
  const invDocRef = doc(db, mapping.inventarioCollection, mapping.inventarioDocId);

  await runTransaction(db, async (transaction) => {
    const invSnap = await transaction.get(invDocRef);
    let currentStock = 0;
    let precioLista = 50;
    let umbralMinimo = 5;

    if (invSnap.exists()) {
      const data = invSnap.data();
      currentStock = typeof data.stock === 'number' ? data.stock : 0;
      precioLista = typeof data.precioLista === 'number' ? data.precioLista : 50;
      umbralMinimo = typeof data.umbralMinimo === 'number' ? data.umbralMinimo : 5;
    }

    const payload: any = {
      ultimaActualizacion: serverTimestamp()
    };

    if (params.precioLista !== undefined) {
      payload.precioLista = params.precioLista;
    }
    if (params.umbralMinimo !== undefined) {
      payload.umbralMinimo = params.umbralMinimo;
    }
    if (params.stockManual !== undefined) {
      payload.stock = params.stockManual;
    } else {
      payload.stock = currentStock;
    }

    transaction.set(invDocRef, payload, { merge: true });
  });
}

// ATOMIC TRANSACTION: Edit Sale & Adjust Stock (Caso 5)
export async function editarVentaAtomic(
  ventaId: string,
  nuevaData: {
    cantidad: number;
    precio: number;
    motivo?: string;
  },
  cantidadAnterior: number
): Promise<void> {
  const mapping = getFirestoreMapping();
  const invDocRef = doc(db, mapping.inventarioCollection, mapping.inventarioDocId);
  const ventaRef = doc(db, mapping.ventasCollection, ventaId);

  await runTransaction(db, async (transaction) => {
    const invSnap = await transaction.get(invDocRef);
    let currentStock = 0;

    if (invSnap.exists()) {
      const data = invSnap.data();
      currentStock = typeof data.stock === 'number' ? data.stock : 0;
    }

    // Difference in quantity: positive means user sold MORE, so we must deduct more
    const delta = nuevaData.cantidad - cantidadAnterior;

    // Check if inventory has enough stock if delta > 0
    if (delta > 0 && currentStock < delta) {
      throw new Error(`No hay suficiente stock para este aumento. Disponible: ${currentStock} balones`);
    }

    const nuevoStock = currentStock - delta;
    if (nuevoStock < 0) {
      throw new Error(`La modificación dejaría el stock en negativo (${nuevoStock}). Operación cancelada.`);
    }

    const total = nuevaData.cantidad * nuevaData.precio;

    // 1. Update sale doc
    transaction.update(ventaRef, {
      cantidad: nuevaData.cantidad,
      precio: nuevaData.precio,
      total: total,
      motivo: nuevaData.motivo ? nuevaData.motivo.trim() : null
    });

    // 2. Update stock
    transaction.set(
      invDocRef,
      {
        stock: nuevoStock,
        ultimaActualizacion: serverTimestamp()
      },
      { merge: true }
    );
  });
}

// ATOMIC TRANSACTION: Delete Sale & Restore Stock (Caso 6)
export async function eliminarVentaAtomic(
  ventaId: string,
  cantidadRestaurar: number
): Promise<void> {
  const mapping = getFirestoreMapping();
  const invDocRef = doc(db, mapping.inventarioCollection, mapping.inventarioDocId);
  const ventaRef = doc(db, mapping.ventasCollection, ventaId);

  await runTransaction(db, async (transaction) => {
    const invSnap = await transaction.get(invDocRef);
    let currentStock = 0;

    if (invSnap.exists()) {
      const data = invSnap.data();
      currentStock = typeof data.stock === 'number' ? data.stock : 0;
    }

    const nuevoStock = currentStock + (cantidadRestaurar > 0 ? cantidadRestaurar : 0);

    // 1. Delete sale
    transaction.delete(ventaRef);

    // 2. Restore stock
    transaction.set(
      invDocRef,
      {
        stock: nuevoStock,
        ultimaActualizacion: serverTimestamp()
      },
      { merge: true }
    );
  });
}
