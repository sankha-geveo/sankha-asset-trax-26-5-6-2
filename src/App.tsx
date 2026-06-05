import { useEffect, useState } from 'react';
import ContractService from '@/services/contract-service';
import AppRoutes from '@/routes/routes';
import Snackbar from '@/Components/Shared/Snackbar';
import Loading from '@/Components/Shared/Loading';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        if (!ContractService.getInstance().isInitialized()) {
          await ContractService.getInstance().init();
        }
        if (on) setReady(true);
      } catch (e:any) {
        setError(e?.message || 'Initialization failed');
      }
    })();
    return () => { on = false; };
  }, []);

  if (error) return <div className="container-page py-16"><div className="card p-6"><p className="text-rose-600">{error}</p></div></div>;
  if (!ready) return <div className="container-page py-16"><div className="card p-6"><Loading message="Connecting to HotPocket..." /></div></div>;

  return (
    <>
      <AppRoutes />
      <Snackbar />
    </>
  );
}
