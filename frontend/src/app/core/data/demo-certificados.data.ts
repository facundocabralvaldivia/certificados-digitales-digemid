import { CertificadoPublicoRead } from '../models/certificados.models';

const PDF_DEFAULT = '/CERTIFICADO OFICIAL.pdf';

/** Mock completo cuando el backend demo aún no tiene el seed (p. ej. instancia antigua en :8001). */
export function obtenerMockCertificado(codigo: string): CertificadoPublicoRead | null {
  const key = codigo.toUpperCase();
  if (key !== 'DIGEMID-DEMO-005') {
    return null;
  }

  const ahora = new Date().toISOString();
  return {
    codigo_verificacion: 'DIGEMID-DEMO-005',
    razon_social: 'Boticas IP S.A.C.',
    nombre_comercial: 'Inkfarma 1503',
    ruc: '20100070970',
    direccion:
      'AV. JAVIER PRADO ESTE 2050, LC. M - 239 - 240, PISO 2 - ' +
      'CC. LA RAMBLA - SAN BORJA LIMA - LIMA - SAN BORJA',
    tecnico: {
      nombre: 'Q.F. María Elena Quispe Rojas',
      numero_colegiatura: 'CQFP 18452',
      horario_atencion: 'Lunes a sábado, 8:00 – 20:00',
      estado_colegiatura: 'ACTIVO',
    },
    estado: 'HABILITADO',
    blockchain: {
      red: 'polygon-amoy',
      contrato: '0x9A7c4f2eD3b1A0C5e6F8d9B2a1C3E4F5a6B7c8D9',
      tx_hash: '0x' + 'a'.repeat(64),
      numero_bloque: 12845000,
      data_hash: '0x' + 'b'.repeat(64),
      anclado_en: ahora,
      explorer_url: 'https://amoy.polygonscan.com/tx/0x' + 'a'.repeat(64),
    },
    integridad: 'VERIFICADO',
    emitido_en: ahora,
    vigente_hasta: ahora,
    consultado_en: ahora,
    certificado_pdf_url: '/certificado_inkafarma.pdf',
    anexos: [],
  };
}

/** Completa PDF si el backend responde con esquema antiguo. */
export function enriquecerCertificado(
  codigo: string,
  data: Partial<CertificadoPublicoRead>,
): CertificadoPublicoRead {
  const key = (data.codigo_verificacion ?? codigo).toUpperCase();
  const mock = obtenerMockCertificado(key);

  if (mock && key === 'DIGEMID-DEMO-005') {
    return { ...mock, ...data, certificado_pdf_url: '/certificado_inkafarma.pdf', anexos: [] };
  }

  return {
    ...(data as CertificadoPublicoRead),
    certificado_pdf_url: data.certificado_pdf_url ?? PDF_DEFAULT,
    anexos: [],
  };
}
