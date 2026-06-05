export type AssetStatus = 'ACTIVE' | 'IN_TRANSIT' | 'LOST' | 'RETIRED' | 'FROZEN';
export type Role = 'ADMIN' | 'USER' | 'AUDITOR';

export interface Asset {
  id: string;
  name: string;
  description?: string | null;
  metadataUri?: string | null;
  location?: string | null;
  owner: string; // lowercase pubkey hex
  status: AssetStatus;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}
// Test comment 1
export interface AssetEvent {
  Id: string;
  AssetId: string;
  Type: string;
  Actor: string;
  DataJson?: string | null;
  Timestamp: number;
}

export interface Stats {
  totalAssets: number;
  byStatus: Record<string, number>;
  topOwners: { Owner: string; c: number }[];
}

export interface ListAssetsResponse { data: Asset[]; cursor: string | null }
export interface HistoryResponse { data: AssetEvent[]; cursor: string | null }

export interface ServiceSuccess<T> { success: T; events?: unknown[] }
export interface ServiceError { error: { code?: number; message?: string } }
export type ServiceResponse<T> = ServiceSuccess<T> | ServiceError;
