import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ApiService from '@/services/api-service';
import type { Asset, AssetEvent, AssetStatus } from '@/types';
import Loading from '@/Components/Shared/Loading';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, showSnackbar } from '@/app/store';
import { ClipboardCopy, Tag, User, Shield, Save, PlusCircle, XCircle } from 'lucide-react';

function Badge({ type, children }:{type:string; children: any}) {
  const style = type==='danger' ? 'badge-danger' : type==='success' ? 'badge-success' : 'badge-muted';
  return <span className={`badge ${style}`}>{children}</span>;
}

export default function AssetDetail() {
  const { id } = useParams();
  const api = ApiService.getInstance();
  const dispatch = useDispatch();
  const myPub = useSelector((s: RootState)=> s.auth.pubKey?.toLowerCase() || '');
  const assumedRole = useSelector((s: RootState)=> s.auth.assumedRole);

  const [asset, setAsset] = useState<Asset | null>(null);
  const [history, setHistory] = useState<AssetEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const isOwner = asset && myPub && asset.owner === myPub;
  const isAdmin = assumedRole === 'ADMIN';

  const load = async () => {
    setLoading(true);
    const res = await api.getAsset(id!);
    if ((res as any).error) {
      setAsset(null); setLoading(false); return;
    }
    setAsset((res as any).success.asset);
    // Load history first page
    const hr = await api.getAssetHistory({ assetId: id!, limit: 20 });
    if ((hr as any).error) { setHistory([]); setCursor(null); }
    else { setHistory((hr as any).success.data); setCursor((hr as any).success.cursor); }
    setLoading(false);
  };

  const loadMoreHistory = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    const hr = await api.getAssetHistory({ assetId: id!, limit: 20, cursor });
    if ((hr as any).error) { /* ignore */ }
    else {
      setHistory(prev => [...prev, ...((hr as any).success.data as AssetEvent[])]);
      setCursor((hr as any).success.cursor);
    }
    setLoadingMore(false);
  };

  useEffect(() => { void load(); }, [id]);

  const canUpdate = !!(asset && (isOwner || isAdmin));

  async function handleCopy(text: string) {
    try { await navigator.clipboard.writeText(text); dispatch(showSnackbar({ message: 'Copied', type: 'success'})); } catch { /* ignore */ }
  }

  async function updateField(patch: Partial<Asset>) {
    if (!asset) return;
    const prev = { ...asset };
    const optimistic = { ...asset, ...patch, updatedAt: Date.now() };
    setAsset(optimistic);
    const res = await api.updateAsset({ assetId: asset.id, name: patch.name ?? asset.name, description: patch.description ?? asset.description ?? undefined, metadataUri: patch.metadataUri ?? asset.metadataUri ?? undefined, location: patch.location ?? asset.location ?? undefined });
    if ((res as any).error) { setAsset(prev); dispatch(showSnackbar({ message: (res as any).error.message || 'Update failed', type: 'error' })); }
    else dispatch(showSnackbar({ message: 'Updated', type: 'success' }));
  }

  async function addTag(tag: string) {
    if (!asset || !tag) return;
    const norm = tag.trim().toLowerCase();
    if (!norm) return;
    const prev = { ...asset };
    setAsset({ ...asset, tags: [...asset.tags, norm] });
    const res = await api.addTag({ assetId: asset.id, tag: norm });
    if ((res as any).error) { setAsset(prev); dispatch(showSnackbar({ message: (res as any).error.message || 'Add tag failed', type: 'error' })); }
    else dispatch(showSnackbar({ message: 'Tag added', type: 'success' }));
  }

  async function removeTag(tag: string) {
    if (!asset) return;
    const prev = { ...asset };
    setAsset({ ...asset, tags: asset.tags.filter(t => t !== tag) });
    const res = await api.removeTag({ assetId: asset.id, tag });
    if ((res as any).error) { setAsset(prev); dispatch(showSnackbar({ message: (res as any).error.message || 'Remove tag failed', type: 'error' })); }
    else dispatch(showSnackbar({ message: 'Tag removed', type: 'success' }));
  }

  async function changeStatus(newStatus: AssetStatus) {
    if (!asset) return;
    const prev = { ...asset };
    setAsset({ ...asset, status: newStatus, updatedAt: Date.now() });
    const res = await api.setStatus({ assetId: asset.id, newStatus });
    if ((res as any).error) { setAsset(prev); dispatch(showSnackbar({ message: (res as any).error.message || 'Status update failed', type: 'error' })); }
    else dispatch(showSnackbar({ message: 'Status updated', type: 'success' }));
  }

  async function transfer(to: string, note?: string) {
    if (!asset) return;
    const confirmed = window.confirm(`Transfer ownership to\
${to}\
Are you sure?`);
    if (!confirmed) return;
    const prev = { ...asset };
    setAsset({ ...asset, owner: to.toLowerCase(), updatedAt: Date.now() });
    const res = await api.transferAsset({ assetId: asset.id, newOwner: to, note });
    if ((res as any).error) { setAsset(prev); dispatch(showSnackbar({ message: (res as any).error.message || 'Transfer failed', type: 'error' })); }
    else dispatch(showSnackbar({ message: 'Transferred', type: 'success' }));
  }

  async function freeze(f: boolean) {
    if (!asset) return;
    const confirmed = window.confirm(`${f ? 'Freeze' : 'Unfreeze'} asset ${asset.id}?`);
    if (!confirmed) return;
    const prev = { ...asset };
    setAsset({ ...asset, status: f ? 'FROZEN' : 'ACTIVE', updatedAt: Date.now() });
    const res = f ? await api.freezeAsset({ assetId: asset.id }) : await api.unfreezeAsset({ assetId: asset.id });
    if ((res as any).error) { setAsset(prev); dispatch(showSnackbar({ message: (res as any).error.message || 'Operation failed', type: 'error' })); }
    else dispatch(showSnackbar({ message: f ? 'Asset frozen' : 'Asset unfrozen', type: 'success' }));
  }

  if (loading) return <Loading message="Loading asset..." />;
  if (!asset) return <p className="text-gray-500">Asset not found.</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{asset.name}</h2>
          <p className="text-gray-600">ID: <span className="font-mono text-xs">{asset.id}</span>
            <button className="ml-2 text-blue-600 hover:underline inline-flex items-center gap-1" onClick={()=>handleCopy(asset.id)}><ClipboardCopy className="w-4 h-4"/>Copy</button>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge type={asset.status==='FROZEN'?'danger':asset.status==='ACTIVE'?'success':'muted'}>{asset.status}</Badge>
          <span className="badge badge-muted inline-flex items-center gap-1"><User className="w-3 h-3"/>Owner: <span className="font-mono text-[10px] ml-1">{asset.owner.slice(0,10)}...{asset.owner.slice(-6)}</span></span>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" defaultValue={asset.name} disabled={!canUpdate} onBlur={(e)=> canUpdate && e.target.value !== asset.name ? updateField({ name: e.target.value }) : null }/>
            {!canUpdate && <p className="text-xs text-gray-500 mt-1">You are not the owner. Only owners or admins can update.</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" defaultValue={asset.description || ''} disabled={!canUpdate} onBlur={(e)=> canUpdate ? updateField({ description: e.target.value }) : null }/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Metadata URI</label>
              <input className="input" defaultValue={asset.metadataUri || ''} disabled={!canUpdate} onBlur={(e)=> canUpdate ? updateField({ metadataUri: e.target.value }) : null }/>
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" defaultValue={asset.location || ''} disabled={!canUpdate} onBlur={(e)=> canUpdate ? updateField({ location: e.target.value }) : null }/>
            </div>
          </div>
          <div>
            <label className="label">Tags</label>
            <div className="flex flex-wrap gap-2">
              {asset.tags.map(t => (
                <span key={t} className="badge badge-muted inline-flex items-center gap-2">
                  <Tag className="w-3 h-3"/>{t}
                  {canUpdate && <button aria-label="Remove tag" onClick={()=> void removeTag(t)} className="text-rose-600 hover:opacity-80"><XCircle className="w-3 h-3"/></button>}
                </span>
              ))}
            </div>
            {canUpdate && (
              <div className="mt-2 flex gap-2">
                <input className="input" placeholder="new tag" onKeyDown={(e)=>{ if(e.key==='Enter'){ const v=(e.target as HTMLInputElement).value; (e.target as HTMLInputElement).value=''; void addTag(v); } }} />
                <button className="btn btn-secondary inline-flex items-center gap-2" onClick={()=>{
                  const el = (document.activeElement as HTMLInputElement); if (el && el.value) { const v = el.value; el.value=''; void addTag(v); }
                }}><PlusCircle className="w-4 h-4"/>Add</button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-semibold mb-2">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {canUpdate && (
                <>
                  {(['ACTIVE','IN_TRANSIT','LOST','RETIRED','FROZEN'] as AssetStatus[]).map(s => (
                    <button key={s} className={`btn ${asset.status===s?'btn-primary':'btn-secondary'}`} onClick={()=> void changeStatus(s)} disabled={asset.status===s}>{s}</button>
                  ))}
                  <button className="btn btn-secondary" onClick={()=>{
                    const to = prompt('New owner pubkey (hex):'); if (to) void transfer(to);
                  }}>Transfer</button>
                </>
              )}
              {isAdmin && (
                <>
                  <button className="btn btn-danger inline-flex items-center gap-2" onClick={()=> void freeze(true)}><Shield className="w-4 h-4"/>Freeze</button>
                  <button className="btn btn-secondary inline-flex items-center gap-2" onClick={()=> void freeze(false)}><Shield className="w-4 h-4"/>Unfreeze</button>
                </>
              )}
              {!canUpdate && !isAdmin && (
                <p className="text-xs text-gray-500">Actions are disabled. You must be the owner or an admin.</p>
              )}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-2">Timestamps</h3>
            <p className="text-sm text-gray-600">Created: {new Date(asset.createdAt).toLocaleString()}</p>
            <p className="text-sm text-gray-600">Updated: {new Date(asset.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">History</h3>
        <div className="space-y-3">
          {history.map(ev => (
            <div key={ev.Id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div>
                <span className={`badge ${ev.Type==='STATUS_CHANGED'?'badge-warning':ev.Type==='CREATED'?'badge-success':'badge-muted'}`}>{ev.Type}</span>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-700">{new Date(ev.Timestamp).toLocaleString()} — <span className="font-mono text-[10px]">{ev.Actor.slice(0,10)}...{ev.Actor.slice(-6)}</span></div>
                {ev.DataJson && <pre className="text-xs text-gray-600 whitespace-pre-wrap mt-1">{ev.DataJson}</pre>}
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-gray-500">No history yet.</p>
          )}
        </div>
        {cursor && (
          <div className="mt-3 text-right"><button className="btn btn-secondary" onClick={()=> void loadMoreHistory()} disabled={loadingMore}>{loadingMore?'Loading...':'Load More'}</button></div>
        )}
      </div>
    </div>
  );
}
