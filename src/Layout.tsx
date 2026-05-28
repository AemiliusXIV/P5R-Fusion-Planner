// Copyright (c) AemiliusXIV
// SPDX-License-Identifier: Apache-2.0
import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
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
        <Suspense fallback={
          <div className="p-8 font-display text-sm text-gray-500 tracking-widest uppercase">
            Loading…
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>
      {/* New navigations land at the top; back/forward restores prior scroll. */}
      <ScrollRestoration />
    </div>
  );
}
