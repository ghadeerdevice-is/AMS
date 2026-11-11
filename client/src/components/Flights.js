import { useMemo, useState, useEffect, useRef } from "react";
import { ChevronDown, Plane, ArrowRight, Clock, MapPin, CalendarDays, CheckCircle2, Users, X } from "lucide-react";
import { cn, formatDuration, airlineByCode, Badge, persistStorage, mergePreferences, useSiteStore, useSearchStore, searchFlights, sortFlights, searchFromQuery, useDialog, SearchCard, PageContainer, Button, Dropdown, MenuItem, EmptyState, ErrorState, FlightResultsSkeleton, airportLabel } from "./Shared.js";
import { useNavigate, useSearchParams } from "react-router-dom";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";
import { format, parseISO } from "date-fns";
function AirlineLogo({
  code,
  color
}) {
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white shadow-sm" style={{
    backgroundColor: color
  }} aria-hidden>
      {code.slice(0, 2)}
    </span>;
}
function FlightCard({
  flight,
  badge
}) {
  const navigate = useNavigate();
  const airline = airlineByCode(flight.airlineCode);
  return <article className="card group relative p-3.5 transition-shadow hover:shadow-pop">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Airline */}
        <div className="flex min-w-[168px] items-center gap-2.5">
          <AirlineLogo code={airline.code} color={airline.logoColor} />
          <div className="min-w-0">
            {badge && <Badge tone="success" className="mb-0.5">
                {badge}
              </Badge>}
            <p className="truncate text-[13px] font-semibold text-ink">{airline.name}</p>
            <p className="text-[11.5px] text-muted">{flight.flightNumber}</p>
          </div>
        </div>

        {/* Times */}
        <div className="flex flex-1 items-center gap-3">
          <div className="text-left">
            <p className="text-[19px] font-bold leading-none tabular-nums text-ink">{flight.departTime}</p>
            <p className="mt-1 text-[12px] font-semibold text-primary">{flight.origin}</p>
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-center px-1">
            <p className="text-[11px] text-muted">{formatDuration(flight.durationMin)}</p>
            <div className="relative my-1 flex w-full items-center">
              <span className="h-px flex-1 bg-line" />
              <Plane className="mx-1.5 h-3.5 w-3.5 shrink-0 -rotate-45 text-primary flip-rtl" />
              <span className="h-px flex-1 bg-line" />
            </div>
            <p className={cn('text-[11px] font-medium', flight.stops === 0 ? 'text-success' : 'text-secondary')}>
              {flight.stopLabels.join(' · ')}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[19px] font-bold leading-none tabular-nums text-ink">{flight.arriveTime}</p>
            <p className="mt-1 text-[12px] font-semibold text-primary">{flight.destination}</p>
          </div>
        </div>

        {/* Meta chips */}
        <div className="hidden flex-col items-end gap-1 xl:flex">
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <Clock className="h-3 w-3" /> {flight.aircraft}
          </span>
        </div>

        {/* Price + actions */}
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3 lg:justify-end lg:border-t-0 lg:pt-0">
          <div className="text-left lg:text-right">
            <p className="text-[20px] font-bold leading-none text-ink">${flight.price}</p>
            <p className="mt-1 text-[11px] text-muted">Economy · per seat</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => navigate(`/flights/${flight.id}`)} className="flex h-11 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-hover focus-ring sm:h-9">
              Select
              <ArrowRight className="h-3.5 w-3.5 flip-rtl" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer strip */}
      <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-line pt-2 text-[11px] text-muted">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {flight.origin} → {flight.destination}
        </span>
        <span>{flight.status}</span>
        <span className="hidden sm:inline">{flight.refundable ? 'Refundable' : 'Non-refundable'}</span>
      </div>
    </article>;
}
const preferences = z.object({
  sort: z.enum(['best', 'price', 'duration', 'depEarliest', 'arrEarliest', 'stops'])
});
const useFlightStore = create()(persist(set => ({
  results: [],
  loading: false,
  error: null,
  sort: 'best',
  page: 1,
  selectedId: null,
  setResults: results => set({
    results,
    error: null,
    page: 1
  }),
  setLoading: loading => set({
    loading
  }),
  setError: error => set({
    error
  }),
  setSort: sort => set({
    sort,
    page: 1
  }),
  setPage: page => set({
    page
  }),
  select: selectedId => set({
    selectedId
  })
}), {
  name: 'sa-flights',
  storage: persistStorage,
  merge: (saved, current) => mergePreferences(saved, current, preferences),
  partialize: s => ({
    sort: s.sort
  })
}));
const SORTS = [{
  id: 'best',
  label: 'Best Match'
}, {
  id: 'price',
  label: 'Lowest Price'
}, {
  id: 'duration',
  label: 'Shortest Duration'
}, {
  id: 'depEarliest',
  label: 'Earliest Departure'
}, {
  id: 'arrEarliest',
  label: 'Earliest Arrival'
}, {
  id: 'stops',
  label: 'Fewest Stops'
}];
const PER_PAGE = 5;
function FlightsPage() {
  const catalogRevision = useSiteStore(s => s.revision);
  const catalogFlights = useSiteStore(s => s.flights);
  const [params] = useSearchParams();
  const hasSearch = Boolean(params.get('from') && params.get('to') && params.get('depart'));
  const searchKey = params.toString();
  const search = useSearchStore();
  const {
    loading,
    error,
    sort,
    page,
    setResults,
    setLoading,
    setError,
    setSort,
    setPage
  } = useFlightStore();
  const [editOpen, setEditOpen] = useState(false);
  const [retry, setRetry] = useState(0);
  const editRef = useDialog(editOpen, () => setEditOpen(false));
  const searchVersion = useRef(0);
  const baseResults = useFlightStore(s => s.results);
  useEffect(() => {
    setSort('best');
  }, [searchKey, catalogRevision, setSort]);
  // One search per submitted URL; ignore results from superseded requests.
  useEffect(() => {
    const version = ++searchVersion.current;
    if (!hasSearch) {
      setResults(catalogFlights);
      setLoading(false);
      setError(null);
      return () => {
        searchVersion.current++;
      };
    }
    const input = searchFromQuery(params, useSearchStore.getState());
    useSearchStore.getState().setField(input);
    setLoading(true);
    setError(null);
    searchFlights(input).then(results => {
      if (version === searchVersion.current) setResults(results);
    }).catch(error => {
      if (version === searchVersion.current) setError(error instanceof Error ? error.message : 'Flight search failed.');
    }).finally(() => {
      if (version === searchVersion.current) {
        setLoading(false);
      }
    });
    return () => {
      searchVersion.current++;
    };
  }, [params, hasSearch, retry, setResults, setLoading, setError, catalogRevision, catalogFlights]);
  const filtered = useMemo(() => sortFlights(baseResults, sort), [baseResults, sort]);
  const shown = hasSearch ? filtered.slice(0, page * PER_PAGE) : filtered;
  const pax = search.passengers.adults + search.passengers.children + search.passengers.infants;
  const summary = <div className="card p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[17px] font-bold text-ink">{search.origin}</p>
            <p className="text-[11.5px] text-muted">{airportLabel(search.origin).replace(/\s*\(.*\)/, '')}</p>
          </div>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-primary">
            <Plane className="h-3.5 w-3.5 flip-rtl" />
          </span>
          <div>
            <p className="text-[17px] font-bold text-ink">{search.destination}</p>
            <p className="text-[11.5px] text-muted">{airportLabel(search.destination).replace(/\s*\(.*\)/, '')}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[12.5px] text-secondary">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="font-medium text-ink">
            {format(parseISO(search.departDate), 'EEE, MMM d, yyyy')}
          </span>
          {search.tripType === 'round' && <>
              <span className="text-muted">→</span>
              <span className="font-medium text-ink">
                {format(parseISO(search.returnDate), 'EEE, MMM d, yyyy')}
              </span>
            </>}
        </div>

        <div className="flex items-center gap-1.5 text-[12.5px] text-secondary">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-medium text-ink">
            {pax} Passenger{pax > 1 ? 's' : ''}
          </span>
          <span className="text-muted">·</span>
          <span>{search.cabinClass}</span>
        </div>

        <Button variant="outline" size="sm" className="ml-auto" onClick={() => setEditOpen(true)}>
          Edit Search
        </Button>
      </div>
    </div>;
  return <PageContainer className="py-4 sm:py-6">
      <h1 className="sr-only">Flight search results</h1>
      {hasSearch && <div className="space-y-4">{summary}</div>}

      <div className="mt-4 flex flex-col gap-4 lg:flex-row">
        {/* Results */}
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-[14px] font-semibold text-ink">
              {loading ? 'Searching flights…' : `${filtered.length} flights found`}
            </h2>

            <div className="ml-auto flex items-center gap-2">
              {/* No aria-label: the accessible name is taken from the trigger's
               own text ("Sort by: …"), so it always matches what is shown. */}
              <Dropdown align="end" width="w-56" trigger={<button className="flex h-11 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-[12.5px] text-secondary hover:border-primary focus-ring sm:h-9">
                    Sort by:{' '}
                    <span className="font-semibold text-ink">
                      {SORTS.find(s => s.id === sort)?.label}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>}>
                {close => SORTS.map(s => <MenuItem key={s.id} active={s.id === sort} icon={s.id === sort ? <CheckCircle2 className="h-3.5 w-3.5" /> : undefined} onClick={() => {
                setSort(s.id);
                close();
              }}>
                      {s.label}
                    </MenuItem>)}
              </Dropdown>
            </div>
          </div>

          {loading ? <FlightResultsSkeleton rows={4} /> : error ? <ErrorState title="We couldn't load flights" description={error} onRetry={() => setRetry(value => value + 1)} retryLabel="Retry search" /> : filtered.length === 0 ? <EmptyState title="No flights found" description="Try searching a different route or date — this dataset only covers a few routes." action={<div className="flex gap-2">
                  <Button size="sm" onClick={() => setEditOpen(true)}>
                    Edit search
                  </Button>
                </div>} /> : <div className="space-y-3">
              {shown.map((f, i) => <FlightCard key={f.id} flight={f} badge={i === 0 && sort === 'best' ? 'Best Match' : undefined} />)}

              <div className="flex flex-col items-center gap-2 pt-1">
                <p className="text-[11.5px] text-muted">
                  Showing {shown.length} of {filtered.length} results{hasSearch ? ` · page ${page}` : ''}
                </p>
                {shown.length < filtered.length && <Button variant="outline" onClick={() => setPage(page + 1)}>
                    Load more flights
                  </Button>}
                {page > 1 && <button onClick={() => setPage(1)} className="text-[12px] text-primary hover:underline focus-ring">
                    Back to top
                  </button>}
              </div>
            </div>}
        </div>
      </div>

      {/* Edit search modal */}
      {editOpen && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#571026]/70 p-4 pt-10 backdrop-blur-[3px]">
          <div ref={editRef} role="dialog" aria-modal="true" aria-label="Edit search" tabIndex={-1} className="w-full max-w-3xl outline-none" onClick={e => e.stopPropagation()}>
            <div className="mb-2 flex justify-end">
              <button onClick={() => setEditOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-card text-secondary shadow-pop hover:text-ink focus-ring" aria-label="Close edit search">
                <X className="h-4 w-4" />
              </button>
            </div>
            <SearchCard onSearch={() => {
          setEditOpen(false);
          setRetry(value => value + 1);
        }} />
            <p className="mt-2 text-center text-[11.5px] text-white/90">
              Press “Search Flights” to apply your changes.
            </p>
          </div>
          <button className="absolute inset-0 -z-10 cursor-default" aria-label="Close edit search" onClick={() => setEditOpen(false)} />
        </div>}

    </PageContainer>;
}
export { FlightCard, useFlightStore, FlightsPage };
export default FlightsPage;