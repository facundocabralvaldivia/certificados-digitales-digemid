/**
 * Modelos del dominio CERTIFICADOS (verificación pública de establecimientos).
 *
 * ⚠️ CONVENCIÓN DEL PROYECTO (AGENTS.md §"Tipos de datos clave"):
 * En el repositorio real estos tipos NO viven en un archivo aparte: deben
 * COPIARSE dentro de `src/app/core/models/index.ts`, 1:1 con los esquemas
 * Pydantic del backend. Se entregan aquí en archivo separado únicamente porque
 * el scaffold de `index.ts` no está presente en este workspace de diseño.
 *
 * Todos los interfaces son 1:1 con `backend/app/modules/certificados/schemas.py`.
 */

/** Estado de habilitación del establecimiento (lo que ve el ciudadano). */
export type EstadoCertificado = 'HABILITADO' | 'NO_HABILITADO' | 'REVOCADO';

/** Estado de la colegiatura del técnico/profesional adjunto. */
export type EstadoColegiatura = 'ACTIVO' | 'INACTIVO';

/** Red Polygon usada para el anclaje del certificado. */
export type RedPolygon = 'polygon-mainnet' | 'polygon-amoy';

/**
 * Resultado de comparar el hash de los datos vigentes contra el hash anclado
 * en blockchain. Es el corazón de la verificación de integridad.
 */
export type ResultadoIntegridad = 'VERIFICADO' | 'ALTERADO' | 'NO_ANCLADO';

/** Estado de un certificado anexo del establecimiento (BPA, BPF, etc.). */
export type EstadoAnexo = 'VIGENTE' | 'NO_VIGENTE' | 'NO_REQUIERE';

/** Certificado anexo visible en la verificación pública. */
export interface CertificadoAnexoRead {
  clave: string;
  estado: EstadoAnexo;
  url?: string | null;
}

/** Datos del técnico/profesional adjunto responsable del establecimiento. */
export interface TecnicoAdjunto {
  nombre: string;
  numero_colegiatura: string;
  horario_atencion: string;
  estado_colegiatura: EstadoColegiatura;
}

/** Anclaje del certificado en la red Polygon. */
export interface AnclajeBlockchain {
  red: RedPolygon;
  contrato: string;        // dirección del smart contract (0x…)
  tx_hash: string;         // hash de la transacción de emisión (0x…)
  numero_bloque: number;
  data_hash: string;       // keccak256 de los datos canonizados del certificado
  anclado_en: string;      // ISO-8601 — timestamp de confirmación on-chain
  explorer_url: string;    // enlace a polygonscan
}

/**
 * Vista PÚBLICA del certificado (endpoint sin login).
 * Solo expone los 8 campos institucionales + el anclaje + la integridad.
 * NUNCA incluye PII fuera de los campos requeridos (Ley 29733).
 */
export interface CertificadoPublicoRead {
  codigo_verificacion: string;   // identificador del QR (no es el id interno)
  razon_social: string;
  nombre_comercial: string;
  ruc: string;
  direccion: string;
  /** Distrito / provincia / departamento (opcional, flujo Web3). */
  ubicacion?: string;
  tecnico: TecnicoAdjunto;
  estado: EstadoCertificado;
  blockchain: AnclajeBlockchain;
  integridad: ResultadoIntegridad;
  emitido_en: string;            // ISO-8601
  vigente_hasta: string | null;  // ISO-8601 | null si no expira
  consultado_en: string;         // ISO-8601 — momento de la consulta (server)
  certificado_pdf_url: string;
  anexos: CertificadoAnexoRead[];
}

/* ─────────────────────────  PANEL INTERNO (requiere login)  ───────────────── */

/** Fila de la tabla administrativa de certificados. */
export interface CertificadoAdminRead {
  id: string;
  codigo_verificacion: string;
  razon_social: string;
  nombre_comercial: string;
  ruc: string;
  /** Distrito / provincia / departamento (flujo Web3). */
  ubicacion?: string;
  estado: EstadoCertificado;
  red: RedPolygon;
  tx_hash: string | null;        // null si aún no anclado
  /** true cuando el lote tiene tx confirmada on-chain. */
  anclado?: boolean;
  emitido_en: string | null;
  emitido_por: string;           // usuario INTERNO que emitió
}

/** Métricas agregadas para el dashboard del panel interno. */
export interface CertificadoMetrics {
  total_emitidos: number;
  activos: number;               // HABILITADO con colegiatura ACTIVO
  revocados: number;
  pendientes_anclaje: number;    // emitidos sin confirmación on-chain
}

/** Estado de una transacción en la red Polygon (log del panel). */
export type EstadoTx = 'PENDIENTE' | 'CONFIRMADA' | 'FALLIDA';

/** Entrada del log de transacciones blockchain del panel interno. */
export interface TransaccionBlockchainRead {
  tx_hash: string;
  tipo: 'EMISION' | 'REVOCACION';
  estado_tx: EstadoTx;
  codigo_verificacion: string;
  numero_bloque: number | null;
  gas_usado: number | null;
  red: RedPolygon;
  registrado_en: string;         // ISO-8601
  explorer_url: string;
}

/** Payload para emitir un nuevo certificado (POST interno). */
export interface CertificadoEmitirInput {
  ruc: string;                   // el backend resuelve el resto desde la BD DIGEMID
  vigencia_meses: number;
}
