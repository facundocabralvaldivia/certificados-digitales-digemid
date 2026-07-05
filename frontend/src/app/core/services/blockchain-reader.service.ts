import { Injectable } from '@angular/core';
import { JsonRpcProvider, Contract } from 'ethers';
import { environment } from '../../../environments/environment';

const ABI = ['function roots(bytes32) view returns (bytes32)'];
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

@Injectable({ providedIn: 'root' })
export class BlockchainReaderService {
  private provider = new JsonRpcProvider(environment.polygonRpcUrl, environment.polygonChainId);
  private contract = new Contract(environment.anchorContractAddress, ABI, this.provider);

  get contratoConfigurado(): boolean {
    return environment.anchorContractAddress.toLowerCase() !== ZERO_ADDRESS;
  }

  /** Lee el Merkle Root anclado on-chain para un batchId. */
  async leerRoot(batchId: string): Promise<string> {
    return (await this.contract['roots'](batchId)) as string;
  }
}
