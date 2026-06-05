import { Routes, Route } from 'react-router-dom';
import Layout from '@/Components/Layout/Layout';
import Dashboard from '@/pages/Dashboard';
import AssetsList from '@/pages/AssetsList';
import AssetDetail from '@/pages/AssetDetail';
import CreateAsset from '@/pages/CreateAsset';
import AdminPanel from '@/pages/AdminPanel';
import Settings from '@/pages/Settings';
import NotFound from '@/Components/Shared/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}> 
        <Route index element={<Dashboard />} />
        <Route path="assets" element={<AssetsList />} />
        <Route path="assets/:id" element={<AssetDetail />} />
        <Route path="create" element={<CreateAsset />} />
        <Route path="admin" element={<AdminPanel />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
