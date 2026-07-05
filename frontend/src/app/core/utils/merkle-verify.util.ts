import { sha256, concat, toUtf8Bytes, getBytes } from 'ethers';

// DEBE coincidir byte a byte con backend/src/merkle/merkle.ts
const LEAF_PREFIX = '0x00';
const NODE_PREFIX = '0x01';

export interface ProofStep {
  position: 'left' | 'right';
  sibling: string;
}

export function canonicalize(record: Record<string, unknown>): string {
  const ordered = Object.keys(record)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = record[k];
      return acc;
    }, {});
  return JSON.stringify(ordered);
}

export function hashLeaf(canonicalJson: string): string {
  return sha256(concat([LEAF_PREFIX, toUtf8Bytes(canonicalJson)]));
}

function hashNode(left: string, right: string): string {
  return sha256(concat([NODE_PREFIX, getBytes(left), getBytes(right)]));
}

/** Verificacion sincrona del Merkle Proof contra el root. */
export function verifyProof(leaf: string, proof: ProofStep[], root: string): boolean {
  let computed = leaf;
  for (const step of proof) {
    computed =
      step.position === 'left' ? hashNode(step.sibling, computed) : hashNode(computed, step.sibling);
  }
  return computed.toLowerCase() === root.toLowerCase();
}
