import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, clearSnackbar } from '@/app/store';
import { X } from 'lucide-react';

export default function Snackbar() {
  const dispatch = useDispatch();
  const sb = useSelector((s: RootState) => s.snackbar);

  useEffect(() => {
    if (sb) {
      const t = setTimeout(() => dispatch(clearSnackbar()), 3500);
      return () => clearTimeout(t);
    }
  }, [sb, dispatch]);

  if (!sb) return null;
  const bg = sb.type === 'success' ? 'bg-emerald-600' : sb.type === 'error' ? 'bg-rose-600' : 'bg-gray-800';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className={`text-white rounded-lg shadow-xl px-4 py-3 flex items-center gap-3 ${bg}`} role="status" aria-live="polite">
        <span>{sb.message}</span>
        <button aria-label="Dismiss" className="ml-2 hover:opacity-80" onClick={() => dispatch(clearSnackbar())}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
