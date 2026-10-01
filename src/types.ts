export interface Venta {
  id: string;
  cantidad: number;
  precio: number;
  total: number;
  motivo?: string;
  fecha: Date; // standard parsed Date
  fechaRaw?: any; // original firestore timestamp or ISO
}

export interface InventarioConfig {
  stock: number;
  precioLista: number;
  umbralMinimo: number;
  ultimaActualizacion?: Date;
}

export interface FirestoreMapping {
  ventasCollection: string;
  inventarioCollection: string;
  inventarioDocId: string;
}
