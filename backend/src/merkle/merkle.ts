import { sha256, concat, toUtf8Bytes, getBytes } from 'ethers';

// Separacion de dominio para mitigar ataques de segunda preimagen.
const LEAF_PREFIX = '0x00';
const NODE_PREFIX = '0x01';

export interface ProofStep {
  /** Ubicacion del hash hermano (sibling) respecto al nodo actual. */
  position: 'left' | 'right';
  sibling: string;
}

/**
 * Canonicalizacion determinista: JSON con claves ordenadas alfabeticamente,
 * sin espacios, UTF-8. DEBE ser identica en backend y frontend.
 */
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

export function hashNode(left: string, right: string): string {
  return sha256(concat([NODE_PREFIX, getBytes(left), getBytes(right)]));
}

/** Construye todos los niveles del arbol. Nodo impar se duplica consigo mismo. */
export function buildTree(leaves: string[]): string[][] {
  if (leaves.length === 0) {
    throw new Error('No se puede construir un arbol de Merkle vacio');
  }
  const levels: string[][] = [leaves];
  let current = leaves;
  while (current.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < current.length; i += 2) {
      const left = current[i];
      const right = i + 1 < current.length ? current[i + 1] : current[i];
      next.push(hashNode(left, right));
    }
    levels.push(next);
    current = next;
  }
  return levels;
}

export function getRoot(levels: string[][]): string {
  return levels[levels.length - 1][0];
}

export function getProof(levels: string[][], leafIndex: number): ProofStep[] {
  const proof: ProofStep[] = [];
  let index = leafIndex;
  for (let level = 0; level < levels.length - 1; level++) {
    const nodes = levels[level];
    const isRight = index % 2 === 1;
    const siblingIndex = isRight ? index - 1 : index + 1;
    const sibling = siblingIndex < nodes.length ? nodes[siblingIndex] : nodes[index];
    proof.push({ position: isRight ? 'left' : 'right', sibling });
    index = Math.floor(index / 2);
  }
  return proof;
}

/** Verificacion sincrona (misma logica que ejecuta el frontend con ethers). */
export function verifyProof(leaf: string, proof: ProofStep[], root: string): boolean {
  let computed = leaf;
  for (const step of proof) {
    computed =
      step.position === 'left' ? hashNode(step.sibling, computed) : hashNode(computed, step.sibling);
  }
  return computed.toLowerCase() === root.toLowerCase();
}
