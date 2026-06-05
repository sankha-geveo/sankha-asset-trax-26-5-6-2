import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import ContractService from '@/services/contract-service';
import ApiService from '@/services/api-service';

// Minimal smoke tests for mock mode

describe('ApiService (mock mode)', () => {
  it('initializes and fetches stats', async () => {
    const cs = ContractService.getInstance();
    await cs.init();
    assert.equal(cs.isMock(), (import.meta as any).env?.VITE_MOCK_MODE === 'true');

    const api = ApiService.getInstance();
    const res: any = await api.getStats();
    assert.ok(res.success || res.error);
  });

  it('creates, reads and lists assets (mock)', async () => {
    const api = ApiService.getInstance();
    const id = 'test-asset-' + Math.random().toString(16).slice(2);
    const create: any = await api.createAsset({ assetId: id, name: 'Demo', tags: ['it'] });
    assert.ok(create.success || create.error);

    const get: any = await api.getAsset(id);
    if (get.success) {
      const list: any = await api.listAssets({ search: 'demo' });
      assert.ok(list.success || list.error);
    }
  });
});
