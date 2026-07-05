export const environment = {
  production: false,
  // En dev, proxy.conf.json enruta verificacion/admin -> :8002 y certificados demo -> :8001.
  apiUrl: '/api/v1',
  publicSiteUrl: 'http://localhost:4200',

  // ── Verificacion on-chain (Polygon Amoy en dev) ────────────────────────────
  polygonRpcUrl: 'https://rpc-amoy.polygon.technology',
  polygonChainId: 80002,
  // ⚠ Reemplazar por la direccion del contrato CertificateAnchor desplegado.
  anchorContractAddress: '0x1D449DA3590C6Eb64A0Cf88A3792D4D6CeA18Da9',
  explorerTxBase: 'https://amoy.polygonscan.com/tx',
};
