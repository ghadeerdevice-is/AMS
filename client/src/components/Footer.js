import { Link } from "react-router-dom";
import { MapPin, Plane } from "lucide-react";
import { SITE_NAME } from "./Shared.js";
const EXPLORE = [{
  to: '/',
  label: 'Home'
}, {
  to: '/flights',
  label: 'Flights'
}, {
  to: '/airport-map',
  label: 'Map'
}, {
  to: '/services',
  label: 'Services'
}];
const HELP = [{
  to: '/lost-and-found',
  label: 'Lost & found'
}, {
  to: '/passenger-guide',
  label: 'Passenger guide'
}];
const ACCOUNT = [{
  to: '/login',
  label: 'Log in'
}, {
  to: '/register',
  label: 'Sign up'
}];
function LinkColumn({
  title,
  links
}) {
  return <div>
      <h2 className="text-[12px] font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <ul className="mt-2 space-y-1.5">
        {links.map(l => <li key={l.to + l.label}>
            <Link to={l.to} className="inline-flex min-h-11 min-w-11 items-center text-[12.5px] text-secondary hover:text-primary hover:underline focus-ring sm:min-h-0 sm:min-w-0">
              {l.label}
            </Link>
          </li>)}
      </ul>
    </div>;
}
function Footer() {
  return <footer className="mt-8 border-t border-line bg-card pb-8 pt-8">
      <div className="page-gutter mx-auto w-full">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex min-h-11 w-fit items-center gap-2 rounded-lg focus-ring sm:min-h-0" aria-label="Smart Airport home">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Plane className="h-4 w-4 -rotate-[35deg] text-on-primary" aria-hidden />
              </span>
              <span className="text-[15px] font-bold tracking-tight text-ink">{SITE_NAME}</span>
            </Link>
            <p className="mt-3 max-w-sm text-[12.5px] leading-relaxed text-secondary">
              Your airport companion. Explore flights, navigate the terminal, and manage your journey in one place.
            </p>
            <div className="mt-3 flex flex-col gap-1.5 text-[12.5px] text-secondary">
              <Link to="/passenger-guide#official-airports" className="flex min-h-11 w-fit items-center gap-1.5 hover:text-primary focus-ring sm:min-h-0">
                <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden /> Airport contact directory
              </Link>
            </div>
          </div>

          <LinkColumn title="Explore" links={EXPLORE} />
          <LinkColumn title="Help" links={HELP} />
          <LinkColumn title="Account" links={ACCOUNT} />
        </div>
      </div>
    </footer>;
}
export { Footer };
export default Footer;