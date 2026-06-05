import { useState } from 'react';
import ApiService from '@/services/api-service';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, showSnackbar } from '@/app/store';

export default function AdminPanel() {
  const api = ApiService.getInstance();
  const dispatch = useDispatch();
  const assumedRole = useSelector((s: RootState)=> s.auth.assumedRole);

  const [grantPub, setGrantPub] = useState('');
  const [grantRole, setGrantRole] = useState<'ADMIN'|'USER'|'AUDITOR'>('USER');
  const [revokePub, setRevokePub] = useState('');
  const [freezeId, setFreezeId] = useState('');

  async function doGrant() {
    const res = await api.grantRole({ userPubKey: grantPub.trim().toLowerCase(), role: grantRole });
    if ((res as any).error) dispatch(showSnackbar({ message: (res as any).error.message || 'Grant failed', type: 'error' }));
    else dispatch(showSnackbar({ message: 'Role granted', type: 'success' }));
  }
  async function doRevoke() {
    const res = await api.revokeRole({ userPubKey: revokePub.trim().toLowerCase() });
    if ((res as any).error) dispatch(showSnackbar({ message: (res as any).error.message || 'Revoke failed', type: 'error' }));
    else dispatch(showSnackbar({ message: 'Role revoked', type: 'success' }));
  }
  async function pause(p: boolean) {
    const confirmed = window.confirm(`${p ? 'Pause' : 'Unpause'} the contract?`);
    if (!confirmed) return;
    const res = p ? await api.pauseContract() : await api.unpauseContract();
    if ((res as any).error) dispatch(showSnackbar({ message: (res as any).error.message || 'Operation failed', type: 'error' }));
    else dispatch(showSnackbar({ message: p ? 'Contract paused' : 'Contract unpaused', type: 'success' }));
  }
  async function freeze(f: boolean) {
    if (!freezeId.trim()) return;
    const res = f ? await api.freezeAsset({ assetId: freezeId.trim() }) : await api.unfreezeAsset({ assetId: freezeId.trim() });
    if ((res as any).error) dispatch(showSnackbar({ message: (res as any).error.message || 'Operation failed', type: 'error' }));
    else dispatch(showSnackbar({ message: f ? 'Asset frozen' : 'Asset unfrozen', type: 'success' }));
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg border border-amber-300 bg-amber-50">
        <p className="text-amber-700 text-sm">Admin-only actions require your current key to have ADMIN role on-chain. Since the backend exposes no read method for roles, the UI shows all admin buttons; actions will fail with 403 if unauthorized.</p>
        <p className="text-amber-700 text-sm mt-1">Tip: Use Settings → Admin Mode toggle for UI gating convenience.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4 space-y-3">
          <h3 className="font-semibold">Grant Role</h3>
          <input className="input" placeholder="User pubkey (hex)" value={grantPub} onChange={e=>setGrantPub(e.target.value)} />
          <select className="input" value={grantRole} onChange={e=>setGrantRole(e.target.value as any)}>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="AUDITOR">AUDITOR</option>
          </select>
          <button className="btn btn-primary" onClick={()=>void doGrant()}>Grant</button>
        </div>
        <div className="card p-4 space-y-3">
          <h3 className="font-semibold">Revoke Role</h3>
          <input className="input" placeholder="User pubkey (hex)" value={revokePub} onChange={e=>setRevokePub(e.target.value)} />
          <button className="btn btn-danger" onClick={()=>void doRevoke()}>Revoke</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4 space-y-3">
          <h3 className="font-semibold">Contract Control</h3>
          <div className="flex gap-2">
            <button className="btn btn-danger" onClick={()=>void pause(true)}>Pause</button>
            <button className="btn btn-secondary" onClick={()=>void pause(false)}>Unpause</button>
          </div>
        </div>
        <div className="card p-4 space-y-3">
          <h3 className="font-semibold">Freeze / Unfreeze Asset</h3>
          <input className="input" placeholder="Asset ID" value={freezeId} onChange={e=>setFreezeId(e.target.value)} />
          <div className="flex gap-2">
            <button className="btn btn-danger" onClick={()=>void freeze(true)}>Freeze</button>
            <button className="btn btn-secondary" onClick={()=>void freeze(false)}>Unfreeze</button>
          </div>
        </div>
      </div>
    </div>
  );
}
