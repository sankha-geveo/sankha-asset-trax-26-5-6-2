import { useEffect, useState } from 'react';
import ApiService from '@/services/api-service';
import Loading from '@/Components/Shared/Loading';
import type { Stats } from '@/types';
import { Boxes, Users, Activity } from 'lucide-react';

export default function Dashboard() {
  const api = ApiService.getInstance();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      const res = await api.getStats();
      if (!on) return;
      if ((res as any).error) setError((res as any).error.message || 'Failed to load stats');
      else setStats((res as any).success);
      setLoading(false);
    })();
    return () => { on = false; };
  }, [api]);

  if (loading) return <Loading message="Loading stats..." />;
  if (error) return <p className="text-rose-600">{error}</p>;
  if (!stats) return <p className="text-gray-500">No statistics available.</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Assets</p>
              <p className="text-3xl font-bold mt-2">{stats.totalAssets}</p>
            </div>
            <Boxes className="w-10 h-10 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Statuses Tracked</p>
              <p className="text-3xl font-bold mt-2">{Object.keys(stats.byStatus || {}).length}</p>
            </div>
            <Activity className="w-10 h-10 text-emerald-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Top Owners</p>
              <p className="text-3xl font-bold mt-2">{stats.topOwners.length}</p>
            </div>
            <Users className="w-10 h-10 text-purple-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-3">By Status</h3>
          <div className="space-y-2">
            {Object.entries(stats.byStatus || {}).map(([k,v]) => (
              <div key={k} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-medium">{k}</span>
                <span className="text-gray-700">{v}</span>
              </div>
            ))}
            {Object.keys(stats.byStatus || {}).length === 0 && (
              <p className="text-gray-500">No status data.</p>
            )}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-3">Top Owners</h3>
          <div className="space-y-2">
            {stats.topOwners.map((o) => (
              <div key={o.Owner} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-mono text-xs">{o.Owner.slice(0,10)}...{o.Owner.slice(-6)}</span>
                <span className="text-gray-700">{o.c}</span>
              </div>
            ))}
            {stats.topOwners.length === 0 && (
              <p className="text-gray-500">No owners yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
