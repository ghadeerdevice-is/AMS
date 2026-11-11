import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Heart, MapPin, Navigation, Search, Star } from "lucide-react";
import { serviceCategories, useSiteStore, useServicesStore, ServiceCard, serviceIcon, PageContainer, PageHeader, SearchBar, Modal, Button, LinkButton, EmptyState, cn, contrastText, serviceMapId, useAuthenticatedAction } from "./Shared.js";
const PRIMARY_IDS = ['duty-free', 'lounges', 'dining', 'wifi', 'prayer-rooms', 'charging-stations', 'medical', 'currency-exchange'];
function ServicesPage() {
  const services = useSiteStore(s => s.services);
  const navigate = useNavigate();
  const {
    query,
    category,
    favorites,
    setQuery,
    setCategory,
    toggleFavorite
  } = useServicesStore();
  const [selected, setSelected] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const requireLogin = useAuthenticatedAction();
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = services.filter(s => (category === 'All' || s.category === category) && (!q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.location.toLowerCase().includes(q)));
    if (favoritesOnly) list = list.filter(s => favorites.includes(s.id));
    list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [query, category, favorites, favoritesOnly, services]);
  const visibleList = showAll || query || category !== 'All' || favoritesOnly ? filtered : filtered.filter(s => PRIMARY_IDS.includes(s.id));
  const SelectedIcon = selected ? serviceIcon(selected.icon) : null;
  return <PageContainer className="py-4 sm:py-6">
      <PageHeader title="Services" subtitle="Amenities and where to find them." actions={<Button variant={favoritesOnly ? 'primary' : 'outline'} size="sm" onClick={() => setFavoritesOnly(v => !v)} icon={<Heart className={cn('h-3.5 w-3.5', favoritesOnly && 'fill-current')} />}>
            Favorites {favorites.length > 0 && `(${favorites.length})`}
          </Button>} />

      {/* Controls */}
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchBar value={query} onChange={setQuery} placeholder="Search services (e.g., lounge, Wi-Fi)" className="w-full lg:w-[320px]" />
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {serviceCategories.map(c => <button key={c} onClick={() => setCategory(c)} aria-pressed={category === c} className={cn('flex min-h-11 items-center whitespace-nowrap rounded-lg border px-3 text-[12.5px] font-medium transition-colors focus-ring sm:min-h-0 sm:py-1.5', category === c ? 'border-primary bg-primary text-on-primary' : 'border-line bg-card text-secondary hover:border-primary hover:text-primary')}>
              {c}
            </button>)}
        </div>
      </div>

      {/* Grid */}
      {visibleList.length === 0 ? <EmptyState title="No services match your search" description="Try a different keyword or clear the filters." className="mt-4" action={<Button size="sm" variant="outline" onClick={() => {
      setQuery('');
      setCategory('All');
      setFavoritesOnly(false);
    }}>
              Reset filters
            </Button>} /> : <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleList.map(s => <ServiceCard key={s.id} service={s} favorite={favorites.includes(s.id)} onToggleFavorite={() => requireLogin(() => toggleFavorite(s.id))} onOpen={() => setSelected(s)} />)}
        </div>}

      {!showAll && visibleList.length > 0 && !query && category === 'All' && <button onClick={() => setShowAll(true)} className="mx-auto mt-5 flex h-11 w-full max-w-md items-center justify-center rounded-xl border border-primary/50 bg-card text-[13.5px] font-semibold text-primary transition-colors hover:bg-surface focus-ring">
          View All Services ({services.length})
        </button>}
      {showAll && <button onClick={() => setShowAll(false)} className="mx-auto mt-5 flex h-11 w-full max-w-md items-center justify-center rounded-xl border border-line bg-card text-[13.5px] font-semibold text-secondary transition-colors hover:border-primary hover:text-primary focus-ring">
          Show featured services only
        </button>}

      <p className="mt-6 text-center text-[11px] text-muted">
        Explore services by category and location.
      </p>

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title} size="md" footer={selected && <>
              <Button variant="outline" onClick={() => setSelected(null)}>
                Close
              </Button>
              <Button onClick={() => {
        navigate(`/airport-map?${new URLSearchParams({
          loc: serviceMapId(selected)
        })}`);
      }} icon={<Navigation className="h-4 w-4" />}>
                Show on Map
              </Button>
            </>}>
        {selected && SelectedIcon && <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl text-on-primary shadow-sm" style={{
            background: selected.color
          }}>
                <SelectedIcon className="h-6 w-6" style={{
              color: contrastText(selected.color)
            }} />
              </span>
              <div>
                <p className="text-[14px] font-semibold text-ink">{selected.title}</p>
                <span className="rounded-md bg-surface px-1.5 py-0.5 text-[11px] font-medium text-primary">
                  {selected.category}
                </span>
              </div>
              <button onClick={() => requireLogin(() => toggleFavorite(selected.id))} aria-label="Toggle favorite" className={cn('ml-auto flex h-11 w-11 items-center justify-center rounded-lg focus-ring sm:h-auto sm:w-auto sm:p-2', favorites.includes(selected.id) ? 'text-danger' : 'text-muted hover:text-danger')}>
                <Heart className={cn('h-4.5 w-4.5', favorites.includes(selected.id) && 'fill-current')} />
              </button>
            </div>

            <p className="text-[13px] leading-relaxed text-secondary">{selected.description}</p>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5 text-[12.5px]">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-secondary">{selected.location}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5 text-[12.5px]">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-secondary">{selected.hours}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-[11.5px] text-muted">
              <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
              Find opening hours, contact details and directions.
            </div>

            <div className="flex flex-wrap gap-2">
              <LinkButton to="/lost-and-found" variant="outline" size="sm">
                Lost something here?
              </LinkButton>
              <LinkButton to="/passenger-guide" variant="outline" size="sm">
                Passenger guide
              </LinkButton>
            </div>
          </div>}
      </Modal>

      <p className="sr-only">
        <Search /> {filtered.length} services listed
      </p>
    </PageContainer>;
}
export { ServicesPage };
export default ServicesPage;
