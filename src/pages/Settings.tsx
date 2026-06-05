import { useEffect, useState } from 'react';
import ContractService from '@/services/contract-service';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, setAssumedRole, setConnection, showSnackbar } from '@/app/store';

export default function Settings() {
  const cs = ContractService.getInstance();
  const dispatch = useDispatch();
  const { connected, pubKey, assumedRole } = useSelector((s: RootState)=> s.auth);
  const [servers, setServers] = useState<string>((import.meta.env.VITE_CONTRACT_URLS || 'wss://localhost:8081'));
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // Attempt to update connection state if already initialized
    const pk = cs.getPublicKeyHex();
    if (cs.isInitialized() && pk) dispatch(setConnection({ connected: true, pubKey: pk }));
  }, []);

  const connect = async () => {
    setConnecting(true);
    try {
      await cs.init(servers.split(',').map(s=>s.trim()).filter(Boolean));
      const pk = cs.getPublicKeyHex();
      dispatch(setConnection({ connected: true, pubKey: pk }));
      dispatch(showSnackbar({ message: 'Connected', type: 'success' }));
    } catch (e:any) {
      dispatch(showSnackbar({ message: e?.message || 'Failed to connect', type: 'error' }));
    } finally { setConnecting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold">Network</h3>
        <input className="input" value={servers} onChange={e=>setServers(e.target.value)} placeholder="wss://localhost:8081" />
        <button className="btn btn-primary" onClick={()=> void connect()} disabled={connecting}>{connecting?'Connecting...':'Connect'}</button>
        <div className="text-sm text-gray-600">Status: {connected ? 'Connected' : 'Disconnected'} {pubKey ? `(pubkey: ${pubKey.slice(0,10)}...${pubKey.slice(-6)})` : ''}</div>
        {cs.isMock() && <div className="text-amber-700 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2">Mock mode enabled</div>}
      </div>

      <div className="card p-4 space-y-3">
        <h3 className="font-semibold">Admin Mode (UI gating)</h3>
        <p className="text-sm text-gray-600">Backend does not provide a read endpoint to fetch your role. Use this toggle to enable admin-only UI buttons; unauthorized actions will still fail with an error.</p>
        <div className="flex items-center gap-3">
          <select className="input max-w-xs" value={assumedRole || ''} onChange={e=> dispatch(setAssumedRole((e.target.value || null) as any))}>
            <option value="">None</option>
            <option value="ADMIN">ADMIN</option>
            <option value="USER">USER</option>
            <option value="AUDITOR">AUDITOR</option>
          </select>
          <div className="text-sm text-gray-600">Current: {assumedRole || 'None'}</div>
        </div>
      </div>
    </div>
  );
}
