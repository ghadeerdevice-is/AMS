import { useEffect, useRef, useState, cloneElement, isValidElement, useId, forwardRef, useCallback } from "react";
import { MapPin, Baby, ChevronDown, Minus, Plus, Users, ArrowLeftRight, Loader2, Luggage, Map as MapImport, Plane, Search, SearchCheck, Armchair, Bus, Car, CreditCard, Heart, HeartPulse, Info, MoonStar, PlugZap, RefreshCw, ShoppingBag, SquareParking, Utensils, Wifi, Accessibility, CalendarClock, X, ArrowDown, Check as CheckImport, Copy, TriangleAlert, ArrowLeft, Eye, EyeOff, Inbox, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast, Toaster as SonnerToaster } from "sonner";
import { createPortal } from "react-dom";
import { flights, DEFAULT_DATE, DEFAULT_RETURN_DATE } from "./FlightsData.js";
const airlines = [{
  code: 'MEA',
  name: 'Middle East Airlines',
  logoColor: '#8a1538'
}, {
  code: 'EK',
  name: 'Emirates',
  logoColor: '#D71921'
}, {
  code: 'QR',
  name: 'Qatar Airways',
  logoColor: '#5C0632'
}, {
  code: 'TK',
  name: 'Turkish Airlines',
  logoColor: '#E81932'
}, {
  code: 'LH',
  name: 'Lufthansa',
  logoColor: '#8a1538'
}, {
  code: 'BA',
  name: 'British Airways',
  logoColor: '#8a1538'
}, {
  code: 'AF',
  name: 'Air France',
  logoColor: '#8a1538'
}, {
  code: 'KL',
  name: 'KLM',
  logoColor: '#8a1538'
}, {
  code: 'MS',
  name: 'EgyptAir',
  logoColor: '#8a1538'
}, {
  code: 'RJ',
  name: 'Royal Jordanian',
  logoColor: '#B21F24'
}, {
  code: 'SV',
  name: 'Saudia',
  logoColor: '#00693E'
}];
function airlineByCode(code) {
  return airlines.find(a => a.code === code) ?? {
    code,
    name: code,
    logoColor: '#704753'
  };
}
const airports = [{
  code: 'BEY',
  name: 'Beirut Rafic Hariri International Airport',
  city: 'Beirut',
  country: 'Lebanon'
}, {
  code: 'DXB',
  name: 'Dubai International Airport',
  city: 'Dubai',
  country: 'United Arab Emirates'
}, {
  code: 'DOH',
  name: 'Hamad International Airport',
  city: 'Doha',
  country: 'Qatar'
}, {
  code: 'IST',
  name: 'Istanbul Airport',
  city: 'Istanbul',
  country: 'Türkiye'
}, {
  code: 'FRA',
  name: 'Frankfurt Airport',
  city: 'Frankfurt',
  country: 'Germany'
}, {
  code: 'LHR',
  name: 'London Heathrow Airport',
  city: 'London',
  country: 'United Kingdom'
}, {
  code: 'CDG',
  name: 'Paris Charles de Gaulle Airport',
  city: 'Paris',
  country: 'France'
}, {
  code: 'JFK',
  name: 'John F. Kennedy International Airport',
  city: 'New York',
  country: 'United States'
}, {
  code: 'AMS',
  name: 'Amsterdam Schiphol Airport',
  city: 'Amsterdam',
  country: 'Netherlands'
}, {
  code: 'CAI',
  name: 'Cairo International Airport',
  city: 'Cairo',
  country: 'Egypt'
}, {
  code: 'RUH',
  name: 'King Khalid International Airport',
  city: 'Riyadh',
  country: 'Saudi Arabia'
}, {
  code: 'AMM',
  name: 'Queen Alia International Airport',
  city: 'Amman',
  country: 'Jordan'
}, {
  code: 'LCA',
  name: 'Larnaca International Airport',
  city: 'Larnaca',
  country: 'Cyprus'
}, {
  code: 'MAD',
  name: 'Adolfo Suárez Madrid–Barajas Airport',
  city: 'Madrid',
  country: 'Spain'
}, {
  code: 'YYZ',
  name: 'Toronto Pearson International Airport',
  city: 'Toronto',
  country: 'Canada'
}];
function airportByCode(code) {
  return airports.find(a => a.code === code);
}
function airportLabel(code) {
  const a = airportByCode(code);
  return a ? `${a.city} (${a.code})` : code;
}
function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}
function formatDuration(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
function parseTime(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minutesToTime(min) {
  const norm = (min % 1440 + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function formatMoney(n) {
  return `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
}
function uid(prefix = 'id') {
  return `${prefix}_${crypto.randomUUID()}`;
}
function bookingReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (const byte of crypto.getRandomValues(new Uint8Array(6))) out += chars[byte % chars.length];
  return out;
}
/** Calendar dates must not roll over (for example February 31 → March). */
function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function timeOfDayLabel(t) {
  const h = Number(t.split(':')[0]);
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  if (h < 21) return 'Evening';
  return 'Night';
}
function contrastText(hex) {
  const rgb = hex.replace('#', '').match(/.{2}/g)?.slice(0, 3).map(v => parseInt(v, 16) / 255);
  if (!rgb || rgb.length !== 3) return '#ffffff';
  const linear = rgb.map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  return luminance > 0.179 ? '#211e20' : '#ffffff';
}
/**
 * Airport combobox with keyboard + mouse selection showing
 * code, name, city and country.
 */
function AirportAutocomplete({
  value,
  onSelect,
  label,
  placeholder = 'City or airport',
  invalid,
  id
}) {
  const initial = airports.find(a => a.code === value);
  const [query, setQuery] = useState(initial ? `${initial.code} ${initial.city} (${initial.code})` : '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  useEffect(() => {
    const a = airports.find(x => x.code === value);
    setQuery(a ? `${a.code} ${a.city} (${a.code})` : '');
  }, [value]);
  useEffect(() => {
    const onDoc = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const q = query.trim().toLowerCase().replace(/\s*\(.*\)$/, '');
  const matches = (q ? airports.filter(a => a.code.toLowerCase().includes(q) || a.city.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.country.toLowerCase().includes(q)) : airports).slice(0, 7);
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({
      block: 'nearest'
    });
  }, [active]);
  const choose = code => {
    onSelect(code);
    const a = airports.find(x => x.code === code);
    setQuery(`${a.code} ${a.city} (${a.code})`);
    setOpen(false);
  };
  return <div ref={wrapRef} className="relative">
      <label htmlFor={id} className="mb-1 block text-[11px] font-medium text-muted">
        {label}
      </label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary" />
        <input id={id} role="combobox" aria-expanded={open} aria-controls={`${id}-list`} aria-autocomplete="list" autoComplete="off" value={query} placeholder={placeholder} onChange={e => {
        setQuery(e.target.value);
        setOpen(true);
        setActive(0);
      }} onFocus={() => setOpen(true)} onKeyDown={e => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setOpen(true);
          setActive(i => Math.min(i + 1, matches.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActive(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && open && matches[active]) {
          e.preventDefault();
          choose(matches[active].code);
        } else if (e.key === 'Escape') {
          setOpen(false);
        }
      }} className={cn('h-11 w-full rounded-lg border bg-input-bg pl-8 pr-2 text-[13px] font-medium text-ink sm:h-9', 'placeholder:font-normal placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none', invalid && 'border-danger')} />
      </div>
      {open && <ul id={`${id}-list`} ref={listRef} role="listbox" className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line bg-card p-1 shadow-pop">
          {matches.length === 0 && <li className="px-3 py-2 text-[12.5px] text-muted">No airports match “{query}”.</li>}
          {matches.map((a, i) => <li key={a.code} data-idx={i} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onMouseDown={e => {
        e.preventDefault();
        choose(a.code);
      }} className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2', i === active ? 'bg-surface' : '')}>
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold text-primary">
                {a.code}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-medium text-ink">{a.city}</span>
                <span className="block truncate text-[11px] text-muted">{a.name}</span>
              </span>
              <span className="shrink-0 text-[10.5px] text-muted">{a.country}</span>
            </li>)}
        </ul>}
    </div>;
}
function sortFlights(list, sort) {
  const out = [...list];
  switch (sort) {
    case 'price':
      return out.sort((a, b) => a.price - b.price);
    case 'duration':
      return out.sort((a, b) => a.durationMin - b.durationMin);
    case 'depEarliest':
      return out.sort((a, b) => parseTime(a.departTime) - parseTime(b.departTime));
    case 'arrEarliest':
      return out.sort((a, b) => {
        const aa = parseTime(a.arriveTime) + (a.arriveTime < a.departTime ? 1440 : 0);
        const bb = parseTime(b.arriveTime) + (b.arriveTime < b.departTime ? 1440 : 0);
        return aa - bb;
      });
    case 'stops':
      return out.sort((a, b) => a.stops - b.stops || a.price - b.price);
    case 'best':
    default:
      // The dataset is authored so that index order = curated “best match”.
      return out;
  }
}
/** Async so it can later be swapped for a real API request. */
async function searchFlights(params) {
  return flights.filter(f => f.origin === params.origin && f.destination === params.destination && f.date === params.departDate && f.cabinClasses.includes(params.cabinClass));
}
async function getFlightById(id) {
  return flights.find(f => f.id === id);
}
/**
 * Click-outside dropdown. `children` may be a render function receiving a
 * `close` callback so menu items can dismiss the menu.
 */
function Dropdown({
  trigger,
  children,
  align = 'start',
  width = 'w-56',
  ariaLabel,
  triggerClassName,
  menuRole = 'menu'
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const menuId = useId();
  const focusTrigger = () => ref.current?.querySelector('[aria-haspopup]')?.focus();
  const close = () => {
    setOpen(false);
    focusTrigger();
  };
  useEffect(() => {
    if (!open) return;
    const onDoc = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const buttonTrigger = isValidElement(trigger) && trigger.type === 'button';
  const triggerProps = {
    'aria-label': ariaLabel,
    'aria-haspopup': menuRole,
    'aria-expanded': open,
    'aria-controls': open ? menuId : undefined,
    onClick: () => setOpen(v => !v),
    onKeyDown: e => {
      if (!buttonTrigger && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === 'ArrowDown' && menuRole === 'menu') {
        e.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => ref.current?.querySelector('[role="menuitem"]')?.focus());
      }
    }
  };
  return <div ref={ref} className="relative" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
      {buttonTrigger ? cloneElement(trigger, triggerProps) : <div {...triggerProps} role="button" tabIndex={0} className={cn('focus-ring cursor-pointer', triggerClassName)}>{trigger}</div>}
      {open && <div id={menuId} role={menuRole} aria-label={menuRole === 'dialog' ? ariaLabel : undefined} className={cn('absolute z-40 mt-1.5 rounded-xl border border-line bg-card p-1 shadow-pop', width, align === 'end' ? 'right-0' : 'left-0')} onClick={close} onKeyDown={event => {
      if (menuRole !== 'menu' || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      const items = [...event.currentTarget.querySelectorAll('[role="menuitem"]')];
      if (!items.length) return;
      event.preventDefault();
      const index = items.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next].focus();
    }}>
          {typeof children === 'function' ? children(close) : children}
        </div>}
    </div>;
}
function MenuItem({
  children,
  onClick,
  active,
  icon
}) {
  return <button role="menuitem" onClick={onClick} className={cn(
  // 44px touch target on phones; the menu keeps its compact look on desktop.
  'flex min-h-11 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors sm:min-h-0', active ? 'bg-surface text-primary font-medium' : 'text-secondary hover:bg-hover hover:text-ink')}>
      {icon}
      <span className="flex-1 truncate">{children}</span>
    </button>;
}
function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange
}) {
  return <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
          {label === 'Infants' ? <Baby className="h-3.5 w-3.5 text-primary" /> : null}
          {label}
        </div>
        <div className="text-[11px] text-muted">{hint}</div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`Remove ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-secondary hover:border-primary hover:text-primary disabled:opacity-40 focus-ring sm:h-8 sm:w-8">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-4 text-center text-[13px] font-semibold tabular-nums">{value}</span>
        <button type="button" aria-label={`Add ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-secondary hover:border-primary hover:text-primary disabled:opacity-40 focus-ring sm:h-8 sm:w-8">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>;
}
function PassengerSelector({
  value,
  onChange,
  error
}) {
  const total = value.adults + value.children + value.infants;
  const set = patch => {
    const next = {
      ...value,
      ...patch
    };
    if (next.adults < 1) next.adults = 1;
    if (next.children < 0) next.children = 0;
    if (next.infants < 0) next.infants = 0;
    if (next.infants > next.adults) next.infants = next.adults;
    if (next.adults + next.children + next.infants > 9) return;
    onChange(next);
  };
  // The accessible name repeats the visible text (WCAG 2.5.3 — label in name).
  const summaryLabel = `${total} Passenger${total > 1 ? 's' : ''}`;
  return <Dropdown menuRole="dialog" width="w-64" ariaLabel={`Passengers: ${summaryLabel}`} trigger={<div className={cn('flex h-11 w-full items-center justify-between rounded-lg border bg-input-bg px-2.5 text-left sm:h-9', error && 'border-danger')}>
          <span className="flex items-center gap-1.5 truncate text-[13px] font-medium text-ink">
            <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
            {summaryLabel}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" />
        </div>} triggerClassName="w-full block">
      {close => <div onClick={e => e.stopPropagation()} className="p-2">
          <Stepper label="Adults" hint="12+ years" value={value.adults} min={1} max={9} onChange={n => set({
        adults: n
      })} />
          <Stepper label="Children" hint="2–11 years" value={value.children} min={0} max={8} onChange={n => set({
        children: n
      })} />
          <Stepper label="Infants" hint="Under 2 years" value={value.infants} min={0} max={value.adults} onChange={n => set({
        infants: n
      })} />
          <button type="button" onClick={close} className="mt-2 h-8 w-full rounded-lg bg-primary text-[12.5px] font-medium text-on-primary hover:bg-primary-hover focus-ring">
            Done
          </button>
        </div>}
    </Dropdown>;
}
/** Mock lost-and-found reports. */
const mockReports = [{
  id: 'rep-1',
  kind: 'lost',
  itemName: 'Black Lenovo laptop sleeve',
  category: 'Electronics',
  description: 'Slim black neoprene sleeve with a USB-C charger inside.',
  location: 'Departures, Security Checkpoint',
  date: '2026-05-18',
  time: '14:30',
  contact: 'traveler@example.com',
  status: 'Under Review',
  createdAt: '2026-05-18T15:10:00.000Z'
}, {
  id: 'rep-2',
  kind: 'found',
  itemName: 'Navy blue passport holder',
  category: 'Documents',
  description: 'Found between rows of seats near gate A2.',
  location: 'Departures, Gate A2',
  date: '2026-05-19',
  time: '09:05',
  storage: 'Left at the Information Desk',
  status: 'Potential Match',
  createdAt: '2026-05-19T09:40:00.000Z'
}, {
  id: 'rep-3',
  kind: 'lost',
  itemName: 'Silver watch with brown leather strap',
  category: 'Personal Accessories',
  description: 'Vintage style watch, scratched glass.',
  location: 'Arrivals, Baggage Claim',
  date: '2026-05-15',
  time: '18:20',
  contact: '+961 70 000 000',
  status: 'Resolved',
  createdAt: '2026-05-15T19:00:00.000Z'
}, {
  id: 'rep-4',
  kind: 'found',
  itemName: 'Kids backpack (red, dinosaur print)',
  category: 'Bags and Luggage',
  description: 'Small rolling backpack with stickers on the front pocket.',
  location: 'Arrivals, taxi rank',
  date: '2026-05-20',
  time: '11:15',
  storage: 'Lost & Found desk, Arrivals level 0',
  status: 'Submitted',
  createdAt: '2026-05-20T12:00:00.000Z'
}, {
  id: 'rep-5',
  kind: 'lost',
  itemName: 'Prescription sunglasses',
  category: 'Personal Accessories',
  description: 'Tortoiseshell frame in a grey hard case.',
  location: 'Departures, Lounge',
  date: '2026-05-21',
  time: '07:45',
  contact: 'traveler@example.com',
  status: 'Closed',
  createdAt: '2026-05-21T08:30:00.000Z'
}, {
  id: 'rep-6',
  kind: 'found',
  itemName: 'Brown leather wallet',
  category: 'Personal Accessories',
  description: 'Contains cards with no cash; identifiers removed for privacy.',
  location: 'Food Court, Departures',
  date: '2026-05-22',
  time: '16:00',
  storage: 'Information Desk',
  status: 'Under Review',
  createdAt: '2026-05-22T16:30:00.000Z'
}];
const reportCategories = ['Electronics', 'Bags and Luggage', 'Clothing', 'Documents', 'Jewelry', 'Personal Accessories', 'Other'];
const reportStatuses = ['Submitted', 'Under Review', 'Potential Match', 'Resolved', 'Closed'];
const mockNotifications = [{
  id: 'n1',
  title: 'MEA 265 is on time',
  body: 'Departure 08:30 from Beirut (BEY) — Gate A12.',
  time: '10:30 AM',
  read: false,
  kind: 'flight'
}, {
  id: 'n2',
  title: 'Check-in opens soon',
  body: 'Online check-in for your booking opens 24 hours before departure.',
  time: '09:15 AM',
  read: false,
  kind: 'info'
}, {
  id: 'n3',
  title: '10% off lounge access',
  body: 'Show this notification at the lounge desk.',
  time: 'Yesterday',
  read: true,
  kind: 'offer'
}];
const userSchema = z.object({
  sub: z.string().min(1),
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  city: z.string().optional(),
  preferences: z.string().optional(),
  createdAt: z.string()
});
const passengerSchemaschemas = z.object({
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().max(50).optional(),
  dateOfBirth: z.string().optional()
});
const countsSchema = z.object({
  adults: z.number().int().min(1),
  children: z.number().int().min(0),
  infants: z.number().int().min(0)
}).refine(p => p.infants <= p.adults && p.adults + p.children + p.infants <= 9, 'Choose 1–9 passengers, with at most one infant per adult.');
const cabinSchema = z.enum(['Economy', 'Premium Economy', 'Business', 'First Class']);
const bookingSchema = z.object({
  id: z.string(),
  reference: z.string(),
  flightId: z.string(),
  passengers: z.array(passengerSchemaschemas).min(1),
  cabinClass: cabinSchema,
  passengerCounts: countsSchema,
  total: z.number().finite().nonnegative(),
  createdAt: z.string(),
  status: z.enum(['Confirmed', 'Cancelled']),
  ownerSub: z.string().optional()
});
const reportSchema = z.object({
  id: z.string(),
  kind: z.enum(['lost', 'found']),
  itemName: z.string().trim().min(3).max(80),
  category: z.enum(reportCategories),
  description: z.string().trim().min(10).max(600),
  location: z.string().trim().min(3).max(80),
  date: z.string().refine(isDate),
  time: z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  contact: z.string().max(120).optional(),
  storage: z.string().max(120).optional(),
  imageUrl: z.string().optional(),
  status: z.enum(reportStatuses),
  ownerSub: z.string().optional(),
  createdAt: z.string()
});
function validRecords(value, schema) {
  return value.flatMap(record => {
    const parsed = schema.safeParse(record);
    return parsed.success ? [parsed.data] : [];
  });
}
function mergePreferences(persisted, current, schema) {
  if (!persisted || typeof persisted !== 'object') return current;
  const result = {
    ...current
  };
  for (const [key, field] of Object.entries(schema.shape)) {
    const value = persisted[key];
    if (value === undefined) continue;
    const parsed = field.safeParse(value);
    if (parsed.success) Object.assign(result, {
      [key]: parsed.data
    });
  }
  return result;
}
/** Preferences must remain usable when browser storage is disabled or corrupt. */
const persistStorage = createJSONStorage(() => ({
  getItem(name) {
    try {
      const raw = localStorage.getItem(name);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed.state === 'object' && parsed.state !== null ? raw : null;
    } catch {
      return null;
    }
  },
  setItem(name, value) {
    try {
      localStorage.setItem(name, value);
    } catch {/* preferences still work in memory */}
  },
  removeItem(name) {
    try {
      localStorage.removeItem(name);
    } catch {/* storage unavailable */}
  }
}));
const date = z.string().refine(isDate);
const preferencessearchStore = z.object({
  tripType: z.enum(['round', 'oneway', 'multi']),
  departDate: date,
  returnDate: date,
  passengers: countsSchema,
  cabinClass: cabinSchema
});
const useSearchStore = create()(persist(set => ({
  tripType: 'round',
  origin: '',
  destination: '',
  departDate: DEFAULT_DATE,
  returnDate: DEFAULT_RETURN_DATE,
  passengers: {
    adults: 1,
    children: 0,
    infants: 0
  },
  cabinClass: 'Economy',
  segments: [{
    origin: '',
    destination: '',
    date: DEFAULT_DATE
  }],
  setTripType: tripType => set({
    tripType
  }),
  setField: patch => set(patch),
  swap: () => set(s => ({
    origin: s.destination,
    destination: s.origin,
    segments: s.segments?.map((seg, i) => i === 0 ? {
      ...seg,
      origin: s.destination,
      destination: s.origin
    } : seg)
  })),
  setPassengers: passengers => set({
    passengers
  }),
  addSegment: () => set(s => (s.segments?.length ?? 0) >= 6 ? s : {
    segments: [...(s.segments ?? []), {
      origin: s.segments?.at(-1)?.destination ?? s.destination,
      destination: '',
      date: s.segments?.at(-1)?.date ?? s.departDate
    }]
  }),
  updateSegment: (i, patch) => set(s => ({
    segments: s.segments?.map((seg, idx) => idx === i ? {
      ...seg,
      ...patch
    } : seg)
  })),
  removeSegment: i => set(s => ({
    segments: s.segments?.filter((_seg, idx) => idx !== i)
  }))
}), {
  name: 'sa-search',
  storage: persistStorage,
  // Airport choices belong to the current search, not future page loads.
  merge: (saved, current) => mergePreferences(saved, current, preferencessearchStore),
  partialize: ({
    tripType,
    departDate,
    returnDate,
    passengers,
    cabinClass
  }) => ({
    tripType,
    departDate,
    returnDate,
    passengers,
    cabinClass
  })
}));
const CABINS = ['Economy', 'Premium Economy', 'Business', 'First Class'];
const validAirport = value => airports.some(a => a.code === value);
function searchFromQuery(params, current) {
  const result = {
    ...current
  };
  const from = params.get('from');
  const to = params.get('to');
  const depart = params.get('depart');
  const ret = params.get('return');
  const cabin = params.get('cabin');
  const trip = params.get('trip');
  if (validAirport(from)) result.origin = from;
  if (validAirport(to)) result.destination = to;
  if (isDate(depart)) result.departDate = depart;
  if (isDate(ret)) result.returnDate = ret;
  if (CABINS.includes(cabin)) result.cabinClass = cabin;
  if (trip === 'round' || trip === 'oneway' || trip === 'multi') result.tripType = trip;
  const adults = Number(params.get('adults') ?? params.get('pax'));
  const children = Number(params.get('children') ?? 0);
  const infants = Number(params.get('infants') ?? 0);
  if ([adults, children, infants].every(Number.isInteger) && adults >= 1 && children >= 0 && infants >= 0 && infants <= adults && adults + children + infants <= 9) {
    result.passengers = {
      adults,
      children,
      infants
    };
  }
  return result;
}
function searchToQuery(search) {
  const first = search.tripType === 'multi' ? search.segments?.[0] : undefined;
  return new URLSearchParams({
    from: first?.origin ?? search.origin,
    to: first?.destination ?? search.destination,
    depart: first?.date ?? search.departDate,
    return: search.returnDate,
    trip: search.tripType,
    cabin: search.cabinClass,
    adults: String(search.passengers.adults),
    children: String(search.passengers.children),
    infants: String(search.passengers.infants)
  }).toString();
}
/**
 * Lightweight UTM (campaign) tracking for a frontend-only app.
 *
 * There is no analytics backend, so the goal is to *preserve* attribution
 * instead of reporting it: any `utm_*` parameters on the landing URL are
 * captured once, kept for the session (and mirrored into localStorage so they
 * survive a hard reload), then re-applied to the in-app navigations that
 * represent a "conversion" (running a flight search, opening a report).
 */
const STORAGE_KEY = 'sa:utm';
const PARAM_PATTERN = /^utm_(source|medium|campaign|term|content|id)$/i;
let cache = null;
function readStorage() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function writeStorage(params) {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(params);
    window.sessionStorage.setItem(STORAGE_KEY, raw);
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    /* storage disabled (private mode) — attribution just does not persist */
  }
}
/**
 * Reads `utm_*` params from the current URL once and stores them. Existing
 * values are kept when the visitor arrives again without campaign parameters,
 * which preserves first-touch attribution for the session.
 */
function captureUtmParams(search = typeof window === 'undefined' ? '' : window.location.search) {
  const fresh = {};
  const params = new URLSearchParams(search);
  params.forEach((value, key) => {
    if (PARAM_PATTERN.test(key) && value) fresh[key.toLowerCase()] = value;
  });
  const stored = readStorage();
  const merged = {
    ...stored,
    ...fresh
  };
  cache = merged;
  if (Object.keys(merged).length > 0) writeStorage(merged);
  return merged;
}
function getUtmParams() {
  if (cache) return cache;
  cache = readStorage();
  return cache;
}
/** Appends the stored campaign parameters to an internal path. */
function withUtm(to) {
  const params = getUtmParams();
  if (Object.keys(params).length === 0) return to;
  const [path, hash = ''] = to.split('#');
  const [pathname, query = ''] = path.split('?');
  const search = new URLSearchParams(query);
  for (const [key, value] of Object.entries(params)) {
    if (!search.has(key)) search.set(key, value);
  }
  const qs = search.toString();
  return `${pathname}${qs ? `?${qs}` : ''}${hash ? `#${hash}` : ''}`;
}
/** Human-readable one-liner used by the footer's tracking note. */
function describeUtm(params = getUtmParams()) {
  const entries = Object.entries(params);
  if (entries.length === 0) return 'Direct visit';
  return entries.map(([key, value]) => `${key.replace(/^utm_/, '')}=${value}`).join(' · ');
}
const TABS = [{
  id: 'flights',
  label: 'Flights',
  to: '/flights',
  icon: Plane
}, {
  id: 'map',
  label: 'Airport Map',
  to: '/airport-map',
  icon: MapImport
}, {
  id: 'services',
  label: 'Services',
  to: '/services',
  icon: Search
}, {
  id: 'lost',
  label: 'Lost & Found',
  to: '/lost-and-found',
  icon: Luggage
}];
const TRIPS = [{
  id: 'round',
  label: 'Round Trip'
}, {
  id: 'oneway',
  label: 'One Way'
}, {
  id: 'multi',
  label: 'Multi-city'
}];
function SearchCard({
  activeTab = 'flights',
  onSearch
}) {
  const navigate = useNavigate();
  const search = useSearchStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const today = localDate();
  const validate = () => {
    const errs = {};
    if (search.tripType !== 'multi') {
      if (!search.origin) errs.origin = 'Choose a departure airport.';
      if (!search.destination) errs.destination = 'Choose an arrival airport.';
      if (search.origin && search.origin === search.destination) errs.origin = 'Origin and destination must differ.';
      if (!isDate(search.departDate)) errs.departDate = 'Pick a departure date.';else if (search.departDate < today) errs.departDate = 'Departure cannot be in the past.';
    }
    if (search.tripType === 'round') {
      if (!isDate(search.returnDate)) errs.returnDate = 'Pick a return date.';else if (search.returnDate < search.departDate) errs.returnDate = 'Return cannot be before departure.';
    }
    if (search.tripType === 'multi') {
      if (!search.segments?.length) errs.origin = 'Add a flight segment.';
      search.segments?.forEach((seg, i) => {
        if (seg.origin === seg.destination) errs[`seg${i}`] = 'Origin and destination must differ.';
        if (!seg.origin || !seg.destination) errs[`seg${i}`] = 'Choose both airports.';
        if (!isDate(seg.date) || seg.date < today) errs[`seg${i}`] = 'Pick a valid future departure date.';
        if (i > 0 && seg.date < search.segments[i - 1].date) errs[`seg${i}`] = 'Segments must be in date order.';
      });
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };
  const onSubmit = async e => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted search fields.');
      return;
    }
    setLoading(true);
    try {
      // Carry any campaign parameters from the landing URL into the results
      // page, so the search keeps its campaign attribution.
      navigate(withUtm(`/flights?${searchToQuery(search)}`));
      onSearch?.();
    } catch {
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const fieldBox = 'rounded-lg border bg-input-bg px-2.5 h-[52px] flex flex-col justify-center';
  return <form onSubmit={onSubmit} className="card rounded-2xl p-4 shadow-pop sm:p-5 lg:p-8" aria-label="Flight search">
      {/* Tabs */}
      <div className="tab-scroll no-scrollbar flex items-center gap-0.5 overflow-x-auto border-b border-line pb-1 sm:gap-1">
        {TABS.map(tab => {
        const active = tab.id === activeTab;
        const Icon = tab.icon;
        return <button key={tab.id} type="button" onClick={() => tab.id !== 'flights' && navigate(tab.to)} className={cn('relative flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-t-lg px-2.5 text-[13px] font-medium transition-colors focus-ring sm:min-h-0 sm:px-3 sm:py-2', active ? 'text-primary' : 'text-secondary hover:text-ink')}>
              <Icon className="h-4 w-4" />
              {tab.label}
              <span className={cn('absolute inset-x-1 bottom-0 h-0.5 rounded-full', active ? 'bg-primary' : 'bg-transparent')} />
            </button>;
      })}
      </div>

      {/* Trip type */}
      <div className="flex flex-wrap items-center gap-4 py-3">
        {TRIPS.map(trip => {
        const active = search.tripType === trip.id;
        return <button key={trip.id} type="button" onClick={() => search.setTripType(trip.id)} aria-pressed={active} className={cn('flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium transition-colors focus-ring sm:min-h-0 sm:py-1.5', active ? 'bg-primary text-on-primary shadow-sm' : 'border border-line text-secondary hover:border-primary hover:text-primary')}>
              <span className={cn('h-2.5 w-2.5 rounded-full border-2', active ? 'border-on-primary bg-on-primary' : 'border-muted')} />
              {trip.label}
            </button>;
      })}
      </div>

      {/* Fields */}
      {search.tripType === 'multi' ? <div className="space-y-2">
          {search.segments?.map((seg, i) => <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <AirportAutocomplete id={`seg-origin-${i}`} label={`Segment ${i + 1} — From`} value={seg.origin} onSelect={code => search.updateSegment(i, {
          origin: code
        })} invalid={!!errors[`seg${i}`]} />
              <AirportAutocomplete id={`seg-dest-${i}`} label="To" value={seg.destination} onSelect={code => search.updateSegment(i, {
          destination: code
        })} invalid={!!errors[`seg${i}`]} />
              <div>
                <label htmlFor={`seg-date-${i}`} className="mb-1 block text-[11px] font-medium text-muted">
                  Date
                </label>
                <input id={`seg-date-${i}`} type="date" min={today} value={seg.date} onChange={e => search.updateSegment(i, {
            date: e.target.value
          })} className="h-11 w-full rounded-lg border bg-input-bg px-2.5 text-[13px] text-ink focus:border-primary focus:outline-none sm:h-9" />
              </div>
              <div className="flex items-end">
                <button type="button" onClick={() => search.removeSegment(i)} disabled={(search.segments?.length ?? 0) <= 1} className="h-11 rounded-lg border border-line px-3 text-[12.5px] text-danger hover:border-danger disabled:opacity-40 focus-ring sm:h-9">
                  Remove
                </button>
              </div>
              {errors[`seg${i}`] && <p className="text-[11.5px] text-danger sm:col-span-4">{errors[`seg${i}`]}</p>}
            </div>)}
          <div className="flex items-center justify-between">
            <button type="button" onClick={search.addSegment} className="text-[12.5px] font-medium text-primary hover:underline focus-ring">
              + Add another segment
            </button>
            <span className="text-[11px] text-muted">Multi-city search covers the first segment.</span>
          </div>
        </div> : <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1.15fr_auto_1.15fr_0.9fr_0.9fr_1.1fr_1fr] lg:items-start">
          <div>
            <AirportAutocomplete id="search-origin" label="From" value={search.origin} onSelect={code => search.setField({
          origin: code
        })} invalid={!!errors.origin} />
            {errors.origin && <p className="mt-1 text-[11px] text-danger">{errors.origin}</p>}
          </div>

          <div className="flex justify-center lg:pt-[22px]">
            <button type="button" onClick={search.swap} aria-label="Swap airports" className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card text-primary shadow-sm transition-transform hover:rotate-180 hover:border-primary focus-ring sm:h-9 sm:w-9">
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>

          <div>
            <AirportAutocomplete id="search-destination" label="To" value={search.destination} onSelect={code => search.setField({
          destination: code
        })} invalid={!!errors.destination} />
            {errors.destination && <p className="mt-1 text-[11px] text-danger">{errors.destination}</p>}
          </div>

          <div className={cn(fieldBox, 'border')}>
            <label htmlFor="search-depart" className="text-[11px] font-medium text-muted">
              Depart
            </label>
            <input id="search-depart" type="date" min={today} value={search.departDate} onChange={e => search.setField({
          departDate: e.target.value
        })} className={cn('w-full bg-transparent text-[13px] font-medium text-ink outline-none', errors.departDate && 'text-danger')} />
          </div>

          {search.tripType === 'round' && <div className={cn(fieldBox, 'border')}>
              <label htmlFor="search-return" className="text-[11px] font-medium text-muted">
                Return
              </label>
              <input id="search-return" type="date" min={search.departDate} value={search.returnDate} onChange={e => search.setField({
          returnDate: e.target.value
        })} className={cn('w-full bg-transparent text-[13px] font-medium text-ink outline-none', errors.returnDate && 'text-danger')} />
            </div>}

          <div>
            <span className="mb-1 block text-[11px] font-medium text-muted">Passengers</span>
            <PassengerSelector value={search.passengers} onChange={search.setPassengers} error={errors.passengers} />
          </div>

          <div className={cn(fieldBox, 'relative border')}>
            <label htmlFor="search-cabin" className="text-[11px] font-medium text-muted">
              Cabin
            </label>
            <select id="search-cabin" value={search.cabinClass} onChange={e => search.setField({
          cabinClass: e.target.value
        })} className="w-full appearance-none bg-transparent pr-4 text-[13px] font-medium text-ink outline-none">
              {CABINS.map(c => <option key={c} value={c}>
                  {c}
                </option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute bottom-2.5 right-2 h-3.5 w-3.5 text-muted" />
          </div>

          {(errors.origin || errors.departDate || errors.returnDate) && <p className="text-[11.5px] text-danger lg:col-span-7">
              {[errors.origin, errors.departDate, errors.returnDate].filter(Boolean).join(' ')}
            </p>}
        </div>}

      <button type="submit" disabled={loading} className="mt-3.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[14px] font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-hover focus-ring disabled:opacity-70">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        {loading ? 'Searching…' : 'Search Flights'}
      </button>

      
    </form>;
}
/**
 * Centralized browser persistence. Everything the app persists goes through
 * this module, so it can later be replaced by real API calls.
 */
const PREFIX = 'smart-airport:';
function load(key, fallback, validate) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    const value = JSON.parse(raw);
    if (validate) return validate(value) ? value : fallback;
    if (Array.isArray(fallback)) return Array.isArray(value) ? value : fallback;
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}
function saveOrThrow(key, value) {
  if (!save(key, value)) throw new Error('This device could not save your changes. Storage may be full or blocked.');
}
/**
 * Returns false when the write failed (quota exceeded / private mode) so
 * callers can tell the visitor instead of losing their data silently.
 */
function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}
const KEYreports = 'reports';
/** Public-safe projection — contact details stay out of public listings. */
function publicReport(r) {
  const {
    contact: _contact,
    ...rest
  } = r;
  return rest;
}
function getReports() {
  const own = getStoredReports();
  return [...own, ...mockReports];
}
function getStoredReports() {
  const own = validRecords(load(KEYreports, []), reportSchema);
  // Migrate the old duplicate store without retaining large photo data URLs.
  try {
    const legacy = JSON.parse(localStorage.getItem('sa-lostfound') || 'null');
    if (Array.isArray(legacy?.state?.reports)) {
      const ids = new Set(own.map(r => r.id));
      const extra = validRecords(legacy.state.reports, reportSchema).filter(r => !ids.has(r.id));
      const merged = [...extra, ...own].map(({
        imageUrl: _image,
        ...report
      }) => report);
      if (save(KEYreports, merged)) {
        localStorage.removeItem('sa-lostfound');
        return merged;
      }
    }
  } catch {/* corrupted legacy data must not break the directory */}
  return own;
}
function getOwnReports(sub) {
  return getReports().filter(r => r.ownerSub === sub);
}
async function submitReport(input) {
  const report = reportSchema.parse({
    ...input,
    id: uid('rep'),
    status: 'Submitted',
    createdAt: new Date().toISOString()
  });
  if (report.kind === 'lost' && (!report.contact || report.contact.trim().length < 5)) throw new Error('Enter contact details for your lost item.');
  const own = getStoredReports();
  // The photo (a base64 data URL of up to ~3 MB) is shown for the current
  // session only — persisting it would eat most of the ~5 MB localStorage
  // budget and push earlier reports out with a quota error.
  const persisted = [{
    ...report,
    imageUrl: undefined
  }, ...own];
  if (!save(KEYreports, persisted)) {
    throw new Error('This device could not save the report locally (storage full or blocked). Free some space and try again.');
  }
  return report;
}
function filterReports(list, opts) {
  const q = opts.query.trim().toLowerCase();
  return list.filter(r => {
    if (opts.category !== 'All' && r.category !== opts.category) return false;
    if (opts.status !== 'All' && r.status !== opts.status) return false;
    if (opts.kind && opts.kind !== 'All' && r.kind !== opts.kind) return false;
    if (q && !(r.itemName.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.location.toLowerCase().includes(q))) return false;
    return true;
  });
}
// Coordinates within the reference artwork crop (x233, y158, width960, height748).
// These are illustrative positions, not surveyed coordinates or verified walking routes.
const referenceLocations = [...['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A8'].map((gate, i) => ({
  id: `gate-${gate.toLowerCase()}`,
  name: `Gate ${gate}`,
  category: 'Gates',
  x: [308, 366, 414, 457, 489, 523, 607][i],
  y: 109,
  description: 'Concourse A in the reference map. Confirm your assigned gate with your airline.'
})), ...['B1', 'B2', 'B3', 'B4', 'B6', 'B8'].map((gate, i) => ({
  id: `gate-${gate.toLowerCase()}`,
  name: `Gate ${gate}`,
  category: 'Gates',
  x: [758, 777, 810, 832, 853, 899][i],
  y: [167, 188, 235, 266, 298, 366][i],
  description: 'Concourse B in the reference map. Confirm your assigned gate with your airline.'
})), ...['C1', 'C2', 'C3', 'C4', 'C7', 'C5', 'C8'].map((gate, i) => ({
  id: `gate-${gate.toLowerCase()}`,
  name: `Gate ${gate}`,
  category: 'Gates',
  x: [163, 147, 133, 119, 93, 76, 47][i],
  y: [192, 223, 255, 286, 344, 375, 444][i],
  description: 'Concourse C in the reference map. Confirm your assigned gate with your airline.'
})), {
  id: 'security-screening',
  name: 'Security Checkpoint',
  category: 'Services',
  x: 467,
  y: 181,
  description: 'Security checkpoint shown above the Departures Hall.',
  aliases: ['security', 'passport-control-dep']
}, {
  id: 'baggage-services',
  name: 'Baggage Services',
  category: 'Services',
  x: 467,
  y: 385,
  description: 'Baggage assistance beside the Arrivals Hall in the reference map.',
  aliases: ['baggage-claim', 'baggage-claim-1', 'baggage-claim-2', 'baggage-claim-3', 'baggage-claim-4']
}, {
  id: 'food-west-wing',
  name: 'Food & Beverages',
  category: 'Services',
  x: 257,
  y: 333,
  description: 'Dining icon to the west of the Departures Hall.',
  aliases: ['cafe-dep', 'cafe-arr', 'food-dep', 'food-lounges']
}, {
  id: 'restroom-dep-west',
  name: 'Restrooms',
  category: 'Facilities',
  x: 585,
  y: 293,
  description: 'Restrooms beside the Departures Hall in the reference map.',
  aliases: ['restrooms', 'restroom-arr-west', 'restroom-arr-east', 'restroom-dep-east', 'cedar-lounge']
}, {
  id: 'medical-arr',
  name: 'Medical Services',
  category: 'Facilities',
  x: 628,
  y: 260,
  description: 'Medical cross icon east of the Departures Hall.',
  aliases: ['medical-dep', 'medical']
}, {
  id: 'info-desk',
  name: 'Information',
  category: 'Services',
  x: 305,
  y: 265,
  description: 'Information icon west of the Departures Hall.',
  aliases: ['info-desk-dep', 'info-desk-arr']
}, {
  id: 'duty-free-main',
  name: 'Shops',
  category: 'Services',
  x: 330,
  y: 392,
  description: 'Shop icon beside the Arrivals Hall.',
  aliases: ['duty-free-zone', 'shops-west-wing']
}, {
  id: 'departures-hall',
  name: 'Departures Hall',
  category: 'Services',
  x: 467,
  y: 277,
  description: 'Departures area between security and arrivals in the reference map.'
}, {
  id: 'arrivals-hall',
  name: 'Arrivals Hall',
  category: 'Services',
  x: 467,
  y: 407,
  description: 'Arrivals area beside baggage claim and the main entrance in the reference map.'
}, {
  id: 'main-entrance',
  name: 'Main Entrance',
  category: 'Facilities',
  x: 467,
  y: 444,
  description: 'Entrance between the terminal and parking.',
  aliases: ['entrance-departures-a', 'entrance-departures-b', 'entrance-arrivals-a', 'entrance-arrivals-b']
}, {
  id: 'parking-p1',
  name: 'Parking P1 · Short Stay',
  category: 'Facilities',
  x: 317,
  y: 642,
  description: 'Short-stay parking area in the supplied illustration.'
}, {
  id: 'parking-p2',
  name: 'Parking P2 · Long Stay',
  category: 'Facilities',
  x: 667,
  y: 642,
  description: 'Long-stay parking area in the supplied illustration.'
}];
referenceLocations.push({
  id: 'taxi-rank',
  name: 'Taxi',
  category: 'Facilities',
  x: 370,
  y: 550,
  description: 'Taxi pickup outside the main entrance. Confirm local pickup arrangements at the terminal.'
}, {
  id: 'bus-stop',
  name: 'Bus',
  category: 'Facilities',
  x: 560,
  y: 550,
  description: 'Bus pickup outside the main entrance. Check routes and schedules with the transport operator.'
});
const referenceWalkMinutes = {
  'security-screening': 3,
  'baggage-services': 5,
  'food-west-wing': 4,
  'restroom-dep-west': 6,
  'medical-arr': 5
};
function referenceLocation(id) {
  return referenceLocations.find(l => l.id === id || l.aliases?.includes(id || ''));
}
// Anchors calibrated against the user supplied, unmodified 1415 x 1112 PNG.
// Original screenshot fallback retains its own coordinates above.
const enhancedLocationPositions = {
  'gate-a1': {
    x: 294,
    y: 157
  },
  'gate-a2': {
    x: 349,
    y: 157
  },
  'gate-a3': {
    x: 396,
    y: 157
  },
  'gate-a4': {
    x: 439,
    y: 157
  },
  'gate-a5': {
    x: 479,
    y: 157
  },
  'gate-a6': {
    x: 519,
    y: 157
  },
  'gate-a8': {
    x: 567,
    y: 157
  },
  'gate-b1': {
    x: 719,
    y: 185
  },
  'gate-b2': {
    x: 740,
    y: 207
  },
  'gate-b3': {
    x: 767,
    y: 242
  },
  'gate-b4': {
    x: 787,
    y: 278
  },
  'gate-b6': {
    x: 807,
    y: 315
  },
  'gate-b8': {
    x: 841,
    y: 376
  },
  'gate-c1': {
    x: 201,
    y: 210
  },
  'gate-c2': {
    x: 185,
    y: 241
  },
  'gate-c3': {
    x: 169,
    y: 273
  },
  'gate-c4': {
    x: 155,
    y: 305
  },
  'gate-c7': {
    x: 139,
    y: 340
  },
  'gate-c5': {
    x: 121,
    y: 377
  },
  'gate-c8': {
    x: 85,
    y: 452
  },
  'security-screening': {
    x: 461,
    y: 209
  },
  'baggage-services': {
    x: 363,
    y: 373
  },
  'food-west-wing': {
    x: 244,
    y: 343
  },
  'restroom-dep-west': {
    x: 600,
    y: 311
  },
  'medical-arr': {
    x: 665,
    y: 262
  },
  'info-desk': {
    x: 312,
    y: 283
  },
  'duty-free-main': {
    x: 322,
    y: 383
  },
  'departures-hall': {
    x: 465,
    y: 289
  },
  'arrivals-hall': {
    x: 461,
    y: 397
  },
  'main-entrance': {
    x: 461,
    y: 471
  },
  'parking-p1': {
    x: 299,
    y: 652
  },
  'parking-p2': {
    x: 672,
    y: 652
  },
  'taxi-rank': {
    x: 366,
    y: 550
  },
  'bus-stop': {
    x: 563,
    y: 550
  }
};
const anchors = {
  "duty-free": "duty-free-main",
  lounges: "restroom-dep-west",
  dining: "food-west-wing",
  wifi: "departures-hall",
  "prayer-rooms": "restroom-dep-west",
  "charging-stations": "gate-a4",
  medical: "medical-arr",
  "currency-exchange": "arrivals-hall",
  restrooms: "restroom-dep-west",
  atms: "arrivals-hall",
  "info-desks": "info-desk",
  accessibility: "info-desk",
  "baggage-services": "baggage-services",
  "ground-transport": "taxi-rank",
  parking: "parking-p1",
  "car-rental": "arrivals-hall"
};
// Reuse the map's clear, named landmarks instead of drawing a second marker
// for services that already have an appropriate location on the artwork.
const canonicalMarkers = {
  dining: "food-west-wing",
  medical: "medical-arr",
  lounges: "restroom-dep-west",
  restrooms: "restroom-dep-west",
  "baggage-services": "baggage-services",
  parking: "parking-p1",
  "ground-transport": "taxi-rank"
};
const serviceMapId = service => canonicalMarkers[service.id] || `service-${service.id}`;
/** Service-area markers on the illustrative map, using the current directory. */
function serviceMapLocations(services) {
  const placed = new Map();
  return services.filter(service => !canonicalMarkers[service.id]).map(service => {
    const fallback = service.floor === "arrivals" ? "arrivals-hall" : service.floor === "parking" ? "parking-p1" : "departures-hall";
    const anchor = referenceLocation(anchors[service.id] || service.locationId || fallback) || referenceLocation(fallback);
    const index = placed.get(anchor.id) ?? 0;
    placed.set(anchor.id, index + 1);
    const offsetX = 28 + index % 3 * 32;
    const offsetY = 24 + Math.floor(index / 3) * 32;
    const enhanced = enhancedLocationPositions[anchor.id];
    return {
      id: serviceMapId(service),
      name: service.title,
      category: "Services",
      x: Math.min(930, anchor.x + offsetX),
      y: Math.min(720, anchor.y + offsetY),
      enhancedPosition: enhanced ? {
        x: Math.min(930, enhanced.x + offsetX),
        y: Math.min(720, enhanced.y + offsetY)
      } : undefined,
      description: `${service.location}. ${service.description}`,
      serviceIcon: service.icon,
      serviceColor: service.color
    };
  });
}
const ICONS = {
  'shopping-bag': ShoppingBag,
  armchair: Armchair,
  utensils: Utensils,
  wifi: Wifi,
  'moon-star': MoonStar,
  'plug-zap': PlugZap,
  'heart-pulse': HeartPulse,
  'refresh-cw': RefreshCw,
  accessibility: Accessibility,
  'credit-card': CreditCard,
  info: Info,
  baby: Baby,
  luggage: Luggage,
  bus: Bus,
  'square-parking': SquareParking,
  car: Car
};
function serviceIcon(name) {
  return ICONS[name] ?? Info;
}
function ServiceCard({
  service,
  favorite,
  onToggleFavorite,
  onOpen
}) {
  const Icon = serviceIcon(service.icon);
  return <article onClick={onOpen} role="button" tabIndex={0} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpen?.()} className="card group relative cursor-pointer p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-pop focus-ring">
      {onToggleFavorite && <button onClick={e => {
      e.stopPropagation();
      onToggleFavorite();
    }} aria-label={favorite ? `Remove ${service.title} from favorites` : `Add ${service.title} to favorites`} aria-pressed={favorite} className={cn(
    // 44px on a phone: this sits in the corner of a tappable card, so a
    // near-miss opens the card instead of toggling the favourite.
    'absolute right-1.5 top-1.5 flex h-11 w-11 items-center justify-center rounded-lg transition-colors focus-ring sm:right-3 sm:top-3 sm:h-auto sm:w-auto sm:p-1.5', favorite ? 'text-danger' : 'text-secondary hover:text-danger')}>
          <Heart className={cn('h-4 w-4', favorite && 'fill-current')} />
        </button>}

      <span className="flex h-10 w-10 items-center justify-center rounded-xl text-on-primary shadow-sm" style={{
      background: service.color
    }}>
        <Icon className="h-5 w-5" style={{
        color: contrastText(service.color)
      }} />
      </span>
      <h2 className="mt-3 text-[14px] font-semibold text-ink">{service.title}</h2>
      <p className="mt-1 text-[12.5px] leading-snug text-secondary">{service.description}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="rounded-md bg-surface px-1.5 py-0.5 text-[10.5px] font-medium text-primary">
          {service.category}
        </span>
        <span className="truncate text-[10.5px] text-muted">{service.location}</span>
      </div>
      <span className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        View details →
      </span>
    </article>;
}
/** Sample service directory — hours and descriptions are not verified airport data. */
const services = [{
  id: 'duty-free',
  title: 'Duty Free',
  description: 'Shop at our wide range of duty free stores.',
  category: 'Shopping',
  icon: 'shopping-bag',
  color: '#8a1538',
  location: 'Departures, airside after passport control',
  hours: 'Open 24 hours',
  floor: 'departures',
  locationId: 'duty-free-main'
}, {
  id: 'lounges',
  title: 'Lounges',
  description: 'Relax and unwind in our premium lounges.',
  category: 'Comfort',
  icon: 'armchair',
  color: '#d68da6',
  location: 'Upper level, airside — 1st and 2nd floor',
  hours: '05:00 – 23:00',
  floor: 'lounges',
  locationId: 'restroom-dep-west'
}, {
  id: 'dining',
  title: 'Dining',
  description: 'Explore restaurants and cafes across the airport.',
  category: 'Food & Drink',
  icon: 'utensils',
  color: '#F7B84B',
  location: 'Departures hall and both wings',
  hours: '06:00 – 00:00',
  floor: 'departures',
  locationId: 'food-west-wing'
}, {
  id: 'wifi',
  title: 'Wi-Fi',
  description: 'Free high-speed Wi-Fi available.',
  category: 'Connectivity',
  icon: 'wifi',
  color: '#2FD68F',
  location: 'All terminals',
  hours: '24/7'
}, {
  id: 'prayer-rooms',
  title: 'Prayer Rooms',
  description: 'Quiet prayer rooms available.',
  category: 'Facilities',
  icon: 'moon-star',
  color: '#d68da6',
  location: 'Upper level, airside above the duty-free area',
  hours: '24/7',
  floor: 'lounges',
  locationId: 'prayer-rooms-muslim'
}, {
  id: 'charging-stations',
  title: 'Charging Stations',
  description: 'Charge your devices anywhere.',
  category: 'Facilities',
  icon: 'plug-zap',
  color: '#2FD68F',
  location: 'Both gate wings, airside',
  hours: '24/7',
  floor: 'departures'
}, {
  id: 'medical',
  title: 'Medical Services',
  description: 'Medical assistance available 24/7.',
  category: 'Health',
  icon: 'heart-pulse',
  color: '#FF6B6B',
  location: 'Arrivals hall, ground level',
  hours: '24/7',
  floor: 'arrivals',
  locationId: 'medical-arrivals'
}, {
  id: 'currency-exchange',
  title: 'Currency Exchange',
  description: 'Exchange currency at the best rates.',
  category: 'Finance',
  icon: 'refresh-cw',
  color: '#8a1538',
  location: 'Arrivals hall',
  hours: '06:00 – 22:00',
  floor: 'arrivals',
  locationId: 'exchange-arrivals'
}, {
  id: 'restrooms',
  title: 'Restrooms',
  description: 'Clean restrooms on every level, including accessible cubicles.',
  category: 'Facilities',
  icon: 'accessibility',
  color: '#be8597',
  location: 'All levels',
  hours: '24/7'
}, {
  id: 'atms',
  title: 'ATMs',
  description: 'Cash machines operated by multiple banks.',
  category: 'Finance',
  icon: 'credit-card',
  color: '#8a1538',
  location: 'Departures and Arrivals halls',
  hours: '24/7'
}, {
  id: 'info-desks',
  title: 'Information Desks',
  description: 'Ask our staff for directions, lost items, or general help.',
  category: 'Support',
  icon: 'info',
  color: '#F7B84B',
  location: 'Main hall, Departures',
  hours: '24/7',
  floor: 'departures',
  locationId: 'info-desk-dep'
}, {
  id: 'accessibility',
  title: 'Accessibility Assistance',
  description: 'Wheelchairs, assistance gates, and dedicated support staff.',
  category: 'Support',
  icon: 'accessibility',
  color: '#d68da6',
  location: 'All terminals, request at check-in',
  hours: '24/7'
}, {
  id: 'baggage-services',
  title: 'Baggage Services',
  description: 'Baggage wrapping, excess baggage, and lost baggage desks.',
  category: 'Travel',
  icon: 'luggage',
  color: '#8a1538',
  location: 'Arrivals, baggage claim and belt area',
  hours: '05:00 – 00:00',
  floor: 'arrivals',
  locationId: 'baggage-services'
}, {
  id: 'ground-transport',
  title: 'Ground Transportation',
  description: 'Taxis at the arrivals curb, plus buses and private transfers.',
  category: 'Travel',
  icon: 'bus',
  color: '#2FD68F',
  location: 'Outside the arrivals hall',
  hours: '24/7',
  floor: 'arrivals',
  locationId: 'taxi-rank'
}, {
  id: 'parking',
  title: 'Parking',
  description: 'Multi-level terminal car park reached by a pedestrian tunnel.',
  category: 'Travel',
  icon: 'square-parking',
  color: '#be8597',
  location: 'Car park levels P1–P3',
  hours: '24/7',
  floor: 'parking',
  locationId: 'car-park-p1'
}, {
  id: 'car-rental',
  title: 'Car Rental',
  description: 'Major car rental desks in the arrivals hall.',
  category: 'Travel',
  icon: 'car',
  color: '#F7B84B',
  location: 'Arrivals hall, near the exits',
  hours: '06:00 – 23:00',
  floor: 'arrivals',
  locationId: 'pickup-curb'
}];
const serviceCategories = ['All', 'Shopping', 'Food & Drink', 'Comfort', 'Connectivity', 'Facilities', 'Health', 'Finance', 'Support', 'Travel'];
/**
 * Date the sample dataset was last refreshed. Everything on this site is
 * mock data, so this is the honest "last updated" value to surface to users.
 */
const DATA_LAST_UPDATED = '2026-10-06';
const SITE_NAME = 'SkyAssist';
const SITE_VERSION = '1.0.0';
const SUPPORT_PHONE = '+961 1 555 0199';
const SUPPORT_EMAIL = 'help@smartairport.example';
/** Formats the last-updated date. */
function formatLastUpdated(iso = DATA_LAST_UPDATED) {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}
/** ISO date stamp `<time datetime>` needs. */
const LAST_UPDATED_ISO = DATA_LAST_UPDATED;
/** Shows the date the sample dataset was last refreshed. */
function LastUpdated({
  className,
  withIcon = true,
  prefix = 'Last updated'
}) {
  return <p className={cn('flex items-center gap-1.5 text-[11.5px] text-muted', className)}>
      {withIcon && <CalendarClock className="h-3.5 w-3.5" aria-hidden />}
      <span>
        {prefix}{' '}
        <time dateTime={LAST_UPDATED_ISO} className="font-medium text-secondary">
          {formatLastUpdated()}
        </time>
      </span>
    </p>;
}
const useUserStore = create()(persist(set => ({
  theme: 'light',
  user: null,
  toggleTheme: () => set(s => ({
    theme: s.theme === 'light' ? 'dark' : 'light'
  })),
  loginDemo: ({
    email
  }) => set({
    user: {
      fullName: email.split('@')[0],
      email
    }
  }),
  registerDemo: ({
    fullName,
    email
  }) => set({
    user: {
      fullName,
      email
    }
  }),
  login: async email => {
    const user = {
      sub: 'local:' + email.toLowerCase(),
      fullName: email.split('@')[0],
      email
    };
    set({
      user
    });
    return user;
  },
  register: async ({
    fullName,
    email
  }) => {
    const user = {
      sub: 'local:' + email.toLowerCase(),
      fullName,
      email
    };
    set({
      user
    });
    return user;
  },
  logout: () => set({
    user: null
  }),
  logoutDemo: () => set({
    user: null
  })
}), {
  name: 'pure-preferences',
  storage: persistStorage,
  partialize: state => ({
    theme: state.theme,
    user: state.user
  })
}));
let revealAnimation;
let fallbackTimer;
function transitionThemeFrom(source, applyTheme) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const startViewTransition = document.startViewTransition;
  if (reduceMotion || !startViewTransition) {
    if (fallbackTimer) window.clearTimeout(fallbackTimer);
    document.documentElement.classList.add('theme-transition-fallback');
    applyTheme();
    fallbackTimer = window.setTimeout(() => document.documentElement.classList.remove('theme-transition-fallback'), reduceMotion ? 0 : 380);
    return;
  }
  const bounds = source.getBoundingClientRect();
  const x = bounds.left + bounds.width / 2;
  const y = bounds.top + bounds.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const transition = startViewTransition.call(document, applyTheme);
  void transition.ready.then(() => {
    revealAnimation?.cancel();
    revealAnimation = document.documentElement.animate({
      clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`]
    }, {
      duration: 620,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      pseudoElement: '::view-transition-new(root)'
    });
  }).catch(() => {});
}
let lockCount = 0;
let previousOverflow = '';
let sequence = 0;
const owners = new Map();
/**
 * Locks page scrolling until every overlapping modal has released its lock.
 * The returned cleanup is idempotent so React effect cleanup remains safe.
 */
function lockBodyScroll(owner = 'dialog') {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;
  const token = ++sequence;
  owners.set(token, owner);
  document.body.dataset.scrollLocks = String(lockCount);
  document.body.dataset.scrollLockOwners = [...owners.values()].join(',');
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    lockCount = Math.max(0, lockCount - 1);
    owners.delete(token);
    document.body.dataset.scrollLocks = String(lockCount);
    document.body.dataset.scrollLockOwners = [...owners.values()].join(',');
    if (lockCount === 0) document.body.style.overflow = previousOverflow;
  };
}
const dialogs = [];
const focusable = 'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])';
/** Shared focus/scroll lifecycle, including nested dialogs and changing callbacks. */
function useDialog(open, onClose) {
  const ref = useRef(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const panel = ref.current;
    if (!open || !panel) return;
    const previousFocus = document.activeElement;
    const unlockBodyScroll = lockBodyScroll(panel.getAttribute('aria-label') || panel.id || 'dialog');
    dialogs.push(panel);
    (panel.querySelector(focusable) ?? panel).focus();
    const onKey = event => {
      if (dialogs.at(-1) !== panel || event.defaultPrevented) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close.current();
      }
      if (event.key !== 'Tab') return;
      const items = [...panel.querySelectorAll(focusable)].filter(node => !node.hidden && node.getAttribute('aria-hidden') !== 'true' && node.getClientRects().length > 0);
      const first = items[0];
      const last = items.at(-1);
      if (!first) {
        event.preventDefault();
        panel.focus();
        return;
      }
      if (!panel.contains(document.activeElement) || document.activeElement === panel || event.shiftKey && document.activeElement === first || !event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    };
    const onFocus = event => {
      if (dialogs.at(-1) === panel && !panel.contains(event.target)) panel.focus();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('focusin', onFocus);
      const index = dialogs.indexOf(panel);
      if (index >= 0) dialogs.splice(index, 1);
      unlockBodyScroll();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);
  return ref;
}
function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  side = 'left',
  width = 'w-[320px]'
}) {
  const panelRef = useDialog(open, onClose);
  const titleId = useId();
  if (!open) return null;
  const position = side === 'bottom' ? 'left-0 right-0 bottom-0 max-h-[85vh] rounded-t-2xl' : side === 'right' ? 'right-0 top-0 h-full rounded-l-2xl' : 'left-0 top-0 h-full rounded-r-2xl';
  const anim = side === 'bottom' ? 'animate-[slideUp_.2s_ease-out]' : side === 'right' ? 'animate-[slideL_.2s_ease-out]' : 'animate-[slideR_.2s_ease-out]';
  return createPortal(<div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#571026]/70 backdrop-blur-[3px]" onClick={onClose} aria-hidden />
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : 'Panel'} className={cn('absolute flex flex-col bg-card border-line shadow-pop outline-none', side === 'left' && 'border-r', side === 'right' && 'border-l', side === 'bottom' && 'border-t', position, anim, side !== 'bottom' && width)}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 id={titleId} className="text-[14px] font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close panel" className="rounded-lg p-1.5 text-muted hover:bg-hover hover:text-ink focus-ring">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <div className="border-t border-line p-3">{footer}</div>}
      </div>
      <style>{`
        @keyframes slideUp { from { transform: translateY(24px); opacity: .6 } to { transform: none; opacity: 1 } }
        @keyframes slideL { from { transform: translateX(24px); opacity: .6 } to { transform: none; opacity: 1 } }
        @keyframes slideR { from { transform: translateX(-24px); opacity: .6 } to { transform: none; opacity: 1 } }
      `}</style>
    </div>, document.body);
}
/**
 * Every page body uses the same shell as the homepage: full-bleed inside the
 * shared 1cm `--page-gutter`, with no max-width cap.
 *
 * There used to be a `narrow` variant that capped the box at `max-w-5xl`, and a
 * shared `--page-max: 1240px` that stopped every box short of the viewport on a
 * large screen. Both are gone: a page box now spans the whole viewport less the
 * 1cm edge inset, so the width and the edge gap are identical on every route at
 * every screen size.
 */
function PageContainer({
  children,
  className
}) {
  return <div className={cn('page-gutter w-full', className)}>{children}</div>;
}
function SkipLink({
  targetId = 'main-content'
}) {
  return <a href={`#${targetId}`} onClick={event => {
    event.preventDefault();
    const target = document.getElementById(targetId);
    target?.focus();
    target?.scrollIntoView();
  }} className="print-hidden fixed left-3 top-3 z-[100] inline-flex min-h-11 -translate-y-24 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-on-primary shadow-pop transition-transform duration-200 focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
      Skip to content
      <ArrowDown className="h-3.5 w-3.5" aria-hidden />
    </a>;
}
const text = max => z.string().trim().transform(v => v.normalize('NFC')).pipe(z.string().max(max).refine(v => !/[\u0000-\u001f\u007f]/u.test(v), 'Remove control characters.'));
const emailSchema = z.string().trim().max(254).email('Enter a valid email address.').transform(v => v.toLowerCase());
const passwordSchema = z.string().min(15, 'Use at least 15 characters.').max(128, 'Use at most 128 characters.').refine(v => v.trim().length > 0, 'Password cannot be only whitespace.');
const fullNameSchema = text(100).pipe(z.string().min(2, 'Enter your full name (2–100 characters).'));
const phoneSchema = text(32).refine(v => !v || /^[+\d ()-]+$/.test(v) && v.replace(/\D/g, '').length >= 7 && v.replace(/\D/g, '').length <= 15, 'Enter a phone number with 7–15 digits.');
const registerSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional()
}).strict();
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  remember: z.boolean().default(true)
}).strict();
const profileSchema = z.object({
  fullName: fullNameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  city: text(100).optional(),
  preferences: text(500).optional(),
  currentPassword: z.string().max(128).optional()
}).strict();
const changePasswordSchema = z.object({
  current: z.string().min(1).max(128),
  next: passwordSchema
}).strict();
const resetRequestSchema = z.object({
  email: emailSchema
}).strict();
const resetSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  password: passwordSchema
}).strict();
const reportPreferences = z.object({
  query: z.string(),
  category: z.enum(['All', ...reportCategories]),
  status: z.enum(['All', ...reportStatuses])
});
const servicePreferences = z.object({
  query: z.string(),
  category: z.string(),
  favorites: z.array(z.string())
});
const useLostFoundStore = create()(persist(set => ({
  reports: getStoredReports(),
  query: '',
  category: 'All',
  status: 'All',
  setQuery: query => set({
    query
  }),
  setCategory: category => set({
    category
  }),
  setStatus: status => set({
    status
  }),
  addReport: r => set(s => ({
    reports: [r, ...s.reports]
  })),
  clearFilters: () => set({
    query: '',
    category: 'All',
    status: 'All'
  })
}), {
  name: 'sa-lostfound',
  storage: persistStorage,
  merge: (saved, current) => mergePreferences(saved, current, reportPreferences),
  partialize: s => ({
    query: s.query,
    category: s.category,
    status: s.status
  })
}));
const useServicesStore = create()(persist(set => ({
  query: '',
  category: 'All',
  favorites: [],
  setQuery: query => set({
    query
  }),
  setCategory: category => set({
    category
  }),
  toggleFavorite: id => set(s => ({
    favorites: s.favorites.includes(id) ? s.favorites.filter(x => x !== id) : [...s.favorites, id]
  }))
}), {
  name: 'sa-services',
  storage: persistStorage,
  merge: (saved, current) => mergePreferences(saved, current, servicePreferences)
}));
const useBookingStore = create(set => ({
  open: false,
  step: 0,
  flightId: null,
  openBooking: flightId => set({
    open: true,
    step: 0,
    flightId
  }),
  closeBooking: () => set({
    open: false
  }),
  next: () => set(s => ({
    step: Math.min(2, s.step + 1)
  })),
  back: () => set(s => ({
    step: Math.max(0, s.step - 1)
  })),
  reset: () => set({
    open: false,
    step: 0,
    flightId: null
  })
}));
const useSiteStore = create(() => ({
  flights: flights,
  services: services.filter(s => s.id !== 'family'),
  revision: 0
}));
const useAccountRecords = create(() => ({
  reports: [],
  bookings: [],
  owner: null
}));
const variants = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover active:translate-y-px shadow-sm disabled:hover:bg-primary',
  secondary: 'bg-navy text-white hover:opacity-90',
  outline: 'border border-line bg-card text-ink hover:border-primary hover:text-primary focus-ring',
  ghost: 'text-ink hover:bg-hover',
  destructive: 'bg-danger text-on-primary hover:opacity-90',
  link: 'text-primary underline-offset-4 hover:underline p-0 h-auto'
};
// Every size is a 44px touch target at phone widths and drops back to its
// compact height from `sm` up. Fingers are not cursor-accurate, so the small
// sizes only exist where a pointer is the likely input device.
const sizes = {
  sm: 'h-11 px-3 text-[12.5px] gap-1.5 rounded-lg sm:h-8',
  md: 'h-11 px-4 text-sm gap-2 rounded-lg sm:h-10',
  lg: 'h-11 px-6 text-sm gap-2 rounded-xl',
  icon: 'h-11 w-11 rounded-lg sm:h-9 sm:w-9'
};
const Button = forwardRef(function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  className,
  children,
  disabled,
  ...rest
}, ref) {
  return <button ref={ref} disabled={disabled || loading} className={cn('inline-flex items-center justify-center font-medium transition-colors select-none', 'focus-ring disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap', variants[variant], sizes[size], className)} {...rest} aria-busy={loading || rest['aria-busy']}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>;
});
function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  className,
  children,
  icon,
  onClick
}) {
  return <Link to={to} onClick={onClick} className={cn('inline-flex items-center justify-center font-medium transition-colors select-none', 'focus-ring whitespace-nowrap', variants[variant], sizes[size], className)}>
      {icon}
      {children}
    </Link>;
}
function Card({
  className,
  ...rest
}) {
  return <div className={cn('card', className)} {...rest} />;
}
function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className
}) {
  return <div className={cn('flex items-start justify-between gap-3 px-4 pt-4 pb-3', className)}>
      <div className="flex items-center gap-2.5 min-w-0">
        {icon}
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold leading-tight truncate">{title}</h2>
          {subtitle && <p className="text-[12px] text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>;
}
function Badge({
  children,
  tone = 'neutral',
  className
}) {
  const tones = {
    neutral: 'tone-neutral',
    success: 'tone-success',
    warning: 'tone-warning',
    danger: 'tone-danger',
    info: 'tone-info',
    purple: 'tone-purple'
  };
  return <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium', tones[tone], className)}>
      {children}
    </span>;
}
/**
 * Copies `value` to the clipboard and confirms it inline. Falls back to a
 * hidden textarea when the async Clipboard API is unavailable (older browsers,
 * or a page that is not in a secure context).
 */
function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  ariaLabel,
  className,
  iconOnly
}) {
  const [state, setState] = useState('idle');
  const timer = useRef(null);
  const flash = next => {
    setState(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 1800);
  };
  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const el = document.createElement('textarea');
        el.value = value;
        el.setAttribute('readonly', '');
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      flash('copied');
    } catch {
      flash('error');
    }
  };
  const text = state === 'copied' ? copiedLabel : state === 'error' ? 'Press Ctrl+C' : label;
  return <button type="button" onClick={copy} aria-label={ariaLabel ?? `${label}: ${value}`} className={cn('inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[11.5px] font-medium text-secondary', 'hover:border-primary hover:text-primary focus-ring', state === 'copied' && 'border-success/50 text-success', state === 'error' && 'border-danger/50 text-danger', className)}>
      {state === 'copied' ? <CheckImport className="h-3.5 w-3.5" /> : state === 'error' ? <TriangleAlert className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {!iconOnly && <span>{text}</span>}
    </button>;
}
function PageHeader({
  title,
  subtitle,
  back,
  actions,
  icon,
  className
}) {
  const navigate = useNavigate();
  return <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="flex items-center gap-2.5 min-w-0">
        {back && <button onClick={() => typeof back === 'string' ? navigate(back) : navigate(-1)} aria-label="Go back" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line bg-card text-secondary hover:text-primary hover:border-primary focus-ring sm:h-8 sm:w-8">
            <ArrowLeft className="h-4 w-4 flip-rtl" />
          </button>}
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-[17px] font-semibold leading-tight truncate">
            {icon}
            {title}
          </h1>
          {subtitle && <p className="mt-0.5 text-[12.5px] text-muted truncate">{subtitle}</p>}
        </div>
      </div>
      {/* The action row wraps: two long buttons (e.g. "Report Found Item" +
            "Report Lost Item") are wider than a 320px screen and would otherwise
            push the whole page into horizontal scroll. */}
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>;
}
function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  autoFocus,
  id = 'search',
  label
}) {
  return <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input id={id} type="search" aria-label={label ?? placeholder} value={value} autoFocus={autoFocus} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cn('h-11 w-full rounded-lg border border-line bg-input-bg pl-9 pr-10 text-[13px] text-ink sm:h-10 sm:pr-8', 'placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none')} />
      {value && <button onClick={() => onChange('')} aria-label="Clear search" className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded text-muted hover:text-ink focus-ring sm:right-2 sm:h-auto sm:w-auto sm:p-1">
          <X className="h-3.5 w-3.5" />
        </button>}
    </div>;
}
function FieldLabel({
  children,
  htmlFor
}) {
  return <label htmlFor={htmlFor} className="block text-[12px] font-medium text-secondary mb-1.5">
      {children}
    </label>;
}
function FieldError({
  message,
  id
}) {
  if (!message) return null;
  return <p id={id} role="status" className="mt-1 text-[11.5px] text-danger">
      {message}
    </p>;
}
const Input = forwardRef(function Input({
  label,
  error,
  hint,
  icon,
  className,
  wrapClassName,
  id,
  ...rest
}, ref) {
  const inputId = id ?? rest.name;
  return <div className={cn(wrapClassName)}>
      {label && <FieldLabel htmlFor={inputId}>{label}</FieldLabel>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            {icon}
          </span>}
        <input ref={ref} id={inputId} aria-invalid={!!error} aria-describedby={error ? inputId + '-error' : undefined} className={cn(
      // 44px on touch screens (h-11), back to the compact 40px from `sm` up.
      'h-11 w-full rounded-lg border bg-input-bg text-base sm:text-[13px] text-ink placeholder:text-muted sm:h-10', 'focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none transition-colors', icon ? 'pl-9 pr-3' : 'px-3', error && 'border-danger', className)} {...rest} />
      </div>
      {hint && !error && <p className="mt-1 text-[11.5px] text-muted">{hint}</p>}
      <FieldError id={inputId + '-error'} message={error} />
    </div>;
});
const Textarea = forwardRef(function Textarea({
  label,
  error,
  className,
  id,
  ...rest
}, ref) {
  const inputId = id ?? rest.name;
  return <div>
      {label && <FieldLabel htmlFor={inputId}>{label}</FieldLabel>}
      <textarea ref={ref} id={inputId} className={cn('w-full rounded-lg border bg-input-bg px-3 py-2 text-base sm:text-[13px] text-ink placeholder:text-muted', 'focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none transition-colors', error && 'border-danger', className, 'min-h-[84px]')} {...rest} />
      <FieldError id={(typeof inputId !== 'undefined' ? inputId : '') + '-error'} message={error} />
    </div>;
});
const Select = forwardRef(function Select({
  label,
  error,
  className,
  children,
  wrapClassName,
  id,
  ...rest
}, ref) {
  const selectId = id ?? rest.name;
  return <div className={cn(wrapClassName)}>
      {label && <FieldLabel htmlFor={selectId}>{label}</FieldLabel>}
      <div className="relative">
        <select ref={ref} id={selectId} aria-invalid={!!error} aria-describedby={error ? selectId + '-error' : undefined} className={cn('h-11 w-full appearance-none rounded-lg border bg-input-bg px-3 pr-8 text-base sm:text-[13px] text-ink sm:h-10', 'focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none transition-colors', error && 'border-danger', className)} {...rest}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
      <FieldError id={selectId + '-error'} message={error} />
    </div>;
});
function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showClose = true
}) {
  const panelRef = useDialog(open, onClose);
  const titleId = useId();
  if (!open) return null;
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };
  return createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#571026]/70 backdrop-blur-[3px]" onClick={onClose} aria-hidden />
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : 'Dialog'} className={cn('relative w-full rounded-2xl bg-card border border-line shadow-pop outline-none', 'max-h-[90vh] overflow-y-auto', sizes[size])}>
        {(title || showClose) && <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-card px-5 py-3.5 rounded-t-2xl">
            <h2 id={titleId} className="text-[15px] font-semibold">{title}</h2>
            {showClose && <button onClick={onClose} aria-label="Close dialog" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-ink focus-ring sm:h-9 sm:w-9">
                <X className="h-4 w-4" />
              </button>}
          </div>}
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="sticky bottom-0 flex justify-end gap-2 border-t border-line bg-card px-5 py-3.5 rounded-b-2xl">
            {footer}
          </div>}
      </div>
    </div>, document.body);
}
function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive,
  loading
}) {
  return <Modal open={open} onClose={onCancel} title={title} size="sm" showClose={false}>
      <p className="text-[13px] text-secondary">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onCancel} className="h-11 rounded-lg border border-line px-4 text-[13px] font-medium text-ink hover:bg-hover focus-ring sm:h-9">
          {cancelLabel}
        </button>
        <button onClick={onConfirm} disabled={loading} className={cn('h-11 rounded-lg px-4 text-[13px] font-medium text-on-primary focus-ring disabled:opacity-60 sm:h-9', destructive ? 'bg-danger hover:opacity-90' : 'bg-primary hover:bg-primary-hover')}>
          {loading ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>;
}
/**
 * Password field with a visibility toggle. The toggle is a real button so it is
 * reachable by keyboard, and it announces the action rather than the state
 * ("Show password" / "Hide password").
 */
function PasswordInput({
  label,
  error,
  hint,
  icon,
  className,
  wrapClassName,
  id,
  name,
  ...rest
}) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? name ?? 'password';
  return <div className={cn(wrapClassName)}>
      {label && <FieldLabel htmlFor={inputId}>{label}</FieldLabel>}
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>}
        <input {...rest} id={inputId} name={name} aria-invalid={!!error} aria-describedby={error ? inputId + '-error' : undefined} type={visible ? 'text' : 'password'} className={cn('h-11 w-full rounded-lg border bg-input-bg text-base sm:text-[13px] text-ink placeholder:text-muted sm:h-10', 'focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none transition-colors', icon ? 'pl-9 pr-12 sm:pr-10' : 'pl-3 pr-12 sm:pr-10', error && 'border-danger', className)} />
        <button type="button" onClick={() => setVisible(v => !v)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} title={visible ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-ink focus-ring sm:right-2 sm:h-8 sm:w-8">
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && !error && <p className="mt-1 text-[11.5px] text-muted">{hint}</p>}
      <FieldError id={inputId + '-error'} message={error} />
    </div>;
}
function Skeleton({
  className
}) {
  return <div className={cn('animate-skeleton rounded-lg', className)} aria-hidden />;
}
function LoadingSkeleton({
  rows = 4
}) {
  return <div className="space-y-3" role="status" aria-label="Loading results">
      {/* The bars keep their sizes on wide screens but are capped at the row
            width here: their fixed min-content (308px) used to make every page
            that showed this skeleton scroll horizontally while it loaded. */}
      {Array.from({
      length: rows
    }).map((_, i) => <div key={i} className="card min-w-0 p-4">
          <div className="flex min-w-0 items-center gap-4">
            <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-full max-w-24" />
              <Skeleton className="h-3 w-full max-w-40" />
            </div>
            <Skeleton className="h-8 w-20 max-w-full shrink-0" />
          </div>
        </div>)}
    </div>;
}
function EmptyState({
  title,
  description,
  action,
  icon,
  className
}) {
  return <div className={cn('card flex flex-col items-center justify-center px-6 py-10 text-center', className)}>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-primary">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <h2 className="text-[14px] font-semibold">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-[12.5px] text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>;
}
function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Retry',
  className
}) {
  return <div className={cn('card flex flex-col items-center justify-center px-6 py-10 text-center', className)}>
      <div className="tone-danger mb-3 flex h-11 w-11 items-center justify-center rounded-xl border">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h2 className="text-[14px] font-semibold">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-[12.5px] text-muted">{description}</p>}
      {onRetry && <Button variant="outline" size="sm" className="mt-4" onClick={onRetry} icon={<RefreshCw className="h-3.5 w-3.5" />}>
          {retryLabel}
        </Button>}
    </div>;
}
function Lines({
  count = 3
}) {
  return <div className="min-w-0 space-y-3">
      {Array.from({
      length: count
    }, (_, i) => <Skeleton key={i} className={`h-3 ${i === count - 1 ? 'w-2/3' : 'w-full'}`} />)}
    </div>;
}
function FlightResultsSkeleton({
  rows = 4
}) {
  return <div role="status" aria-label="Loading flight results" className="space-y-3" data-skeleton="flight-results">
      {Array.from({
      length: rows
    }, (_, i) => <div key={i} className="card p-3.5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex min-w-[168px] items-center gap-2.5">
              <Skeleton className="h-9 w-9 shrink-0" />
              <div className="w-28">
                <Lines count={2} />
              </div>
            </div>
            <div className="flex flex-1 items-center gap-3">
              <div className="w-14">
                <Skeleton className="mb-2 h-5 w-full" />
                <Skeleton className="h-3 w-8" />
              </div>
              <div className="flex flex-1 flex-col items-center gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="w-14">
                <Skeleton className="mb-2 h-5 w-full" />
                <Skeleton className="ml-auto h-3 w-8" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line pt-3 lg:border-0 lg:pt-0">
              <div className="w-20">
                <Lines count={2} />
              </div>
              <Skeleton className="h-11 w-28" />
            </div>
          </div>
        </div>)}
    </div>;
}
function WeatherSkeleton() {
  return <div role="status" aria-label="Loading weather forecast" data-skeleton="weather" className="space-y-3">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex items-start gap-2">
        <Skeleton className="h-4 w-4 shrink-0" />
        <div className="flex-1">
          <Lines count={2} />
        </div>
      </div>
      <Skeleton className="h-3 w-1/2" />
    </div>;
}
function AssistantWelcomeSkeleton() {
  return <div role="status" aria-label="Preparing assistant topics" data-skeleton="assistant-topics" className="mx-auto w-full max-w-2xl">
      <Skeleton className="mx-auto h-24 w-24 rounded-3xl sm:h-28 sm:w-28" />
      <Skeleton className="mx-auto mt-3 h-5 w-64 max-w-full" />
      <Skeleton className="mx-auto mt-2 h-3 w-80 max-w-full" />
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Array.from({
        length: 9
      }, (_, i) => <div key={i} className="flex min-h-14 items-center gap-3 rounded-xl border border-line px-3 py-2.5">
            <Skeleton className="h-9 w-9 shrink-0" />
            <div className="flex-1">
              <Lines count={2} />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>)}
      </div>
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>;
}
function MapCanvasSkeleton() {
  return <div className="absolute inset-0" aria-hidden data-skeleton="map-image">
      <Skeleton className="h-full w-full rounded-none" />
    </div>;
}
/** Route placeholders keep the same content columns and component silhouettes. */
function RouteSkeleton({
  pathname
}) {
  let body;
  if (pathname === '/airport-map') {
    body = <div className="grid gap-4 xl:grid-cols-[168px_minmax(0,1fr)_300px]" data-skeleton="map-page">
        <div className="hidden space-y-6 xl:block">
          <Lines count={8} />
        </div>
        <div className="card p-4">
          <Skeleton className="mb-3 h-11 w-full" />
          <div className="relative w-full min-w-0 overflow-hidden min-h-[360px] aspect-[960/748] max-h-[680px]">
            <MapCanvasSkeleton />
          </div>
          <div className="mt-4 flex gap-3">
            {Array.from({
            length: 5
          }, (_, i) => <Skeleton key={i} className="h-8 flex-1" />)}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-4">
            <Skeleton className="mb-4 h-5 w-36" />
            <Skeleton className="mb-3 h-11 w-full" />
            {Array.from({
            length: 6
          }, (_, i) => <div key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1">
                  <Lines count={2} />
                </div>
              </div>)}
          </div>
        </div>
      </div>;
  } else if (pathname === '/assistant') {
    body = <div className="card overflow-hidden" data-skeleton="assistant-page">
        <div className="flex gap-3 border-b border-line p-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="w-40">
            <Lines count={2} />
          </div>
        </div>
        <div className="p-4">
          <AssistantWelcomeSkeleton />
        </div>
        <div className="flex gap-3 border-t border-line p-4">
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 w-11" />
        </div>
      </div>;
  } else if (pathname === '/flights' || pathname === '/saved-flights') {
    body = <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="hidden space-y-6 rounded-xl border border-line p-4 lg:block">
          <Skeleton className="h-5 w-24" />
          <Lines count={12} />
        </div>
        <FlightResultsSkeleton />
      </div>;
  } else if (pathname === '/travel-time' || pathname.startsWith('/flights/')) {
    body = <div className="space-y-4">
        <div className="card p-5">
          <Skeleton className="mb-5 h-11 w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Lines count={4} />
            <Lines count={4} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map(i => <div key={i} className="card p-4">
              <Skeleton className="mb-4 h-5 w-40" />
              <WeatherSkeleton />
            </div>)}
        </div>
      </div>;
  } else if (['/login', '/register', '/forgot-password', '/reset-password', '/profile'].includes(pathname)) {
    body = <div className="card mx-auto max-w-lg space-y-5 p-6" data-skeleton="form">
        <Skeleton className="h-7 w-40" />
        {Array.from({
        length: pathname === '/register' ? 4 : 2
      }, (_, i) => <div key={i}>
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-11 w-full" />
          </div>)}
        <Skeleton className="h-11 w-full" />
      </div>;
  } else {
    body = <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-skeleton="directory">
        {Array.from({
        length: 6
      }, (_, i) => <div key={i} className="card space-y-4 p-5">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-5 w-3/4" />
            <Lines />
            <Skeleton className="h-10 w-28" />
          </div>)}
      </div>;
  }
  return <div className="page-gutter py-6" role="status" aria-label="Loading page content">
      <span className="sr-only">Loading page content</span>
      <Skeleton className="mb-3 h-7 w-72 max-w-full" />
      <Skeleton className="mb-6 h-4 w-96 max-w-full" />
      {body}
    </div>;
}
function Tabs({
  tabs,
  value,
  onChange,
  className,
  size = 'md'
}) {
  return <div className={cn('flex items-center gap-1 border-b border-line overflow-x-auto no-scrollbar', className)}>
      {tabs.map(t => {
      const active = t.id === value;
      return <button key={t.id} onClick={() => onChange(t.id)} aria-pressed={active} className={cn('relative flex items-center gap-1.5 whitespace-nowrap font-medium transition-colors focus-ring', size === 'md' ? 'px-3.5 py-2.5 text-[13px]' : 'px-3 py-2 text-[12.5px]', active ? 'text-primary' : 'text-secondary hover:text-ink')}>
            {t.icon}
            {t.label}
            <span className={cn('absolute left-0 right-0 -bottom-px h-0.5 rounded-full transition-colors', active ? 'bg-primary' : 'bg-transparent')} />
          </button>;
    })}
    </div>;
}
function Toaster() {
  const theme = useUserStore(s => s.theme);
  return <SonnerToaster position="top-right" theme={theme} toastOptions={{
    style: {
      borderRadius: '12px',
      fontSize: '13px'
    }
  }} richColors closeButton />;
}
// Adapt the flat passenger/report schemas to React Hook Form's resolver contract.
function zodResolver(schema) {
  return async (values, context, options) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) return {
      values: result.data,
      errors: {}
    };
    const errors = {};
    for (const issue of result.error.issues) {
      const name = issue.path.join('.') || 'root';
      if (!errors[name]) errors[name] = {
        type: issue.code,
        message: issue.message,
        ref: options?.fields?.[name]?.ref
      };
    }
    return {
      values: {},
      errors
    };
  };
}
function useAuthenticatedAction() {
  const user = useUserStore(s => s.user);
  const location = useLocation();
  const navigate = useNavigate();
  return useCallback((action, message = 'Log in to save favorites.') => {
    if (!user) {
      toast.info(message);
      navigate('/login?returnTo=' + encodeURIComponent(location.pathname + location.search));
      return false;
    }
    action();
    return true;
  }, [user, location.pathname, location.search, navigate]);
}
export { airlines, airlineByCode, airports, airportByCode, airportLabel, cn, formatDuration, parseTime, minutesToTime, formatMoney, uid, bookingReference, isDate, localDate, delay, timeOfDayLabel, contrastText, AirportAutocomplete, DEFAULT_DATE, DEFAULT_RETURN_DATE, flights, sortFlights, searchFlights, getFlightById, Dropdown, MenuItem, PassengerSelector, mockReports, reportCategories, reportStatuses, mockNotifications, userSchema, passengerSchemaschemas, countsSchema, cabinSchema, bookingSchema, reportSchema, validRecords, mergePreferences, persistStorage, useSearchStore, CABINS, searchFromQuery, searchToQuery, captureUtmParams, getUtmParams, withUtm, describeUtm, SearchCard, load, saveOrThrow, save, remove, publicReport, getReports, getStoredReports, getOwnReports, submitReport, filterReports, referenceLocations, referenceWalkMinutes, referenceLocation, enhancedLocationPositions, serviceMapId, serviceMapLocations, serviceIcon, ServiceCard, services, serviceCategories, DATA_LAST_UPDATED, SITE_NAME, SITE_VERSION, SUPPORT_PHONE, SUPPORT_EMAIL, formatLastUpdated, LAST_UPDATED_ISO, LastUpdated, useUserStore, transitionThemeFrom, lockBodyScroll, useDialog, Drawer, PageContainer, SkipLink, emailSchema, passwordSchema, fullNameSchema, phoneSchema, registerSchema, loginSchema, profileSchema, changePasswordSchema, resetRequestSchema, resetSchema, useLostFoundStore, useServicesStore, useBookingStore, useSiteStore, useAccountRecords, Button, LinkButton, Card, CardHeader, Badge, CopyButton, PageHeader, SearchBar, FieldLabel, FieldError, Input, Textarea, Select, Modal, ConfirmationDialog, PasswordInput, Skeleton, LoadingSkeleton, EmptyState, ErrorState, FlightResultsSkeleton, WeatherSkeleton, AssistantWelcomeSkeleton, MapCanvasSkeleton, RouteSkeleton, Tabs, Toaster, zodResolver, useAuthenticatedAction };