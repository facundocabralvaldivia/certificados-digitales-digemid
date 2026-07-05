import type { ProofStep } from '../merkle/merkle';

/**
 * Payload canonico exacto de un establecimiento. Estos son los unicos campos
 * que entran a la hoja del Merkle Tree. DEBE coincidir con el tipo del frontend.
 */
export interface EstablecimientoCanonical {
  certificadoId: string;
  ruc: string;
  nombreComercial: string;
  razonSocial: string;
  direccion: string;
  ubicacion: string;
  directorTecnico: string;
  numeroColegiatura: string;
  estadoColegiatura: string;
  horarioDT: string;
  estadoEstablecimiento: string;
  emitidoEn: string;
}

export interface RegistroConProof {
  certificadoId: string;
  proof: ProofStep[];
}

export interface LoteMeta {
  batchId: string;
  batchUuid: string;
  merkleRoot: string;
  txHash: string | null;
  blockNumber: number | null;
  red: string;
  estado: string;
  ancladoEn: string;
}

export interface VerificacionPayload {
  certificadoId: string;
  batchId: string;
  merkleRoot: string;
  txHash: string | null;
  blockNumber: number | null;
  red: string;
  ancladoEn: string;
  establecimiento: EstablecimientoCanonical;
  merkleProof: ProofStep[];
}
