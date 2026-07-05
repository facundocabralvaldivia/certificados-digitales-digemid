import {
  CertificadoAnexoRead,
  CertificadoPublicoRead,
  TecnicoAdjunto,
} from '../models/certificados.models';

const PDF_DEFAULT = '/certificado-oficial.pdf';
const CONTRATO = '0x9A7c4f2eD3b1A0C5e6F8d9B2a1C3E4F5a6B7c8D9';
const EXPLORER = 'https://amoy.polygonscan.com';

const TECNICO_DEMO_001: TecnicoAdjunto = {
  nombre: 'Q.F. María Elena Quispe Rojas',
  numero_colegiatura: 'CQFP 18452',
  horario_atencion: 'Lunes a sábado, 8:00 – 20:00',
  estado_colegiatura: 'ACTIVO',
};

function anexosDefault(): CertificadoAnexoRead[] {
  return [
    { clave: 'BPA', estado: 'VIGENTE', url: PDF_DEFAULT },
    { clave: 'BPF', estado: 'NO_VIGENTE', url: PDF_DEFAULT },
    { clave: 'BPM', estado: 'VIGENTE', url: PDF_DEFAULT },
    { clave: 'BPDT', estado: 'NO_REQUIERE' },
  ];
}

function anexosInkafarma(): CertificadoAnexoRead[] {
  return [
    {
      clave: 'BPA',
      estado: 'NO_VIGENTE',
      url: 'https://www.digemid.minsa.gob.pe/Certificados/Archivos/BPA/2025/BPA_1374-2025.pdf',
    },
    { clave: 'BPF', estado: 'NO_REQUIERE' },
    { clave: 'BPM', estado: 'NO_REQUIERE' },
    { clave: 'BPDT', estado: 'NO_REQUIERE' },
  ];
}

function hash(partes: string[]): string {
  // Determinista para demo (no criptográfico en cliente; el backend recalcula en prod).
  let h = 0;
  const s = partes.join('|');
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(h).toString(16).padStart(16, '0');
  return '0x' + hex.repeat(4).slice(0, 64);
}

function mockCert(
  codigo: string,
  opts: {
    razon_social: string;
    nombre_comercial: string;
    ruc: string;
    direccion: string;
    tecnico: TecnicoAdjunto;
    estado: CertificadoPublicoRead['estado'];
    integridad: CertificadoPublicoRead['integridad'];
    dias_emitido: number;
    certificado_pdf_url?: string;
    anexos?: CertificadoAnexoRead[];
  },
): CertificadoPublicoRead {
  const ahora = new Date();
  const emitido = new Date(ahora.getTime() - opts.dias_emitido * 86_400_000);
  const vigente = new Date(emitido.getTime() + 365 * 86_400_000);
  const txHash = hash([codigo, 'emision']);
  const dataHash = hash([opts.razon_social, opts.ruc, opts.estado, opts.tecnico.estado_colegiatura]);

  return {
    codigo_verificacion: codigo,
    razon_social: opts.razon_social,
    nombre_comercial: opts.nombre_comercial,
    ruc: opts.ruc,
    direccion: opts.direccion,
    tecnico: opts.tecnico,
    estado: opts.estado,
    blockchain: {
      red: 'polygon-amoy',
      contrato: CONTRATO,
      tx_hash: txHash,
      numero_bloque: 12_840_000 + (codigo.charCodeAt(codigo.length - 1) % 50_000),
      data_hash: dataHash,
      anclado_en: emitido.toISOString(),
      explorer_url: `${EXPLORER}/tx/${txHash}`,
    },
    integridad: opts.integridad,
    emitido_en: emitido.toISOString(),
    vigente_hasta: vigente.toISOString(),
    consultado_en: ahora.toISOString(),
    certificado_pdf_url: opts.certificado_pdf_url ?? PDF_DEFAULT,
    anexos: opts.anexos ?? anexosDefault(),
  };
}

/** Seed local alineado con backend/demo-fastapi (DIGEMID-DEMO-001 … 005). */
const MOCKS: Record<string, CertificadoPublicoRead> = {
  'DIGEMID-DEMO-001': mockCert('DIGEMID-DEMO-001', {
    razon_social: 'Botica San Rafael S.A.C.',
    nombre_comercial: 'Botica San Rafael',
    ruc: '20512345678',
    direccion: 'Av. Arequipa 1234, Lince, Lima',
    tecnico: TECNICO_DEMO_001,
    estado: 'HABILITADO',
    integridad: 'VERIFICADO',
    dias_emitido: 40,
  }),
  'DIGEMID-DEMO-002': mockCert('DIGEMID-DEMO-002', {
    razon_social: 'Distribuidora Farma Económica E.I.R.L.',
    nombre_comercial: 'Farmacia La Económica',
    ruc: '20587654321',
    direccion: 'Jr. Puno 567, Cercado, Arequipa',
    tecnico: {
      nombre: 'T.F. Juan Carlos Mamani Flores',
      numero_colegiatura: 'CTFP 7741',
      horario_atencion: 'Lunes a viernes, 9:00 – 18:00',
      estado_colegiatura: 'INACTIVO',
    },
    estado: 'NO_HABILITADO',
    integridad: 'ALTERADO',
    dias_emitido: 120,
  }),
  'DIGEMID-DEMO-003': mockCert('DIGEMID-DEMO-003', {
    razon_social: 'Cadena Salud Total S.A.',
    nombre_comercial: 'Botica Salud Total',
    ruc: '20498765432',
    direccion: 'Av. La Marina 2050, San Miguel, Lima',
    tecnico: {
      nombre: 'Q.F. Andrea Sofía Torres León',
      numero_colegiatura: 'CQFP 21098',
      horario_atencion: 'Todos los días, 7:00 – 23:00',
      estado_colegiatura: 'ACTIVO',
    },
    estado: 'HABILITADO',
    integridad: 'VERIFICADO',
    dias_emitido: 15,
  }),
  'DIGEMID-DEMO-004': mockCert('DIGEMID-DEMO-004', {
    razon_social: 'Inversiones Cruz Verde Centro S.A.C.',
    nombre_comercial: 'Farmacia Cruz Verde Centro',
    ruc: '20533221100',
    direccion: 'Av. Grau 880, Trujillo, La Libertad',
    tecnico: {
      nombre: 'T.F. Rosa Inés Huamán Vega',
      numero_colegiatura: 'CTFP 5532',
      horario_atencion: 'Lunes a sábado, 8:30 – 21:00',
      estado_colegiatura: 'INACTIVO',
    },
    estado: 'REVOCADO',
    integridad: 'ALTERADO',
    dias_emitido: 200,
  }),
  'DIGEMID-DEMO-005': mockCert('DIGEMID-DEMO-005', {
    razon_social: 'Boticas IP S.A.C.',
    nombre_comercial: 'Inkfarma 1503',
    ruc: '20100070970',
    direccion:
      'AV. JAVIER PRADO ESTE 2050, LC. M - 239 - 240, PISO 2 - ' +
      'CC. LA RAMBLA - SAN BORJA LIMA - LIMA - SAN BORJA',
    tecnico: TECNICO_DEMO_001,
    estado: 'HABILITADO',
    integridad: 'VERIFICADO',
    dias_emitido: 25,
    certificado_pdf_url: '/certificado_inkafarma.pdf',
    anexos: anexosInkafarma(),
  }),
};

/** Mock local cuando el demo FastAPI (:8001) no está disponible. */
export function obtenerMockCertificado(codigo: string): CertificadoPublicoRead | null {
  return MOCKS[codigo.toUpperCase()] ?? null;
}

/** Completa PDF y anexos si el backend responde con esquema parcial. */
export function enriquecerCertificado(
  codigo: string,
  data: Partial<CertificadoPublicoRead>,
): CertificadoPublicoRead {
  const key = (data.codigo_verificacion ?? codigo).toUpperCase();
  const mock = MOCKS[key];

  if (mock) {
    return {
      ...mock,
      ...data,
      certificado_pdf_url: data.certificado_pdf_url ?? mock.certificado_pdf_url,
      anexos: data.anexos?.length ? data.anexos : mock.anexos,
    };
  }

  return {
    ...(data as CertificadoPublicoRead),
    certificado_pdf_url: data.certificado_pdf_url ?? PDF_DEFAULT,
    anexos: data.anexos ?? [],
  };
}
