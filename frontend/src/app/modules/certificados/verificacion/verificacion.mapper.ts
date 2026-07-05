import { environment } from '../../../../environments/environment';
import {
  CertificadoPublicoRead,
  EstadoColegiatura,
  ResultadoIntegridad,
} from '../../../core/models/certificados.models';
import { VerificacionResponse } from '../../../core/services/verificacion-blockchain.service';

const PDF_DEFAULT = '/certificado-1.pdf';

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapColegiatura(estado: string): EstadoColegiatura {
  const u = estado.toUpperCase();
  if (u === 'ACTIVO' || u === 'HABIL' || u === 'HABILITADO') {
    return 'ACTIVO';
  }
  return 'INACTIVO';
}

/** Adapta la respuesta del backend Web3 al modelo visual del demo institucional. */
export function toCertificadoPublico(
  resp: VerificacionResponse,
  integridad: ResultadoIntegridad,
): CertificadoPublicoRead {
  const e = resp.establecimiento;
  const txHash = resp.txHash ?? '';

  return {
    codigo_verificacion: resp.certificadoId,
    razon_social: e.razonSocial,
    nombre_comercial: e.nombreComercial,
    ruc: e.ruc,
    direccion: e.direccion,
    ubicacion: e.ubicacion,
    tecnico: {
      nombre: e.directorTecnico,
      numero_colegiatura: e.numeroColegiatura,
      horario_atencion: e.horarioDT,
      estado_colegiatura: mapColegiatura(e.estadoColegiatura),
    },
    estado: e.estadoEstablecimiento,
    blockchain: {
      red: 'polygon-amoy',
      contrato: environment.anchorContractAddress,
      tx_hash: txHash,
      numero_bloque: resp.blockNumber ?? 0,
      data_hash: resp.merkleRoot,
      anclado_en: resp.ancladoEn,
      explorer_url: txHash ? `${environment.explorerTxBase}/${txHash}` : '',
    },
    integridad,
    emitido_en: e.emitidoEn,
    vigente_hasta: null,
    consultado_en: new Date().toISOString(),
    certificado_pdf_url: resp.certificadoPdfUrl || PDF_DEFAULT,
    anexos: [],
  };
}
