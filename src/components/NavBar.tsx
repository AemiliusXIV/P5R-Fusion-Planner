// Copyright (c) AemiliusXIV
// SPDX-License-Identifier: Apache-2.0
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/list',     label: 'Personas'  },
  { to: '/skills',   label: 'Skills'    },
  { to: '/strength', label: 'Strength'  },
  { to: '/settings', label: 'Settings'  },
];

export function NavBar() {
  return (
    <>
      {/* Desktop sidebar, fixed viewport height so credit always shows at bottom */}
      <nav className="hidden md:flex flex-col w-48 shrink-0 bg-p5gray border-r border-p5border sticky top-0 h-screen overflow-hidden">
        {/* Title block: diagonal-clipped P5-style branding */}
        <div className="p-4 border-b border-p5border shrink-0">
          <div className="flex items-end gap-2">
            <div>
              <div className="font-display font-bold text-p5red text-2xl tracking-widest uppercase leading-none">P5R</div>
              <div className="font-display text-gray-400 text-[10px] tracking-widest uppercase mt-0.5">Fusion Planner</div>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-0.5 p-2 mt-2 overflow-y-auto flex-1">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `font-display font-bold tracking-widest uppercase pr-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'bg-p5red/10 text-p5red border-l-4 border-p5red pl-3'
                    : 'text-gray-400 hover:text-p5white hover:bg-p5card border-l-4 border-transparent pl-3'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Credit, always visible at bottom of sidebar */}
        <div className="p-4 border-t border-p5border shrink-0">
          <a
            href="https://github.com/AemiliusXIV/P5R-Fusion-Planner"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-gray-600 hover:text-p5red font-display tracking-wider transition-colors block"
          >
            by AemiliusXIV ↗
          </a>
          <p className="text-[10px] text-gray-700 font-display mt-0.5">
            Data: chinhodado
          </p>
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-p5gray border-t border-p5border flex z-50">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex-1 py-3 font-display font-bold tracking-widest uppercase text-xs text-center transition-colors ${
                isActive ? 'text-p5red border-t-4 border-p5red' : 'text-gray-400 border-t-4 border-transparent'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
