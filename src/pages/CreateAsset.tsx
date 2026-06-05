import { useState } from 'react';
import ApiService from '@/services/api-service';
import { useDispatch } from 'react-redux';
import { showSnackbar } from '@/app/store';

export default function CreateAsset() {
  const api = ApiService.getInstance();
  const dispatch = useDispatch();

  const [assetId, setAssetId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [metadataUri, setMetadataUri] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId.trim() || !name.trim()) {
      dispatch(showSnackbar({ message: 'assetId and name are required', type: 'error' }));
      return;
    }
    const tagArr = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    setLoading(true);
    const res = await api.createAsset({ assetId: assetId.trim(), name: name.trim(), description: description || undefined, metadataUri: metadataUri || undefined, location: location || undefined, tags: tagArr });
    setLoading(false);
    if ((res as any).error) dispatch(showSnackbar({ message: (res as any).error.message || 'Create failed', type: 'error' }));
    else dispatch(showSnackbar({ message: 'Asset created', type: 'success' }));
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <div>
          <label className="label">Asset ID *</label>
          <input className="input" value={assetId} onChange={e=>setAssetId(e.target.value)} required />
        </div>
        <div>
          <label className="label">Name *</label>
          <input className="input" value={name} onChange={e=>setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" value={description} onChange={e=>setDescription(e.target.value)} />
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <label className="label">Metadata URI</label>
          <input className="input" value={metadataUri} onChange={e=>setMetadataUri(e.target.value)} />
        </div>
        <div>
          <label className="label">Location</label>
          <input className="input" value={location} onChange={e=>setLocation(e.target.value)} />
        </div>
        <div>
          <label className="label">Tags (comma-separated; normalized lowercased)</label>
          <input className="input" value={tags} onChange={e=>setTags(e.target.value)} placeholder="it, device" />
        </div>
        <div className="pt-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Create Asset'}</button>
        </div>
      </div>
    </form>
  );
}
