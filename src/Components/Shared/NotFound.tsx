import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="text-xl text-gray-600">Page not found</p>
        <Link to="/" className="btn btn-primary inline-flex items-center gap-2">
          <Home className="w-4 h-4" /> Go Home
        </Link>
      </div>
    </div>
  );
}
