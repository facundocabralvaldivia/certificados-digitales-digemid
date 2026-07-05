import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ContractFactory, Wallet } from 'ethers';
import { JsonRpcProvider } from 'ethers';
import 'dotenv/config';
import { env } from '../config/env';
import { logger } from '../shared/logger';

async function main(): Promise<void> {
  if (!env.WALLET_PRIVATE_KEY) {
    throw new Error('WALLET_PRIVATE_KEY no configurada en .env');
  }

  const buildDir = join(__dirname, '..', '..', 'contracts', 'build');
  const abi = JSON.parse(
    readFileSync(
      join(buildDir, 'contracts_CertificateAnchor_sol_CertificateAnchor.abi'),
      'utf-8',
    ),
  );
  const bytecode = readFileSync(
    join(buildDir, 'contracts_CertificateAnchor_sol_CertificateAnchor.bin'),
    'utf-8',
  ).trim();

  const provider = new JsonRpcProvider(env.POLYGON_RPC_URL, env.POLYGON_CHAIN_ID);
  const wallet = new Wallet(env.WALLET_PRIVATE_KEY, provider);

  logger.info('Desplegando CertificateAnchor', {
    red: env.POLYGON_CHAIN_ID,
    wallet: wallet.address,
  });

  const factory = new ContractFactory(abi, `0x${bytecode}`, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  logger.info('Contrato desplegado', { address });

  // Actualiza backend/.env
  const envPath = join(__dirname, '..', '..', '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const updated = envContent.replace(
    /ANCHOR_CONTRACT_ADDRESS=0x[a-fA-F0-9]{40}/,
    `ANCHOR_CONTRACT_ADDRESS=${address}`,
  );
  writeFileSync(envPath, updated);

  // Actualiza frontend environment.ts
  const frontEnvPath = join(
    __dirname,
    '..',
    '..',
    '..',
    'frontend',
    'src',
    'environments',
    'environment.ts',
  );
  const frontContent = readFileSync(frontEnvPath, 'utf-8');
  writeFileSync(
    frontEnvPath,
    frontContent.replace(
      /anchorContractAddress: '0x[a-fA-F0-9]{40}'/,
      `anchorContractAddress: '${address}'`,
    ),
  );

  console.log('\n=== CONTRATO DESPLEGADO ===');
  console.log('Direccion:', address);
  console.log('Explorer:  https://amoy.polygonscan.com/address/' + address);
  console.log('.env y environment.ts actualizados.\n');
}

main().catch((err) => {
  logger.error('Deploy fallo', { err: (err as Error).message });
  process.exit(1);
});
