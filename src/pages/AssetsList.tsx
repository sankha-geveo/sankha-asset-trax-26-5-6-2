import { useCallback, useEffect, useMemo, useState } from 'react';
import ApiService from '@/services/api-service';
import { useCursorPagination } from '@/hooks/usePagination';
import type { Asset, AssetStatus } from '@/types';
import { Search, Filter, ArrowUpDown, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AssetsList() {
  const api = ApiService.getInstance();
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState<AssetStatus | ''>('');
  const [tag, setTag] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt'|'updatedAt'|'name'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const limit = 20;

  const fetcher = useCallback(async (cursor: string | null) => {
    const res = await api.listAssets({ owner: owner || undefined, status: (status || undefined) as any, tag: tag || undefined, search: search || undefined, cursor, limit, sortBy, sortDir });
    if ((res as any).error) throw new Error((res as any).error.message || 'Failed to list assets');
    const { data, cursor: next } = (res as any).success;
    return { items: data as Asset[], nextCursor: next };
  }, [api, owner, status, tag, search, sortBy, sortDir]);

  const { items, hasMore, loading, loadMore, reset } = useCursorPagination<Asset>(fetcher);

  // Trigger reload on filters change
  useEffect(() => { void (async () => { await reset(); await loadMore(); })(); }, [owner, status, tag, search, sortBy, sortDir]);

  const toggleSort = (k: typeof sortBy) => {
    if (sortBy === k) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(k); setSortDir('desc'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search name/description/location" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Filter by tag" value={tag} onChange={e=>setTag(e.target.value.toLowerCase())} />
        </div>
        <input className="input" placeholder="Filter by owner (pubkey hex)" value={owner} onChange={e=>setOwner(e.target.value.toLowerCase())} />
        <select className="input" value={status} onChange={e=>setStatus(e.target.value as any)}>
          <option value="">All Statuses</option>
          {['ACTIVE','IN_TRANSIT','LOST','RETIRED','FROZEN'].map(s=> <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={()=>{ setOwner(''); setStatus(''); setTag(''); setSearch(''); }}>Clear</button>
      </div>

      <div className="overflow-auto border border-gray-200 rounded-xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                <button onClick={()=>toggleSort('name')} className="inline-flex items-center gap-1">
                  Name <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Owner</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                <button onClick={()=>toggleSort('updatedAt')} className="inline-flex items-center gap-1">Updated <ArrowUpDown className="w-3 h-3" /></button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{a.id}</td>
                <td className="px-4 py-3">{a.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{a.owner.slice(0,10)}...{a.owner.slice(-6)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{new Date(a.updatedAt).toLocaleString()}</td>
                <td className="px-4 py-3"><span className={`badge ${a.status==='ACTIVE'?'badge-success':a.status==='FROZEN'?'badge-danger':'badge-muted'}`}>{a.status}</span></td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/assets/${encodeURIComponent(a.id)}`} className="btn btn-primary text-sm">View</Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No assets found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button className="btn btn-secondary inline-flex items-center gap-2" onClick={()=>{ void (async()=>{ await reset(); await loadMore(); })(); }}>
          <RefreshCcw className="w-4 h-4"/> Refresh
        </button>
        <button className="btn btn-primary" disabled={!hasMore || loading} onClick={()=> void loadMore()}>
          {loading ? 'Loading...' : hasMore ? 'Load More' : 'No More'}
        </button>
      </div>
    </div>
  );
}
