/* HotPocket Contract Service (JSON protocol to match backend) */
import StorageService from './storage-service';

export type HPOutput = unknown;
export type HPMessage = { Service: string; Action: string; data?: unknown };

type HPClientLike = {
  connect: () => Promise<boolean>;
  submitContractReadRequest: (payload: string) => Promise<unknown>;
  submitContractInput: (payload: string) => Promise<{ submissionStatus: Promise<{ status: string; reason?: string }> }>;
  on: (event: string, handler: (result: { outputs: unknown[] }) => void) => void;
};
// Test comment 2
type OutputListener = (output: unknown) => void;

type Pending = { resolve: (v: unknown) => void; reject: (e: unknown) => void };

export default class ContractService {
  private static instance: ContractService;

  private HotPocket: any;
  private client: HPClientLike | null = null;
  private keyPair: any = null;
  private servers: string[] = [];
  private initialized = false;
  private mockMode = false;

  private pendingWrites: Pending[] = [];
  private listeners: Set<OutputListener> = new Set();

  // Mock store for development
  private mockAssets = new Map<string, any>();
  private mockEvents: any[] = [];

  private constructor() {}

  static getInstance(): ContractService {
    if (!ContractService.instance) ContractService.instance = new ContractService();
    return ContractService.instance;
  }

  isInitialized(): boolean { return this.initialized; }
  isMock(): boolean { return this.mockMode; }
  getPublicKeyHex(): string | null { return this.keyPair?.publicKey ? Buffer.from(this.keyPair.publicKey).toString('hex').toLowerCase() : null; }
  getServers(): string[] { return this.servers; }

  addOutputListener(listener: OutputListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async init(overrideServers?: string[]): Promise<void> {
    // Decide mock mode
    this.mockMode = (import.meta.env.VITE_MOCK_MODE === 'true');
    const envServers = (overrideServers && overrideServers.length > 0)
      ? overrideServers
      : (import.meta.env.VITE_CONTRACT_URLS || '').split(',').map(s => s.trim()).filter(Boolean);

    this.servers = envServers.length > 0 ? envServers : ['wss://localhost:8081'];

    if (this.mockMode) {
      console.warn('\uD83D\uDD28 Running in MOCK MODE - using simulated data.');
      this.initialized = true;
      this.seedMock();
      return;
    }

    const win: any = window as any;
    this.HotPocket = win.HotPocket;
    if (!this.HotPocket || !this.HotPocket.createClient || !this.HotPocket.generateKeys) {
      throw new Error('HotPocket library not found. Ensure CDN scripts are loaded in index.html.');
    }

    try {
      this.keyPair = await this.HotPocket.generateKeys();
      this.client = await this.HotPocket.createClient(this.servers, this.keyPair);

      // Attach events
      this.client.on(this.HotPocket.events.disconnect, () => {
        console.warn('Disconnected from HotPocket');
      });
      this.client.on(this.HotPocket.events.connectionChange, (info: unknown) => {
        console.log('Connection change:', info);
      });
      this.client.on(this.HotPocket.events.healthEvent, (he: unknown) => {
        console.log('Health event:', he);
      });
      this.client.on(this.HotPocket.events.contractOutput, (r: { outputs: unknown[] }) => {
        // Resolve pending writes in FIFO order; also fan-out to listeners
        for (const out of r.outputs) {
          const parsed = this.tryParse(out);
          // Notify listeners
          this.listeners.forEach(l => l(parsed));
          // Resolve or reject one pending write (if any)
          if (parsed && typeof parsed === 'object') {
            if ((parsed as any).error && this.pendingWrites.length > 0) {
              const p = this.pendingWrites.shift();
              p?.reject((parsed as any).error);
            } else if ((parsed as any).success !== undefined && this.pendingWrites.length > 0) {
              const p = this.pendingWrites.shift();
              p?.resolve(parsed);
            }
          }
        }
      });

      const ok = await this.client.connect();
      if (!ok) throw new Error('Connection failed');
      this.initialized = true;
      StorageService.set('sa_wallet_pub', this.getPublicKeyHex());
    } catch (err) {
      throw new Error(
        'Failed to initialize HotPocket client. Please check that VITE_CONTRACT_URLS is configured with valid server URLs in your .env file, or set VITE_MOCK_MODE=true for development.\
' + (err instanceof Error ? err.message : String(err))
      );
    }
  }

  async submitContractReadRequest(message: HPMessage): Promise<unknown> {
    if (this.mockMode) return this.mockRead(message);
    if (!this.client) throw new Error('Client not initialized');

    try {
      const buf = await this.client.submitContractReadRequest(JSON.stringify(message));
      return this.tryParse(buf);
    } catch (err) {
      throw new Error('Read request failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  async submitInputToContract(message: HPMessage): Promise<unknown> {
    if (this.mockMode) return this.mockWrite(message);
    if (!this.client) throw new Error('Client not initialized');

    const payload = JSON.stringify(message);
    const res = await this.client.submitContractInput(payload);
    const status = await res.submissionStatus;
    if (status.status !== 'accepted') {
      throw new Error('Ledger rejection: ' + (status.reason || 'Unknown reason'));
    }

    // Wait for the matching output (FIFO mapping)
    return new Promise((resolve, reject) => {
      this.pendingWrites.push({ resolve, reject });
    });
  }

  // Helpers
  private tryParse(o: unknown): any {
    if (typeof o === 'string') {
      try { return JSON.parse(o); } catch { return o; }
    }
    return o;
  }

  private normalizeTag(t: string): string { return (t || '').toString().trim().toLowerCase(); }

  private seedMock(): void {
    const now = Date.now();
    const owner = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const asset = {
      id: 'asset-001', name: 'Laptop', description: 'Dell XPS', metadataUri: '', location: 'Colombo',
      owner: owner, status: 'ACTIVE', createdAt: now - 3600_000, updatedAt: now - 1800_000, tags: ['it', 'device']
    };
    this.mockAssets.set(asset.id, asset);
    this.mockEvents.push({ Id: 'e1', AssetId: asset.id, Type: 'CREATED', Actor: owner, DataJson: JSON.stringify({ name: asset.name }), Timestamp: now - 3590_000 });
  }

  private async mockRead(message: HPMessage): Promise<unknown> {
    await new Promise(r => setTimeout(r, 120));
    const { Service, Action, data } = message as any;

    if (Service === 'Query' && Action === 'getStats') {
      const total = this.mockAssets.size;
      const byStatus: Record<string, number> = {};
      const topOwnersMap: Record<string, number> = {};
      for (const a of this.mockAssets.values()) {
        byStatus[a.status] = (byStatus[a.status] || 0) + 1;
        topOwnersMap[a.owner] = (topOwnersMap[a.owner] || 0) + 1;
      }
      const topOwners = Object.entries(topOwnersMap).map(([Owner, c]) => ({ Owner, c })).sort((a,b)=>b.c-a.c).slice(0,10);
      return { success: { totalAssets: total, byStatus, topOwners } };
    }

    if (Service === 'Query' && Action === 'getAsset') {
      const id = data?.assetId;
      const a = this.mockAssets.get(id);
      if (!a) return { error: { code: 404, message: 'not found' } };
      return { success: { asset: a } };
    }

    if (Service === 'Query' && Action === 'listAssets') {
      const owner = data?.owner?.toLowerCase?.() || null;
      const status = data?.status || null;
      const tag = data?.tag?.toLowerCase?.() || null;
      const search = (data?.search || '').toLowerCase();
      const limit = Math.max(1, Math.min(parseInt(data?.limit || 20), 100));

      let rows = Array.from(this.mockAssets.values());
      if (owner) rows = rows.filter(a => a.owner === owner);
      if (status) rows = rows.filter(a => a.status === status);
      if (tag) rows = rows.filter(a => a.tags.includes(tag));
      if (search) rows = rows.filter(a => (a.name + ' ' + (a.description || '') + ' ' + (a.location || '')).toLowerCase().includes(search));
      rows.sort((a,b)=> (b.createdAt - a.createdAt) || (a.id.localeCompare(b.id)));
      const dataOut = rows.slice(0, limit);
      const cursor = rows.length > limit ? Buffer.from(JSON.stringify({ k: dataOut[dataOut.length-1].createdAt, id: dataOut[dataOut.length-1].id })).toString('base64') : null;
      return { success: { data: dataOut, cursor } };
    }

    if (Service === 'Query' && Action === 'getAssetHistory') {
      const id = data?.assetId;
      const limit = Math.max(1, Math.min(parseInt(data?.limit || 20), 100));
      const cursorRaw = data?.cursor ? JSON.parse(Buffer.from(data.cursor, 'base64').toString('utf8')) : null;
      let evs = this.mockEvents.filter(e => e.AssetId === id).sort((a,b)=> (b.Timestamp - a.Timestamp) || (b.Id.localeCompare(a.Id)));
      if (cursorRaw) evs = evs.filter(e => (e.Timestamp < cursorRaw.ts) || (e.Timestamp === cursorRaw.ts && e.Id < cursorRaw.id));
      const chunk = evs.slice(0, limit);
      const cursor = evs.length > limit ? Buffer.from(JSON.stringify({ ts: chunk[chunk.length-1].Timestamp, id: chunk[chunk.length-1].Id })).toString('base64') : null;
      return { success: { data: chunk, cursor } };
    }

    return { error: { code: 400, message: 'Invalid mock read' } };
  }

  private async mockWrite(message: HPMessage): Promise<unknown> {
    await new Promise(r => setTimeout(r, 150));
    const ts = Date.now();
    const actor = 'mockpubkey00000000000000000000000000000000000000000000000000000000';
    const { Service, Action, data } = message as any;

    if (Service !== 'Asset' && Service !== 'Access') {
      return { error: { code: 400, message: 'Invalid mock write service' } };
    }

    if (Service === 'Asset') {
      if (Action === 'createAsset') {
        if (!data?.assetId || !data?.name) return { error: { code: 400, message: 'assetId and name required' } };
        if (this.mockAssets.has(data.assetId)) return { error: { code: 409, message: 'assetId already exists' } };
        const asset = {
          id: data.assetId,
          name: data.name,
          description: data.description || null,
          metadataUri: data.metadataUri || null,
          location: data.location || null,
          owner: actor,
          status: 'ACTIVE',
          createdAt: ts,
          updatedAt: ts,
          tags: Array.isArray(data.tags) ? data.tags.map((t:string)=>this.normalizeTag(t)).filter(Boolean) : []
        };
        this.mockAssets.set(asset.id, asset);
        const ev = { Id: 'ev_'+Math.random().toString(16).slice(2), AssetId: asset.id, Type: 'CREATED', Actor: actor, DataJson: JSON.stringify({ name: asset.name }), Timestamp: ts };
        this.mockEvents.push(ev);
        return { success: { assetId: asset.id }, events: [ev] };
      }
      if (Action === 'updateAsset') {
        const a = this.mockAssets.get(data?.assetId);
        if (!a) return { error: { code: 404, message: 'asset not found' } };
        if (data.name !== undefined) a.name = data.name;
        if (data.description !== undefined) a.description = data.description;
        if (data.metadataUri !== undefined) a.metadataUri = data.metadataUri;
        if (data.location !== undefined) a.location = data.location;
        a.updatedAt = ts;
        const ev = { Id: 'ev_'+Math.random().toString(16).slice(2), AssetId: a.id, Type: 'UPDATED', Actor: actor, DataJson: JSON.stringify({ patch: Object.keys(data) }), Timestamp: ts };
        this.mockEvents.push(ev);
        return { success: { updated: true }, events: [ev] };
      }
      if (Action === 'transferAsset') {
        const a = this.mockAssets.get(data?.assetId);
        if (!a) return { error: { code: 404, message: 'asset not found' } };
        a.owner = data.newOwner?.toLowerCase?.() || a.owner;
        a.updatedAt = ts;
        const ev = { Id: 'ev_'+Math.random().toString(16).slice(2), AssetId: a.id, Type: 'TRANSFERRED', Actor: actor, DataJson: JSON.stringify({ to: a.owner, note: data.note || null }), Timestamp: ts };
        this.mockEvents.push(ev);
        return { success: { transferred: true }, events: [ev] };
      }
      if (Action === 'setStatus') {
        const a = this.mockAssets.get(data?.assetId);
        if (!a) return { error: { code: 404, message: 'asset not found' } };
        a.status = data.newStatus;
        a.updatedAt = ts;
        const ev = { Id: 'ev_'+Math.random().toString(16).slice(2), AssetId: a.id, Type: 'STATUS_CHANGED', Actor: actor, DataJson: JSON.stringify({ status: data.newStatus }), Timestamp: ts };
        this.mockEvents.push(ev);
        return { success: { status: data.newStatus }, events: [ev] };
      }
      if (Action === 'addTag') {
        const a = this.mockAssets.get(data?.assetId);
        if (!a) return { error: { code: 404, message: 'asset not found' } };
        const tag = this.normalizeTag(data.tag);
        if (!a.tags.includes(tag)) a.tags.push(tag);
        a.updatedAt = ts;
        const ev = { Id: 'ev_'+Math.random().toString(16).slice(2), AssetId: a.id, Type: 'TAG_ADDED', Actor: actor, DataJson: JSON.stringify({ tag }), Timestamp: ts };
        this.mockEvents.push(ev);
        return { success: { tagAdded: true }, events: [ev] };
      }
      if (Action === 'removeTag') {
        const a = this.mockAssets.get(data?.assetId);
        if (!a) return { error: { code: 404, message: 'asset not found' } };
        const tag = this.normalizeTag(data.tag);
        a.tags = a.tags.filter((t:string)=>t!==tag);
        a.updatedAt = ts;
        const ev = { Id: 'ev_'+Math.random().toString(16).slice(2), AssetId: a.id, Type: 'TAG_REMOVED', Actor: actor, DataJson: JSON.stringify({ tag }), Timestamp: ts };
        this.mockEvents.push(ev);
        return { success: { tagRemoved: true }, events: [ev] };
      }
      if (Action === 'recordCustomEvent') {
        const a = this.mockAssets.get(data?.assetId);
        if (!a) return { error: { code: 404, message: 'asset not found' } };
        const ev = { Id: 'ev_'+Math.random().toString(16).slice(2), AssetId: a.id, Type: 'CUSTOM', Actor: actor, DataJson: JSON.stringify({ type: data.customType, data: data.dataJson || null }), Timestamp: ts };
        this.mockEvents.push(ev);
        return { success: { recorded: true }, events: [ev] };
      }
      if (Action === 'freezeAsset') {
        const a = this.mockAssets.get(data?.assetId);
        if (!a) return { error: { code: 404, message: 'asset not found' } };
        a.status = 'FROZEN'; a.updatedAt = ts;
        const ev1 = { Id: 'ev_'+Math.random().toString(16).slice(2), AssetId: a.id, Type: 'STATUS_CHANGED', Actor: actor, DataJson: JSON.stringify({ status: 'FROZEN' }), Timestamp: ts };
        const ev2 = { Id: 'ev_'+Math.random().toString(16).slice(2), AssetId: a.id, Type: 'ASSET_FROZEN', Actor: actor, DataJson: JSON.stringify({ frozen: true }), Timestamp: ts };
        this.mockEvents.push(ev1, ev2);
        return { success: { frozen: true }, events: [ev1, ev2] };
      }
      if (Action === 'unfreezeAsset') {
        const a = this.mockAssets.get(data?.assetId);
        if (!a) return { error: { code: 404, message: 'asset not found' } };
        a.status = 'ACTIVE'; a.updatedAt = ts;
        const ev1 = { Id: 'ev_'+Math.random().toString(16).slice(2), AssetId: a.id, Type: 'STATUS_CHANGED', Actor: actor, DataJson: JSON.stringify({ status: 'ACTIVE' }), Timestamp: ts };
        const ev2 = { Id: 'ev_'+Math.random().toString(16).slice(2), AssetId: a.id, Type: 'ASSET_UNFROZEN', Actor: actor, DataJson: JSON.stringify({ frozen: false }), Timestamp: ts };
        this.mockEvents.push(ev1, ev2);
        return { success: { frozen: false }, events: [ev1, ev2] };
      }
    }

    if (Service === 'Access') {
      if (Action === 'registerUser' || Action === 'grantRole') {
        return { success: { ok: true }, events: [{ type: 'RoleGranted', user: data?.userPubKey, role: data?.role }] };
      }
      if (Action === 'revokeRole') {
        return { success: { ok: true }, events: [{ type: 'RoleRevoked', user: data?.userPubKey }] };
      }
      if (Action === 'pauseContract') {
        return { success: { paused: true }, events: [{ type: 'ContractPaused' }] };
      }
      if (Action === 'unpauseContract') {
        return { success: { paused: false }, events: [{ type: 'ContractUnpaused' }] };
      }
    }

    return { error: { code: 400, message: 'Invalid mock write' } };
  }
}
