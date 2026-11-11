import { BusFront, CarTaxiFront, Cross, Info, Luggage, MapPin, ParkingSquare, Plane, ShieldCheck, ShoppingBag, UsersRound, Utensils, Crosshair, Expand, Minus, Plus, Search, X, ChevronRight, Clock3, Navigation } from "lucide-react";
import { serviceIcon, enhancedLocationPositions, referenceLocations, MapCanvasSkeleton, lockBodyScroll, referenceWalkMinutes, referenceLocation, useSiteStore, serviceMapLocations, cn, PageContainer, PageHeader } from "./Shared.js";
import { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
const appearances = {
  'security-screening': {
    Icon: ShieldCheck,
    color: '#8a1538',
    label: true
  },
  'baggage-services': {
    Icon: Luggage,
    color: '#8a1538'
  },
  'food-west-wing': {
    Icon: Utensils,
    color: '#ed862a'
  },
  'restroom-dep-west': {
    Icon: UsersRound,
    color: '#8a1538'
  },
  'medical-arr': {
    Icon: Cross,
    color: '#ef4767'
  },
  'info-desk': {
    Icon: Info,
    color: '#8a1538'
  },
  'duty-free-main': {
    Icon: ShoppingBag,
    color: '#8444c6'
  },
  'departures-hall': {
    Icon: Plane,
    color: '#8a1538',
    label: true
  },
  'arrivals-hall': {
    Icon: Luggage,
    color: '#16875e',
    label: true
  },
  'main-entrance': {
    Icon: MapPin,
    color: '#8a1538',
    label: true
  },
  'parking-p1': {
    Icon: ParkingSquare,
    color: '#8a1538',
    label: true
  },
  'parking-p2': {
    Icon: ParkingSquare,
    color: '#8a1538',
    label: true
  },
  'taxi-rank': {
    Icon: CarTaxiFront,
    color: '#e8a31c',
    label: true
  },
  'bus-stop': {
    Icon: BusFront,
    color: '#8a1538',
    label: true
  }
};
function mapAppearance(location) {
  if (location.serviceIcon) return {
    Icon: serviceIcon(location.serviceIcon),
    color: location.serviceColor || '#8a1538',
    label: true
  };
  return appearances[location.id] || {
    Icon: Plane,
    color: '#8a1538'
  };
}
const W = 960,
  REFERENCE_H = 748,
  MAX_ZOOM = 6;
// Chrome can withhold compatibility clicks immediately after a pan or pinch.
// Handle stationary touch releases directly; retain native click/keyboard behavior.
function MapActionButton({
  onActivate,
  ...props
}) {
  const down = useRef(null);
  const touchHandled = useRef(false);
  return <button {...props} onPointerDown={e => {
    touchHandled.current = false;
    down.current = {
      x: e.clientX,
      y: e.clientY
    };
    if (e.pointerType === "touch") {
      e.preventDefault();
      e.currentTarget.focus({
        preventScroll: true
      });
    }
  }} onPointerUp={e => {
    if (e.pointerType !== "touch" || !down.current || Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y) > 5) return;
    touchHandled.current = true;
    e.preventDefault();
    onActivate();
  }} onClick={e => {
    if (touchHandled.current && e.detail > 0) {
      touchHandled.current = false;
      return;
    }
    onActivate();
  }} />;
}
function InteractiveMapViewport({
  selected,
  focusLocation,
  onSelect,
  locations = referenceLocations
}) {
  const [camera, setCamera] = useState({
    zoom: 1,
    pan: {
      x: 0,
      y: 0
    }
  });
  const cameraRef = useRef(camera);
  const [size, setSize] = useState({
    width: W,
    height: REFERENCE_H
  });
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [artState, setArtState] = useState("loading");
  const [retry, setRetry] = useState(0);
  const panel = useRef(null),
    viewport = useRef(null);
  const expandButton = useRef(null),
    closeButton = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const initialized = useRef(false);
  const wasExpanded = useRef(false);
  // Cover the viewport without stretching the supplied image. Markers share
  // this same camera scale, including the image's native aspect ratio.
  const H = artState === "enhanced" ? W * 1112 / 1415 : REFERENCE_H;
  const fit = Math.max(size.width / W, size.height / H);
  const mapLocations = locations.map(location => {
    const position = location.enhancedPosition ?? enhancedLocationPositions[location.id] ?? location;
    return artState === "enhanced" ? {
      ...location,
      x: position.x,
      y: position.y * H / REFERENCE_H
    } : location;
  });
  function update(next) {
    const zoom = Math.max(1, Math.min(MAX_ZOOM, next.zoom));
    const limitX = Math.max(0, (W * zoom - size.width / fit) / 2);
    const limitY = Math.max(0, (H * zoom - size.height / fit) / 2);
    const value = {
      zoom,
      pan: {
        x: Math.max(-limitX, Math.min(limitX, next.pan.x)),
        y: Math.max(-limitY, Math.min(limitY, next.pan.y))
      }
    };
    cameraRef.current = value;
    setCamera(value);
  }
  function zoomAt(next, point = {
    x: size.width / 2,
    y: size.height / 2
  }) {
    const current = cameraRef.current;
    const zoom = Math.max(1, Math.min(MAX_ZOOM, next));
    const ratio = zoom / current.zoom;
    update({
      zoom,
      pan: {
        x: current.pan.x * ratio + (point.x - size.width / 2) / fit * (1 - ratio),
        y: current.pan.y * ratio + (point.y - size.height / 2) / fit * (1 - ratio)
      }
    });
  }
  function focus(x, y, zoom = Math.max(2.5, cameraRef.current.zoom)) {
    update({
      zoom,
      pan: {
        x: (W / 2 - x) * zoom,
        y: (H / 2 - y) * zoom
      }
    });
  }
  function project(point) {
    return {
      x: size.width / 2 + (camera.pan.x + (point.x - W / 2) * camera.zoom) * fit,
      y: size.height / 2 + (camera.pan.y + (point.y - H / 2) * camera.zoom) * fit
    };
  }
  useLayoutEffect(() => {
    const node = viewport.current;
    if (!node) return;
    setSize({
      width: node.clientWidth,
      height: node.clientHeight
    });
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!initialized.current && size.width !== W) {
      initialized.current = true;
      update({
        zoom: 1,
        pan: {
          x: 0,
          y: 0
        }
      });
    } else update(cameraRef.current);
  }, [size.width, size.height, H]);
  useEffect(() => {
    if (focusLocation) {
      const location = mapLocations.find(l => l.id === focusLocation.location.id);
      if (location) focus(location.x, location.y);
    }
  }, [focusLocation, artState]);
  useEffect(() => {
    let cancelled = false;
    const enhanced = new Image(),
      original = new Image();
    setArtState("loading");
    enhanced.onload = () => {
      if (!cancelled) setArtState("enhanced");
    };
    enhanced.onerror = () => {
      original.onload = () => {
        if (!cancelled) setArtState("original");
      };
      original.onerror = () => {
        if (!cancelled) setArtState("error");
      };
      original.src = process.env.PUBLIC_URL + "/images/airport-source.jpeg";
    };
    enhanced.src = process.env.PUBLIC_URL + "/images/airport-terminal-map.png";
    return () => {
      cancelled = true;
    };
  }, [retry]);
  useLayoutEffect(() => {
    if (!expanded) {
      if (wasExpanded.current) expandButton.current?.focus({
        preventScroll: true
      });
      wasExpanded.current = false;
      return;
    }
    wasExpanded.current = true;
    const unlockBodyScroll = lockBodyScroll('expanded-map');
    closeButton.current?.focus();
    const escape = event => {
      if (event.key === "Escape") {
        event.preventDefault();
        setExpanded(false);
      }
    };
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("keydown", escape, true);
      unlockBodyScroll();
    };
  }, [expanded]);
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    function wheel(event) {
      if (!(event.ctrlKey || event.metaKey || expanded || node?.contains(document.activeElement))) return;
      event.preventDefault();
      const bounds = node.getBoundingClientRect();
      zoomAt(cameraRef.current.zoom * Math.exp(-event.deltaY * 0.002), {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top
      });
    }
    node.addEventListener("wheel", wheel, {
      passive: false
    });
    return () => node.removeEventListener("wheel", wheel);
  }, [size.width, size.height, expanded]);
  // Cluster only nearby screen positions, retaining comfortable 44 px hit targets.
  const clusters = [];
  for (const location of [...mapLocations].sort((a, b) => Number(b.id === selected?.id) - Number(a.id === selected?.id))) {
    const point = project(location);
    if (point.x < 12 || point.y < 12 || point.x > size.width - 12 || point.y > size.height - 12) continue;
    const overlap = clusters.find(c => Math.hypot(c.point.x - point.x, c.point.y - point.y) < (size.width >= 640 ? 28 : 44));
    if (overlap) overlap.members.push(location);else clusters.push({
      members: [location],
      point
    });
  }
  function release(id) {
    pointers.current.delete(id);
    const remaining = [...pointers.current.values()];
    gesture.current = remaining.length ? {
      points: remaining,
      camera: cameraRef.current,
      moved: true
    } : null;
  }
  const matches = search.trim() ? mapLocations.filter(l => l.name.toLowerCase().includes(search.trim().toLowerCase())) : [];
  return <div ref={panel} className={expanded ? "map-expanded" : "min-w-0"} role={expanded ? "dialog" : undefined} aria-modal={expanded ? true : undefined} aria-label={expanded ? "Expanded airport map" : undefined} onKeyDown={e => {
    if (e.key === "Escape" && expanded) {
      e.preventDefault();
      setExpanded(false);
    }
    if (e.key === "Tab" && expanded) {
      const controls = [...panel.current.querySelectorAll('button:not([disabled]),input,[tabindex="0"]')].filter(n => n.getClientRects().length);
      const first = controls[0],
        last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }}>
      <div className="map-toolbar">
        <div className="flex flex-wrap items-center gap-1">
          <MapActionButton className="map-control" aria-label="Zoom in" disabled={camera.zoom >= MAX_ZOOM} onActivate={() => zoomAt(cameraRef.current.zoom + 0.25)}>
            <Plus className="h-4 w-4" aria-hidden />
          </MapActionButton>
          <output aria-label="Map zoom level" className="w-14 text-center text-xs font-semibold">
            {Math.round(camera.zoom * 100)}%
          </output>
          <MapActionButton className="map-control" aria-label="Zoom out" disabled={camera.zoom <= 1} onActivate={() => zoomAt(cameraRef.current.zoom - 0.25)}>
            <Minus className="h-4 w-4" aria-hidden />
          </MapActionButton>
          <MapActionButton className="map-control" aria-label="Reset map view" title="Fit whole map" onActivate={() => update({
          zoom: 1,
          pan: {
            x: 0,
            y: 0
          }
        })}>
            <Crosshair className="h-4 w-4" aria-hidden />
          </MapActionButton>
        </div>
        {expanded ? <MapActionButton ref={closeButton} className="map-control" aria-label="Close expanded map" onActivate={() => setExpanded(false)}>
            <X className="h-5 w-5" aria-hidden />
          </MapActionButton> : <MapActionButton ref={expandButton} className="map-control" aria-label="Expand map" onActivate={() => setExpanded(true)}>
            <Expand className="h-4 w-4" aria-hidden />
          </MapActionButton>}
      </div>
      {expanded && <div className="relative px-2 pb-2">
          <label className="relative block">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted" aria-hidden />
            <span className="sr-only">Search expanded map</span>
            <input type="search" value={search} maxLength={100} onChange={e => setSearch(e.target.value)} placeholder="Find a gate or service…" className="h-11 w-full rounded-lg border border-line bg-input-bg pl-9 pr-3 text-base focus-ring" />
          </label>
          {search && <div className="absolute left-2 right-2 top-full z-20 max-h-64 overflow-y-auto rounded-lg border border-line bg-card p-1 shadow-pop">
              {matches.map(location => <MapActionButton key={location.id} className="min-h-11 w-full rounded-lg px-3 text-left text-sm hover:bg-surface focus-ring" onActivate={() => {
          onSelect(location);
          focus(location.x, location.y);
          setSearch("");
          viewport.current?.focus({
            preventScroll: true
          });
        }}>
                  {location.name}
                </MapActionButton>)}
              {!matches.length && <p className="p-3 text-sm text-muted" role="status">
                  No matching location.
                </p>}
            </div>}
        </div>}
      <div ref={viewport} className="reference-map map-viewport focus-ring" tabIndex={0} role="region" aria-label="Terminal map. Use plus and minus to zoom, arrow keys to pan, and Home to reset." aria-describedby="map-instructions" onDragStart={e => e.preventDefault()} onKeyDown={e => {
      if (e.key === "Enter" || e.key === " ") suppressClick.current = false;
      if (e.target !== e.currentTarget) return;
      const moves = {
        ArrowLeft: {
          x: 60,
          y: 0
        },
        ArrowRight: {
          x: -60,
          y: 0
        },
        ArrowUp: {
          x: 0,
          y: 60
        },
        ArrowDown: {
          x: 0,
          y: -60
        }
      };
      if (["+", "=", "-", "Home", ...Object.keys(moves)].includes(e.key)) e.preventDefault();
      if (e.key === "+" || e.key === "=") zoomAt(cameraRef.current.zoom + 0.25);
      if (e.key === "-") zoomAt(cameraRef.current.zoom - 0.25);
      if (e.key === "Home") update({
        zoom: 1,
        pan: {
          x: 0,
          y: 0
        }
      });
      if (moves[e.key]) update({
        ...cameraRef.current,
        pan: {
          x: cameraRef.current.pan.x + moves[e.key].x,
          y: cameraRef.current.pan.y + moves[e.key].y
        }
      });
    }} onPointerDown={e => {
      if (e.button !== 0) return;
      // Own the gesture before the browser can start text selection or
      // native image dragging. Marker clicks still use their normal action.
      e.preventDefault();
      const marker = e.target.closest("button");
      (marker || e.currentTarget).focus({
        preventScroll: true
      });
      suppressClick.current = false;
      const box = e.currentTarget.getBoundingClientRect();
      pointers.current.set(e.pointerId, {
        x: e.clientX - box.left,
        y: e.clientY - box.top
      });
      gesture.current = {
        points: [...pointers.current.values()],
        camera: cameraRef.current,
        moved: false
      };
      if (!e.target.closest("button")) e.currentTarget.setPointerCapture(e.pointerId);
    }} onPointerMove={e => {
      if (!pointers.current.has(e.pointerId) || !gesture.current) return;
      const box = e.currentTarget.getBoundingClientRect();
      pointers.current.set(e.pointerId, {
        x: e.clientX - box.left,
        y: e.clientY - box.top
      });
      const current = [...pointers.current.values()],
        start = gesture.current;
      if (current.length >= 2 && start.points.length >= 2) {
        const [a, b] = current,
          [sa, sb] = start.points;
        const distance = Math.hypot(a.x - b.x, a.y - b.y),
          initial = Math.hypot(sa.x - sb.x, sa.y - sb.y);
        const zoom = Math.max(1, Math.min(MAX_ZOOM, start.camera.zoom * distance / Math.max(initial, 1)));
        const mid = {
            x: (a.x + b.x) / 2,
            y: (a.y + b.y) / 2
          },
          origin = {
            x: (sa.x + sb.x) / 2,
            y: (sa.y + sb.y) / 2
          };
        const ratio = zoom / start.camera.zoom;
        update({
          zoom,
          pan: {
            x: start.camera.pan.x * ratio + (mid.x - size.width / 2 - (origin.x - size.width / 2) * ratio) / fit,
            y: start.camera.pan.y * ratio + (mid.y - size.height / 2 - (origin.y - size.height / 2) * ratio) / fit
          }
        });
      } else {
        const delta = {
          x: current[0].x - start.points[0].x,
          y: current[0].y - start.points[0].y
        };
        if (!start.moved && Math.hypot(delta.x, delta.y) < 5) return;
        update({
          zoom: start.camera.zoom,
          pan: {
            x: start.camera.pan.x + delta.x / fit,
            y: start.camera.pan.y + delta.y / fit
          }
        });
      }
      start.moved = true;
      suppressClick.current = true;
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.setPointerCapture(e.pointerId);
    }} onPointerUp={e => release(e.pointerId)} onPointerCancel={e => release(e.pointerId)} onLostPointerCapture={e => {
      // A touch can transfer capture from a marker to the viewport while
      // panning. Only losing the viewport's own capture ends that gesture.
      if (e.target === e.currentTarget) release(e.pointerId);
    }} onClickCapture={e => {
      if (suppressClick.current && e.detail > 0) {
        e.preventDefault();
        e.stopPropagation();
        suppressClick.current = false;
      }
    }} onDoubleClick={e => {
      if (e.target.closest("button")) return;
      const bounds = e.currentTarget.getBoundingClientRect();
      zoomAt(cameraRef.current.zoom * 1.5, {
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top
      });
    }}>
        <svg className="map-artwork" viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
          <g data-map-camera="true" transform={`translate(${size.width / 2 + camera.pan.x * fit} ${size.height / 2 + camera.pan.y * fit}) scale(${camera.zoom * fit}) translate(${-W / 2} ${-H / 2})`}>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} overflow="hidden">
              {artState === "enhanced" ? <image href={process.env.PUBLIC_URL + "/images/airport-terminal-map.png"} width={W} height={H} preserveAspectRatio="xMidYMid meet" /> : artState === "original" ? <image href={process.env.PUBLIC_URL + "/images/airport-source.jpeg"} x="-233" y="-158" width="1536" height="1024" /> : null}
            </svg>
          </g>
        </svg>
        {artState === "enhanced" && [{
        name: "Concourse A",
        x: 255,
        y: 120
      }, {
        name: "Concourse B",
        x: 760,
        y: 120
      }, {
        name: "Concourse C",
        x: 95,
        y: 310
      }].map(({
        name,
        x,
        y
      }) => {
        const p = project({
          x,
          y: y * H / REFERENCE_H
        });
        return <span key={name} className="map-concourse" style={{
          left: p.x,
          top: p.y
        }} aria-hidden>
                {name}
              </span>;
      })}
        <span className="map-compass" aria-hidden>
          <span>N</span>↑
        </span>
        {(artState === "enhanced" || artState === "original") && clusters.map(({
        members,
        point
      }) => {
        const location = members[0],
          active = members.some(l => l.id === selected?.id);
        const clustered = members.length > 1 && !active;
        const {
          Icon,
          color,
          label
        } = mapAppearance(location);
        const showLabel = !clustered && (label || active);
        return <MapActionButton key={location.id} data-map-marker="true" className={`map-place ${active ? "is-selected" : ""} ${clustered ? "is-cluster" : ""} ${showLabel ? "has-place-label" : ""} ${location.category === "Gates" && !clustered ? "is-gate" : ""}`} style={{
          left: point.x,
          top: point.y,
          "--place-color": color
        }} aria-label={clustered ? `Explore ${members.length} locations: ${members.map(l => l.name).join(", ")}` : `Select ${location.name} on map`} aria-pressed={active} title={clustered ? members.map(l => l.name).join(", ") : location.name} onActivate={() => {
          if (suppressClick.current) return;
          if (clustered) focus(members.reduce((n, l) => n + l.x, 0) / members.length, members.reduce((n, l) => n + l.y, 0) / members.length, Math.min(MAX_ZOOM, camera.zoom * 1.7));else onSelect(location);
        }}>
                <span className="map-place-face">
                  {clustered ? members.length : location.category === "Gates" ? location.name.replace("Gate ", "") : <Icon className="h-4 w-4" aria-hidden />}
                </span>
                {!clustered && <span className="map-place-label">{location.name}</span>}
              </MapActionButton>;
      })}
        {(artState === "loading" || artState === "error") && <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface p-5 text-center" role="status">
            {artState === "loading" && <MapCanvasSkeleton />}
            <p className={artState === "loading" ? "sr-only" : undefined}>
              {artState === "error" ? "The terminal artwork could not be loaded." : "Loading terminal map…"}
            </p>
            {artState === "error" && <MapActionButton className="mt-3 min-h-11 px-4 underline focus-ring" onActivate={() => setRetry(n => n + 1)}>
                Retry map
              </MapActionButton>}
          </div>}
      </div>
      <div className="map-pan-toolbar" aria-label="Pan map">
        {[["Pan left", 60, 0, "←"], ["Pan up", 0, 60, "↑"], ["Pan down", 0, -60, "↓"], ["Pan right", -60, 0, "→"]].map(([name, x, y, label]) => <MapActionButton key={name} className="map-control" aria-label={String(name)} onActivate={() => update({
        ...cameraRef.current,
        pan: {
          x: cameraRef.current.pan.x + Number(x),
          y: cameraRef.current.pan.y + Number(y)
        }
      })}>
            {label}
          </MapActionButton>)}
        <span className="ml-auto px-2 text-xs text-muted" role="status">
          {selected ? selected.name : "Select a location"}
        </span>
      </div>
      <p id="map-instructions" className="px-2 py-2 text-xs leading-relaxed text-muted">
        Drag to move. Pinch or use + / − to zoom. On a computer, double-click or
        Ctrl + scroll to zoom. Select a numbered group to explore its locations.
      </p>
    </div>;
}
const quick = ["security-screening", "baggage-services", "food-west-wing", "restroom-dep-west", "medical-arr"];
/** Reference artwork with an accessible interactive location layer. */
function ReferenceAirportMap() {
  const [params, setParams] = useSearchParams();
  const services = useSiteStore(s => s.services);
  const locations = useMemo(() => [...referenceLocations, ...serviceMapLocations(services)], [services]);
  const selected = locations.find(location => location.id === params.get("loc")) || referenceLocation(params.get("loc"));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Gates");
  const [focusLocation, setFocusLocation] = useState();
  const selectedFocus = useMemo(() => selected ? {
    location: selected
  } : undefined, [selected]);
  const results = locations.filter(l => (query ? true : l.category === category) && `${l.name} ${l.description}`.toLowerCase().includes(query.toLowerCase().trim()));
  function choose(location, center = false) {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      next.set("loc", location.id);
      return next;
    }, {
      replace: true
    });
    if (center) setFocusLocation({
      location
    });
  }
  return <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="card min-w-0 p-3 sm:p-4" aria-label="Interactive terminal map">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-5 w-5 text-primary" aria-hidden />
            Terminal 1
          </span>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Search a gate, terminal, service</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" aria-hidden />
              <input type="search" name="map-search" placeholder="Search a gate or service…" maxLength={100} value={query} onChange={e => setQuery(e.target.value)} className="h-11 w-full min-w-0 rounded-lg border border-line bg-input-bg pl-9 pr-3 text-base focus-ring" />
            </span>
          </label>
        </div>
        <InteractiveMapViewport selected={selected} focusLocation={focusLocation?.location.id === selected?.id ? focusLocation : selectedFocus} locations={locations} onSelect={location => choose(location)} />
        {selected && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2" role="status">
            <span className="text-sm font-semibold">{selected.name}</span>
            <span className="text-xs text-secondary">
              {selected.category} · Selected on map
            </span>
          </div>}
        <div className="map-legend" aria-label="Map legend">
          {["gate-a1", "security-screening", "baggage-services", "restroom-dep-west", "food-west-wing", "duty-free-main", "medical-arr", "info-desk"].map(id => {
          const location = referenceLocation(id);
          const {
            Icon,
            color
          } = mapAppearance(location);
          return <button key={id} onClick={() => {
            if (id === "gate-a1") {
              setCategory("Gates");
              setQuery("Gate");
            } else choose(location, true);
          }} className="focus-ring">
                <span style={{
              backgroundColor: color
            }}>
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                {id === "gate-a1" ? "Gates" : id === "security-screening" ? "Security" : id === "medical-arr" ? "Medical" : location.name}
              </button>;
        })}
        </div>
      </section>
      <aside className="min-w-0 space-y-4" aria-label="Find your way">
        <section className="card p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Navigation className="h-4 w-4 text-primary" aria-hidden />
            Find your way
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-1">
            {["Gates", "Services", "Facilities"].map(c => <button key={c} onClick={() => {
            setCategory(c);
            setQuery("");
          }} aria-pressed={category === c} className={cn("min-h-11 rounded-lg border px-1 text-xs focus-ring", category === c ? "border-primary bg-primary text-on-primary" : "border-line text-secondary")}>
                {c}
              </button>)}
          </div>
          <label className="mt-3 block">
            <span className="sr-only">Find a map location</span>
            <input type="search" value={query} maxLength={100} onChange={e => setQuery(e.target.value)} placeholder={category === "Gates" ? "Search gate (e.g. A1, B6…)" : "Search services or facilities…"} className="h-11 w-full rounded-lg border border-line bg-input-bg px-3 text-base focus-ring" />
          </label>
          <p className="mt-4 text-xs font-semibold text-secondary">
            Quick links
          </p>
          <p className="mt-1 text-xs text-muted">
            Walking time · from Main Entrance
          </p>
          <div className="mt-2 divide-y divide-line rounded-lg border border-line">
            {quick.map(id => {
            const location = referenceLocation(id);
            const {
              Icon,
              color
            } = mapAppearance(location);
            return <button key={id} className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-surface focus-ring" onClick={() => choose(location, true)}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{
                color,
                backgroundColor: `${color}18`
              }}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium">
                      {location.name}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <Clock3 className="h-3 w-3" aria-hidden />
                      {referenceWalkMinutes[id]} min walk
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
                </button>;
          })}
          </div>
          <details open={Boolean(query) || category !== "Gates"} className="mt-3">
            <summary className="flex min-h-11 cursor-pointer items-center text-xs font-semibold text-primary focus-ring">
              Browse {category.toLowerCase()}
            </summary>
            <p className="mt-2 text-xs font-semibold text-secondary">
              {query ? "Search results" : category}
            </p>
            <ul className="mt-2 max-h-64 overflow-y-auto overscroll-contain">
              {results.map(location => <li key={location.id}>
                  <button onClick={() => choose(location, true)} aria-pressed={selected?.id === location.id} className="min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm text-primary hover:bg-surface focus-ring">
                    {location.name}
                  </button>
                </li>)}
            </ul>
            {!results.length && <p role="status" className="mt-3 text-sm text-muted">
                No locations match. Try a gate code or a service name.
              </p>}
          </details>
        </section>
        {selected && <section className="card p-4" aria-live="polite">
            <h2 className="font-semibold">{selected.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              {selected.description}
            </p>
            <p className="mt-2 text-xs text-muted">
              {referenceWalkMinutes[selected.id] ? `About ${referenceWalkMinutes[selected.id]} min walk from Main Entrance.` : "Use the map controls to explore this location."}
            </p>
            <button className="mt-3 min-h-11 text-sm text-primary underline focus-ring" onClick={() => setParams(p => {
          const next = new URLSearchParams(p);
          next.delete("loc");
          return next;
        }, {
          replace: true
        })}>
              Clear selection
            </button>
          </section>}
        {params.has("loc") && !selected && <p role="status" className="card p-4 text-sm text-secondary">
            This location is not identified in the supplied reference. Search
            for a visible gate or service.
          </p>}
      </aside>
    </div>;
}
function AirportMapPage() {
  return <PageContainer className="py-4 sm:py-6">
      <div className="min-w-0">
        <PageHeader title="Interactive Airport Map" subtitle="Explore the terminal, find a gate, and locate services." />
        <p className="my-4 max-w-4xl text-sm leading-relaxed text-secondary">
          Estimated walking times start at Main Entrance. Select a place to explore the terminal.
        </p>
        <ReferenceAirportMap />
        <p className="mt-4 text-xs text-muted">
          Select gates, halls and facilities to explore Terminal 1.
        </p>
      </div>
    </PageContainer>;
}
export { mapAppearance, InteractiveMapViewport, ReferenceAirportMap, AirportMapPage };
export default AirportMapPage;
