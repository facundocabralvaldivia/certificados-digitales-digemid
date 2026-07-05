import sql from 'mssql';
import { env } from '../config/env';

let poolPromise: Promise<sql.ConnectionPool> | null = null;

function baseConfig(database: string): sql.config {
  return {
    server: env.DB_SERVER,
    port: env.DB_PORT,
    database,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    options: {
      encrypt: env.DB_ENCRYPT,
      trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  };
}

/** Pool singleton hacia la base de datos de la aplicacion. */
export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(baseConfig(env.DB_NAME)).connect();
  }
  return poolPromise as Promise<sql.ConnectionPool>;
}

/** Conexion temporal a `master` (para crear la BD si no existe). */
export function connectMaster(): Promise<sql.ConnectionPool> {
  return new sql.ConnectionPool(baseConfig('master')).connect();
}

export { sql };
