import { NavLink } from 'react-router-dom';

const links = [
  { to: '/list',     label: 'Personas' },
  { to: '/skills',   label: 'Skills'   },
  { to: '/settings', label: 'Settings' },
];

export function NavBar() {
  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-48 shrink-0 bg-p5gray border-r border-p5border min-h-screen sticky top-0">
        <div className="p-4 border-b border-p5border">
          <div className="font-display font-bold text-p5red text-xl tracking-widest uppercase">P5R</div>
          <div className="font-display text-p5white text-sm tracking-wider uppercase">Fusion</div>
        </div>
        <div className="flex flex-col gap-1 p-2 mt-2">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `font-display font-bold tracking-widest uppercase px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-p5red text-white'
                    : 'text-gray-400 hover:text-p5white hover:bg-p5card'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
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
                isActive ? 'text-p5red border-t-2 border-p5red' : 'text-gray-500'
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
