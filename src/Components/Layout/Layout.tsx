import { Outlet, NavLink } from 'react-router-dom';
import { Boxes, Plus, Shield, Settings, Home } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header / Hero */}
      <header className="hero-grad">
        <div className="container-page py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Sankha's Assets</h1>
              <p className="text-blue-100">Evernode Asset Lifecycle Registry</p>
            </div>
            <nav className="hidden md:flex items-center gap-4">
              <NavLink to="/" className="text-white/90 hover:text-white inline-flex items-center gap-2"><Home className="w-4 h-4"/>Dashboard</NavLink>
              <NavLink to="/assets" className="text-white/90 hover:text-white inline-flex items-center gap-2"><Boxes className="w-4 h-4"/>Assets</NavLink>
              <NavLink to="/create" className="text-white/90 hover:text-white inline-flex items-center gap-2"><Plus className="w-4 h-4"/>Create</NavLink>
              <NavLink to="/admin" className="text-white/90 hover:text-white inline-flex items-center gap-2"><Shield className="w-4 h-4"/>Admin</NavLink>
              <NavLink to="/settings" className="text-white/90 hover:text-white inline-flex items-center gap-2"><Settings className="w-4 h-4"/>Settings</NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container-page -mt-10 w-full">
        <div className="card p-6 mb-10">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 text-center text-gray-600 text-sm mt-auto border-t border-gray-200">
        © {new Date().getFullYear()} Sankha's Assets. All rights reserved.
      </footer>
    </div>
  );
}
