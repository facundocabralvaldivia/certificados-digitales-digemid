import 'dotenv/config';
import { z } from 'zod';

// Parseo seguro de booleanos desde string (evita el pitfall de coerce.boolean).
const boolFromEnv = (def: 'true' | 'false') =>
  z
    .string()
    .default(def)
    .transform((v) => v.toLowerCase() === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(8002),

  // ── SQL Server ──────────────────────────────────────────────────────────
  DB_SERVER: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(1433),
  DB_NAME: z.string().default('CertVerificacion'),
  DB_USER: z.string().default('sa'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD es obligatorio'),
  DB_ENCRYPT: boolFromEnv('true'),
  DB_TRUST_SERVER_CERTIFICATE: boolFromEnv('true'),

  // ── Polygon ─────────────────────────────────────────────────────────────
  POLYGON_RPC_URL: z.string().url().default('https://rpc-amoy.polygon.technology'),
  POLYGON_CHAIN_ID: z.coerce.number().default(80002),
  ANCHOR_CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .default('0x0000000000000000000000000000000000000000'),
  // Opcional: solo necesaria para ESCRIBIR (anclar). Nunca llega al frontend.
  WALLET_PRIVATE_KEY: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .optional(),
  EXPLORER_TX_BASE: z.string().url().default('https://amoy.polygonscan.com/tx'),

  // ── Jobs ────────────────────────────────────────────────────────────────
  ANCHOR_CRON: z.string().default('0 3 * * *'),
  RUN_CRON: boolFromEnv('false'),
});

export const env = schema.parse(process.env);
export const isProd = env.NODE_ENV === 'production';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const redNombre = (chainId: number): string =>
  chainId === 137 ? 'polygon-pos' : 'polygon-amoy';
