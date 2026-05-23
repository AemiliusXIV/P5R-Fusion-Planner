import { Outlet } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { useStore } from './store/useStore';

export function Layout() {
  const { colorMode, displaySize } = useStore();

  return (
    <div
      className={[
        'flex min-h-screen',
        colorMode === 'bw' ? 'bw-mode' : '',
        displaySize === 'comfortable' ? 'display-comfortable' : '',
        displaySize === 'compact' ? 'display-compact' : '',
      ].join(' ')}
    >
      <NavBar />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
