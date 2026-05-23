import { Outlet } from 'react-router-dom';
import { NavBar } from './components/NavBar';

export function Layout() {
  return (
    <div className="flex min-h-screen">
      <NavBar />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
