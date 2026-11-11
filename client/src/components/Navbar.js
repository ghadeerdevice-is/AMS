import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown, LogOut, Menu, Moon, Plane, Sun } from "lucide-react";
import { cn, Dropdown, Drawer, transitionThemeFrom, useUserStore } from "./Shared.js";
const navigation = [['/', 'Home'], ['/flights', 'Flights'], ['/airport-map', 'Airport Map'], ['/services', 'Services'], ['/lost-and-found', 'Lost & Found'], ['/passenger-guide', 'Passenger guide']];
function Navbar() {
  const {
    theme,
    toggleTheme,
    user,
    logout
  } = useUserStore();
  const [open, setOpen] = useState(false);
  const {
    pathname
  } = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  const active = to => to === '/' ? pathname === '/' : pathname.startsWith(to);
  return <header className="sticky top-0 z-40 border-b border-line bg-header/95 backdrop-blur">
    <div className="page-gutter flex h-[52px] items-center gap-2 sm:gap-4">
      <Link to="/" aria-label="SkyAssist home" className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg focus-ring sm:justify-start">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm sm:h-8 sm:w-8"><Plane className="h-4 w-4 -rotate-[35deg] text-on-primary" /></span>
        <span className="hidden text-[15.5px] font-bold tracking-tight text-ink sm:inline">SkyAssist</span>
      </Link>
      <nav aria-label="Main navigation" className="ml-2 hidden h-full flex-1 items-center gap-0.5 lg:flex">
        {navigation.slice(0, 4).map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} className={cn('relative flex h-full items-center whitespace-nowrap px-2 text-[13px] font-medium transition-colors focus-ring xl:px-2.5', active(to) ? 'text-primary' : 'text-secondary hover:text-ink')}>{label}<span className={cn('absolute inset-x-2 bottom-0 h-0.5 rounded-full', active(to) ? 'bg-primary' : 'bg-transparent')} /></NavLink>)}
        <Dropdown ariaLabel="See more pages" width="w-56" trigger={<button className="flex h-11 items-center gap-1 px-2 text-[13px] font-medium text-secondary focus-ring">See more<ChevronDown className="h-3.5 w-3.5" /></button>}>
          {close => navigation.slice(4).map(([to, label]) => <Link role="menuitem" key={to} to={to} onClick={close} className="block rounded-lg px-3 py-2 text-[13px] text-secondary hover:bg-hover">{label}</Link>)}
        </Dropdown>
      </nav>
      <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
        <button onClick={e => transitionThemeFrom(e.currentTarget, toggleTheme)} aria-label="Toggle theme" className="flex h-11 w-11 items-center justify-center rounded-lg text-secondary hover:bg-hover focus-ring lg:h-9 lg:w-9">{theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</button>
        {user ? <button onClick={logout} className="flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-[12.5px] text-secondary focus-ring"><span className="hidden sm:inline">{user.fullName.split(' ')[0]}</span><LogOut className="h-4 w-4" /><span>Log out</span></button> : <div className="hidden items-center gap-2 sm:flex"><Link to="/login" className="flex h-9 items-center rounded-lg px-3 text-[12.5px] font-semibold text-secondary hover:bg-hover focus-ring">Log in</Link><Link to="/register" className="flex h-9 items-center rounded-lg bg-primary px-3 text-[12.5px] font-semibold text-on-primary hover:bg-primary-hover focus-ring">Sign up</Link></div>}
        <button onClick={() => setOpen(true)} aria-label="Open navigation" className="flex h-11 w-11 items-center justify-center rounded-lg text-secondary hover:bg-hover focus-ring lg:hidden"><Menu className="h-5 w-5" /></button>
      </div>
    </div>
    <Drawer open={open} onClose={() => setOpen(false)} title="Menu">
      <nav aria-label="Mobile navigation" className="space-y-1">{navigation.map(([to, label]) => <Link to={to} key={to} onClick={() => setOpen(false)} className={cn('block rounded-lg px-3 py-3 text-sm', active(to) ? 'bg-surface font-semibold text-primary' : 'text-secondary hover:bg-hover')}>{label}</Link>)}</nav>
      {!user && <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4"><Link to="/login" onClick={() => setOpen(false)} className="rounded-lg border border-line p-3 text-center text-sm font-semibold">Log in</Link><Link to="/register" onClick={() => setOpen(false)} className="rounded-lg bg-primary p-3 text-center text-sm font-semibold text-on-primary">Sign up</Link></div>}
    </Drawer>
  </header>;
}
export { Navbar };
export default Navbar;