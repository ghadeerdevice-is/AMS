import { flights, bookingReference, uid, load, saveOrThrow, bookingSchema, cabinSchema, countsSchema, passengerSchemaschemas, validRecords, zodResolver, Modal, Button, Input, CopyButton, useBookingStore, useSearchStore, useUserStore, useSiteStore, getFlightById, PageContainer, Tabs, Card, CardHeader, EmptyState, ErrorState, Skeleton, airlineByCode, airportByCode, cn, formatDuration } from "./Shared.js";
import { useEffect, useRef, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Check as CheckImport, CircleCheck, CreditCard, ShieldCheck, ArrowLeft, CalendarDays, CheckCircle2, Clock, Info, Luggage, Plane, Users } from "lucide-react";
import { toast } from "sonner";
const KEY = 'bookings';
const cabinMultiplier = {
  Economy: 1,
  'Premium Economy': 1.6,
  Business: 2.6,
  'First Class': 4.2
};
function totalPassengers(p) {
  return p.adults + p.children + p.infants;
}
function estimatePrice(flightId, cabin, p) {
  const flight = flights.find(f => f.id === flightId);
  if (!flight || !cabinSchema.safeParse(cabin).success || !countsSchema.safeParse(p).success) return null;
  const paying = p.adults + p.children;
  const base = Math.round(flight.price * cabinMultiplier[cabin] * paying);
  const taxes = Math.round(base * 0.12);
  return {
    base,
    taxes,
    total: base + taxes
  };
}
function getBookings() {
  const local = validRecords(load(KEY, []), bookingSchema);
  return local;
}
async function createBooking(input) {
  const est = estimatePrice(input.flightId, input.cabinClass, input.passengerCounts);
  if (!est) throw new Error('Invalid flight, cabin or passenger selection.');
  if (!flights.find(f => f.id === input.flightId)?.cabinClasses.includes(input.cabinClass)) throw new Error('This cabin is unavailable on this flight.');
  const passengers = passengerSchemaschemas.array().min(1).parse(input.passengers);
  const all = getBookings();
  let reference = bookingReference();
  while (all.some(booking => booking.reference === reference)) reference = bookingReference();
  const booking = {
    id: uid('bk'),
    reference,
    flightId: input.flightId,
    passengers,
    cabinClass: input.cabinClass,
    passengerCounts: input.passengerCounts,
    total: est.total,
    createdAt: new Date().toISOString(),
    status: 'Confirmed',
    ownerSub: input.ownerSub
  };
  saveOrThrow(KEY, [booking, ...all]);
  return booking;
}
const passengerSchema = z.object({
  firstName: z.string().trim().min(2, 'Enter the first name as on the passport').max(100),
  lastName: z.string().trim().min(2, 'Enter the last name as on the passport').max(100),
  email: z.string().trim().email('Enter a valid email address').max(254),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional()
});
const STEPS = ['Passenger details', 'Review', 'Confirmation'];
function BookingWizard() {
  const flights = useSiteStore(s => s.flights);
  const {
    open,
    step,
    flightId,
    next,
    back,
    reset
  } = useBookingStore();
  const search = useSearchStore();
  const user = useUserStore(s => s.user);
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const flight = flights.find(f => f.id === flightId);
  const counts = search.passengers;
  const estimate = flightId ? estimatePrice(flightId, search.cabinClass, counts) : null;
  const {
    register,
    handleSubmit,
    formState: {
      errors
    },
    getValues,
    reset: resetForm
  } = useForm({
    resolver: zodResolver(passengerSchema),
    defaultValues: {
      firstName: user?.fullName.split(' ')[0] ?? '',
      lastName: user?.fullName.split(' ').slice(1).join(' ') ?? '',
      email: user?.email ?? ''
    }
  });
  useEffect(() => {
    if (!open) return;
    const current = useUserStore.getState().user;
    resetForm({
      firstName: current?.fullName.split(' ')[0] ?? '',
      lastName: current?.fullName.split(' ').slice(1).join(' ') ?? '',
      email: current?.email ?? '',
      phone: ''
    });
    setBooking(null);
  }, [open, flightId, resetForm]);
  if (!flight || !estimate) return null;
  const passengerCount = counts.adults + counts.children + counts.infants;
  const onSubmitPassenger = () => {
    next();
  };
  const confirm = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    try {
      const data = getValues();
      const created = await createBooking({
        flightId: flight.id,
        passengers: [data],
        cabinClass: search.cabinClass,
        passengerCounts: counts,
        ownerSub: user?.sub
      });
      setBooking(created);
      next();
      toast.success(`Booking ${created.reference} created.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Booking failed.');
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };
  const close = () => {
    if (inFlight.current) return;
    reset();
    setBooking(null);
  };
  return <Modal open={open} onClose={close} size="lg" title={step === 2 ? 'Booking saved' : `Book ${flight.flightNumber}`} footer={step === 0 ? <>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmitPassenger)}>Continue</Button>
          </> : step === 1 ? <>
            <Button variant="outline" onClick={back} disabled={submitting}>
              Back
            </Button>
            <Button onClick={confirm} loading={submitting}>
              Save booking
            </Button>
          </> : <>
            <Button variant="outline" onClick={() => {
      close();
      navigate('/flights');
    }}>
              Browse flights
            </Button>
            <Button onClick={close}>Done</Button>
          </>}>
      <p className="mb-4 text-[12px] text-secondary">No payment, ticket, or airline reservation is created.</p>{/* Stepper */}
      <ol className="mb-5 flex items-center gap-2">
        {STEPS.map((label, i) => <li key={label} className="flex flex-1 items-center gap-2">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i < step ? 'bg-success text-on-primary' : i === step ? 'bg-primary text-on-primary' : 'bg-line text-muted'}`}>
              {i < step ? <CheckImport className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={`hidden text-[11.5px] sm:block ${i === step ? 'font-semibold text-ink' : 'text-muted'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" />}
          </li>)}
      </ol>

      {step === 0 && <form onSubmit={e => {
      e.preventDefault();
      handleSubmit(onSubmitPassenger)();
    }} className="space-y-3">
          <p className="rounded-lg bg-surface px-3 py-2 text-[11.5px] text-secondary">
            Enter your passenger details, review your trip, and save your booking.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="First name" autoComplete="given-name" placeholder="as on passport" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last name" autoComplete="family-name" placeholder="as on passport" error={errors.lastName?.message} {...register('lastName')} />
            <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
            {/* `type="tel"` gives phones the numeric dial pad; `autoComplete`
                fills the number in one tap on a return visit. */}
            <Input label="Phone (optional)" type="tel" inputMode="tel" autoComplete="tel" placeholder="+961 ..." {...register('phone')} />
          </div>
          {passengerCount > 1 && <p className="text-[11.5px] text-muted">
              One passenger form covers all {passengerCount} travelers on this booking.
            </p>}
          <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[12px]">
            <span className="text-secondary">Fare</span>
            <span className="font-medium text-ink">
              {search.cabinClass} · ${flight.price} base × {counts.adults + counts.children}
            </span>
          </div>
        </form>}

      {step === 1 && <div className="space-y-3">
          <div className="rounded-xl border border-line p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13.5px] font-semibold text-ink">
                  {flight.flightNumber} · {flight.origin} → {flight.destination}
                </p>
                <p className="text-[12px] text-muted">
                  {flight.date} · {flight.departTime} – {flight.arriveTime} · {flight.stopLabels.join(' · ')}
                </p>
              </div>
              <span className="text-[15px] font-bold text-ink">${flight.price}</span>
            </div>
          </div>

          <div className="rounded-xl border border-line p-3 text-[12.5px]">
            <p className="mb-1.5 font-semibold text-ink">Passenger</p>
            <p className="text-secondary">
              {getValues().firstName} {getValues().lastName} — {getValues().email}
            </p>
          </div>

          <div className="rounded-xl bg-surface p-3 text-[12.5px]">
            <div className="flex justify-between py-0.5 text-secondary">
              <span>Base fare</span>
              <span>${estimate.base}</span>
            </div>
            <div className="flex justify-between py-0.5 text-secondary">
              <span>Taxes & fees</span>
              <span>${estimate.taxes}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-line pt-1.5 font-semibold text-ink">
              <span>Total</span>
              <span>${estimate.total}</span>
            </div>
          </div>

          <p className="flex items-start gap-1.5 text-[11.5px] text-muted">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            Check your passenger details before saving.
          </p>
        </div>}

      {step === 2 && booking && <div className="flex flex-col items-center py-2 text-center">
          <CircleCheck className="h-12 w-12 text-success" />
          <h3 className="mt-3 text-[16px] font-semibold">Your booking is saved</h3>
          <p className="mt-1 text-[12.5px] text-muted">
            Your booking reference:
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <p className="rounded-xl border border-dashed border-primary bg-surface px-5 py-2.5 font-mono text-[20px] font-bold tracking-[0.2em] text-primary">
              {booking.reference}
            </p>
            <CopyButton value={booking.reference} label="Copy reference" ariaLabel="Copy booking reference" />
          </div>
          <div className="mt-4 flex w-full items-center justify-between rounded-xl bg-surface px-4 py-3 text-left text-[12.5px]">
            <div>
              <p className="font-semibold text-ink">{flight.flightNumber}</p>
              <p className="text-muted">
                {flight.origin} → {flight.destination} · {search.cabinClass}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-ink">${booking.total}</p>
              <p className="flex items-center justify-end gap-1 text-[11px] text-success">
                <CreditCard className="h-3 w-3" /> Booking saved
              </p>
            </div>
          </div>
        </div>}
    </Modal>;
}
function InfoRow({
  label,
  value
}) {
  return <div className="flex items-start justify-between gap-3 border-b border-line py-2 last:border-b-0">
      <span className="text-[12px] text-muted">{label}</span>
      <span className="text-right text-[12.5px] font-medium text-ink">{value}</span>
    </div>;
}
function TimelineRow({
  time,
  title,
  subtitle,
  last,
  tone = 'primary'
}) {
  return <li className="relative flex gap-3 pb-4 last:pb-0">
      {!last && <span className="absolute left-[7px] top-4 h-full w-px bg-line" />}
      <span className={cn('relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] border-card shadow', tone === 'primary' && 'bg-primary', tone === 'success' && 'bg-success', tone === 'muted' && 'bg-muted')} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[13px] font-semibold text-ink">{title}</p>
          <p className="text-[13px] font-bold tabular-nums text-primary">{time}</p>
        </div>
        {subtitle && <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{subtitle}</p>}
      </div>
    </li>;
}
function FlightDetailsPage() {
  const catalogRevision = useSiteStore(s => s.revision);
  const {
    flightId
  } = useParams();
  const [flight, setFlight] = useState(null);
  const [status, setStatus] = useState('loading');
  const [tab, setTab] = useState('overview');
  const openBooking = useBookingStore(s => s.openBooking);
  const search = useSearchStore();
  useEffect(() => {
    let alive = true;
    setStatus('loading');
    getFlightById(flightId ?? '').then(f => {
      if (!alive) return;
      if (f) {
        setFlight(f);
        setStatus('ready');
      } else setStatus('missing');
    }).catch(() => alive && setStatus('error'));
    return () => {
      alive = false;
    };
  }, [flightId, catalogRevision]);
  if (status === 'loading') {
    return <PageContainer className="py-6">
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Skeleton className="h-[220px] rounded-2xl" />
          <Skeleton className="h-[220px] rounded-2xl" />
        </div>
        <Skeleton className="mt-4 h-10 w-full rounded-xl" />
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </PageContainer>;
  }
  if (status === 'missing') {
    return <PageContainer className="py-10">
        <EmptyState title="Flight not found" description="This flight isn't in the dataset — it may have been removed or the link is outdated." action={<Link to="/flights"><Button size="sm">Back to results</Button></Link>} />
      </PageContainer>;
  }
  if (status === 'error' || !flight) {
    return <PageContainer className="py-10">
        <ErrorState description="We couldn't load this flight's details." onRetry={() => window.location.reload()} />
      </PageContainer>;
  }
  const airline = airlineByCode(flight.airlineCode);
  const origin = airportByCode(flight.origin);
  const dest = airportByCode(flight.destination);
  const estimate = estimatePrice(flight.id, search.cabinClass, search.passengers);
  const pax = search.passengers.adults + search.passengers.children + search.passengers.infants;
  const checkinOpen = shift(flight.departTime, -180);
  const checkinClose = shift(flight.departTime, -40);
  return <PageContainer className="py-4 sm:py-6"><h1 className="sr-only">Flight {flight.flightNumber} details</h1>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Link to="/flights" className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary hover:underline focus-ring">
          <ArrowLeft className="h-3.5 w-3.5 flip-rtl" /> Back to results
        </Link>
      </div>

      {/* Summary + booking */}
      <div className="grid items-start gap-4 lg:grid-cols-[1.65fr_1fr]">
        {/* Flight summary */}
        <div className="overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-[#8a1538] to-[#571026] text-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-[11px] font-bold">
                {airline.code}
              </span>
              <div>
                <p className="text-[15px] font-bold leading-tight">{flight.flightNumber}</p>
                <p className="text-[12px] text-white/70">
                  {origin?.city} ({flight.origin}) → {dest?.city} ({flight.destination})
                </p>
              </div>
            </div>
            <span className="rounded-lg border px-2.5 py-1 text-[12px] font-semibold" style={{
            backgroundColor: "#ffffff",
            color: "#0f6b4b",
            borderColor: "#ffffff"
          }}>
              {flight.status}
            </span>
          </div>
          <p className="px-5 pt-2 text-[12px] text-white/70">
            {flight.date} · {flight.stops === 0 ? 'Direct Flight' : `${flight.stops} stop(s)`} ·{' '}
            {formatDuration(flight.durationMin)}
          </p>

          <div className="flex items-center gap-2 px-5 py-5 sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[24px] font-extrabold leading-none tabular-nums sm:text-[30px]">{flight.departTime}</p>
              <p className="mt-1 text-[13px] font-semibold">{flight.origin}</p>
              <p className="text-[11px] text-white/60">{origin?.name}</p>
            </div>
            <div className="flex w-20 shrink-0 flex-col items-center sm:w-auto sm:flex-1">
              <Plane className="h-4 w-4 -rotate-45 flip-rtl" />
              <div className="mt-1 h-px w-full bg-white/25" />
              <p className="mt-1 text-center text-[11.5px] text-white/70">
                {formatDuration(flight.durationMin)} · {flight.stopLabels.join(' · ')}
              </p>
            </div>
            <div className="min-w-0 flex-1 text-right">
              <p className="text-[24px] font-extrabold leading-none tabular-nums sm:text-[30px]">{flight.arriveTime}</p>
              <p className="mt-1 text-[13px] font-semibold">{flight.destination}</p>
              <p className="text-[11px] text-white/60">{dest?.name}</p>
            </div>
          </div>
        </div>

        {/* Booking summary */}
        <Card className="p-4">
          <h2 className="text-[14px] font-semibold">Booking Summary</h2>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[12.5px] text-secondary">
                <Users className="h-3.5 w-3.5 text-primary" /> {search.cabinClass}
              </span>
              <span className="text-[16px] font-bold text-ink">${flight.price}</span>
            </div>
            <div className="text-[11.5px] text-muted">
              {pax} Passenger{pax > 1 ? 's' : ''}
            </div>
            <div className="flex items-center justify-between border-t border-line pt-2 text-[12.5px]">
              <span className="text-secondary">Base fare</span>
              <span className="text-ink">${estimate?.base ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-secondary">Taxes & fees</span>
              <span className="text-ink">${estimate?.taxes ?? 0}</span>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-2">
              <span className="text-[13px] font-semibold text-ink">Total estimated</span>
              <span className="text-[22px] font-bold text-ink">${estimate?.total ?? 0}</span>
            </div>
          </div>

          <Button className="mt-3.5 w-full" size="lg" onClick={() => openBooking(flight.id)}>
            Book Now
          </Button>
          <p className="mt-2.5 text-center text-[10.5px] leading-snug text-muted">
            Saved in this browser; no ticket or reservation is issued.
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mt-5">
        <Tabs value={tab} onChange={setTab} tabs={[{
        id: 'overview',
        label: 'Overview'
      }]} />
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {tab === 'overview' && <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader title="Flight Information" icon={<Info className="h-4 w-4 text-primary" />} />
              <div className="px-4 pb-4">
                <InfoRow label="Airline" value={`${airline.name}`} />
                <InfoRow label="Flight Number" value={flight.flightNumber} />
                <InfoRow label="Aircraft" value={flight.aircraft} />
                <InfoRow label="Class" value={search.cabinClass} />
                <InfoRow label="Booking Class" value={flight.bookingClass} />
                <InfoRow label="Meal" value={flight.meal} />
                <InfoRow label="Check-in Opens" value={checkinOpen} />
                <InfoRow label="Check-in Closes" value={checkinClose} />
              </div>
            </Card>

            <Card>
              <CardHeader title="Flight Timeline" icon={<Clock className="h-4 w-4 text-primary" />} />
              <ul className="px-4 pb-4">
                <TimelineRow time={flight.departTime} title="Departure" subtitle={`${origin?.name} · ${flight.legs[0].terminalFrom}`} />
                <TimelineRow time={formatDuration(flight.durationMin)} title="In Flight" subtitle={flight.stops > 0 ? `Layover${flight.stops > 1 ? 's' : ''}: ${flight.legs.filter(l => l.layoverCity).map(l => `${l.layoverCity} (${formatDuration(l.layoverMin ?? 0)})`).join(', ')}` : 'Non-stop routing'} tone="muted" />
                <TimelineRow time={flight.arriveTime} title="Arrival" subtitle={`${dest?.name} · ${flight.legs[flight.legs.length - 1].terminalTo}`} tone="success" last />
              </ul>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader title="Baggage Allowance" icon={<Luggage className="h-4 w-4 text-primary" />} />
                <div className="flex gap-3 px-4 pb-4">
                  <div className="flex-1 rounded-xl bg-surface p-3 text-center">
                    <Luggage className="mx-auto h-4 w-4 text-primary" />
                    <p className="mt-1.5 text-[13px] font-semibold text-ink">1 Carry-on</p>
                    <p className="text-[11.5px] text-muted">{flight.carryOnKg} kg</p>
                  </div>
                  <div className="flex-1 rounded-xl bg-surface p-3 text-center">
                    <svg viewBox="0 0 24 24" className="mx-auto h-4 w-4 fill-none stroke-primary" strokeWidth="2">
                      <rect x="4" y="7" width="16" height="13" rx="2" />
                      <path d="M9 7V4h6v3" />
                    </svg>
                    <p className="mt-1.5 text-[13px] font-semibold text-ink">{flight.checkedBags} Checked Bag</p>
                    <p className="text-[11.5px] text-muted">
                      {flight.checkedBags ? `${flight.checkedKg} kg` : 'not included'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title="Important Information" icon={<Info className="h-4 w-4 text-warning" />} />
                <ul className="space-y-2 px-4 pb-4 text-[12.5px] text-secondary">
                  {['Arrive at the airport at least 3 hours before departure.', 'Gates close 20 minutes before departure.', 'Have your travel documents ready.'].map(line => <li key={line} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      {line}
                    </li>)}
                </ul>
              </Card>
            </div>
          </div>}


      </div>

      <div className="mt-5 flex items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-[11.5px] text-muted">
        <CalendarDays className="h-3.5 w-3.5" /> Flight times are shown in each airport’s local time.
      </div>

      <BookingWizard />
    </PageContainer>;
}
function shift(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = (h * 60 + m + minutes + 1440 * 2) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
export { totalPassengers, estimatePrice, getBookings, createBooking, BookingWizard, FlightDetailsPage };
export default FlightDetailsPage;
