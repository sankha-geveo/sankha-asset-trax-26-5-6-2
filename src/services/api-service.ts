import ContractService from './contract-service';
import type { Asset, AssetEvent, AssetStatus, HistoryResponse, ListAssetsResponse, Stats, ServiceResponse } from '@/types';

export class ApiService {
  private static instance: ApiService;
  private contract: ContractService;

  private constructor() { this.contract = ContractService.getInstance(); }

  static getInstance(): ApiService { if (!ApiService.instance) ApiService.instance = new ApiService(); return ApiService.instance; }

  // Query service (READ)
  async getAsset(assetId: string): Promise<ServiceResponse<{ asset: Asset }>> {
    return this.contract.submitContractReadRequest({ Service: 'Query', Action: 'getAsset', data: { assetId } }) as Promise<any>;
  }

  async listAssets(params: { owner?: string; status?: AssetStatus; tag?: string; search?: string; cursor?: string | null; limit?: number; sortBy?: 'createdAt'|'updatedAt'|'name'; sortDir?: 'asc'|'desc' }): Promise<ServiceResponse<ListAssetsResponse>> {
    return this.contract.submitContractReadRequest({ Service: 'Query', Action: 'listAssets', data: params }) as Promise<any>;
  }

  async getAssetHistory(params: { assetId: string; cursor?: string | null; limit?: number }): Promise<ServiceResponse<HistoryResponse>> {
    return this.contract.submitContractReadRequest({ Service: 'Query', Action: 'getAssetHistory', data: params }) as Promise<any>;
  }

  async getStats(): Promise<ServiceResponse<Stats>> {
    return this.contract.submitContractReadRequest({ Service: 'Query', Action: 'getStats' }) as Promise<any>;
  }

  // Asset service (WRITE)
  async createAsset(data: { assetId: string; name: string; description?: string; metadataUri?: string; location?: string; tags?: string[] }): Promise<ServiceResponse<{ assetId: string }>> {
    return this.contract.submitInputToContract({ Service: 'Asset', Action: 'createAsset', data }) as Promise<any>;
  }

  async updateAsset(data: { assetId: string; name?: string; description?: string; metadataUri?: string; location?: string }): Promise<ServiceResponse<{ updated: boolean }>> {
    return this.contract.submitInputToContract({ Service: 'Asset', Action: 'updateAsset', data }) as Promise<any>;
  }

  async transferAsset(data: { assetId: string; newOwner: string; note?: string }): Promise<ServiceResponse<{ transferred: boolean }>> {
    return this.contract.submitInputToContract({ Service: 'Asset', Action: 'transferAsset', data }) as Promise<any>;
  }

  async setStatus(data: { assetId: string; newStatus: AssetStatus }): Promise<ServiceResponse<{ status: AssetStatus }>> {
    return this.contract.submitInputToContract({ Service: 'Asset', Action: 'setStatus', data }) as Promise<any>;
  }

  async addTag(data: { assetId: string; tag: string }): Promise<ServiceResponse<{ tagAdded: boolean }>> {
    return this.contract.submitInputToContract({ Service: 'Asset', Action: 'addTag', data }) as Promise<any>;
  }

  async removeTag(data: { assetId: string; tag: string }): Promise<ServiceResponse<{ tagRemoved: boolean }>> {
    return this.contract.submitInputToContract({ Service: 'Asset', Action: 'removeTag', data }) as Promise<any>;
  }

  async recordCustomEvent(data: { assetId: string; customType: string; dataJson?: string }): Promise<ServiceResponse<{ recorded: boolean }>> {
    return this.contract.submitInputToContract({ Service: 'Asset', Action: 'recordCustomEvent', data }) as Promise<any>;
  }

  async freezeAsset(data: { assetId: string }): Promise<ServiceResponse<{ frozen: boolean }>> {
    return this.contract.submitInputToContract({ Service: 'Asset', Action: 'freezeAsset', data }) as Promise<any>;
  }

  async unfreezeAsset(data: { assetId: string }): Promise<ServiceResponse<{ frozen: boolean }>> {
    return this.contract.submitInputToContract({ Service: 'Asset', Action: 'unfreezeAsset', data }) as Promise<any>;
  }

  // Access service (WRITE, admin only)
  async registerUser(data: { userPubKey: string; role: 'ADMIN'|'USER'|'AUDITOR' }): Promise<ServiceResponse<{ ok: boolean }>> {
    return this.contract.submitInputToContract({ Service: 'Access', Action: 'registerUser', data }) as Promise<any>;
  }

  async grantRole(data: { userPubKey: string; role: 'ADMIN'|'USER'|'AUDITOR' }): Promise<ServiceResponse<{ ok: boolean }>> {
    return this.contract.submitInputToContract({ Service: 'Access', Action: 'grantRole', data }) as Promise<any>;
  }

  async revokeRole(data: { userPubKey: string }): Promise<ServiceResponse<{ ok: boolean }>> {
    return this.contract.submitInputToContract({ Service: 'Access', Action: 'revokeRole', data }) as Promise<any>;
  }

  async pauseContract(): Promise<ServiceResponse<{ paused: boolean }>> {
    return this.contract.submitInputToContract({ Service: 'Access', Action: 'pauseContract' }) as Promise<any>;
  }

  async unpauseContract(): Promise<ServiceResponse<{ paused: boolean }>> {
    return this.contract.submitInputToContract({ Service: 'Access', Action: 'unpauseContract' }) as Promise<any>;
  }
}

export default ApiService;
