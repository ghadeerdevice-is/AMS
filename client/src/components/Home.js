import { useState } from "react";
import { SearchCard } from "./Shared.js";
import { Link } from "react-router-dom";
/**
 * Hero source set. Kept in one place so the `<picture>` sources and the
 * preload in `index.html` describe the same image.
 */
// The panoramic source is 3:1. Account for object-cover's height-driven crop
// so the browser does not upscale a small variant inside the taller hero.
const HERO_SIZES = '(min-width: 1024px) max(960px, 49vw), (min-width: 640px) max(660px, 100vw), 510px';
const HERO_AVIF = [480, 768, 1024, 1440, 1920, 2172].map(w => `${process.env.PUBLIC_URL}/images/airport-sunrise-${w}.avif ${w}w`).join(', ');
const HERO_WEBP = [480, 768, 1024, 1440, 1920, 2172].map(w => `${process.env.PUBLIC_URL}/images/airport-sunrise-${w}.webp ${w}w`).join(', ');
const HERO_JPEG = [1024, 1440, 1920, 2172].map(w => `${process.env.PUBLIC_URL}/images/airport-sunrise-${w}.jpg ${w}w`).join(', ');
function HomePage() {
  const [heroFailed, setHeroFailed] = useState(false);
  // Full-bleed: the home boxes stretch edge to edge, inset from the viewport by
  // the shared 1cm page gutter so they never touch the screen border.
  return <div className="page-gutter w-full py-6 sm:py-10">
      {/* Hero */}
      <section className="card relative overflow-hidden rounded-2xl">
        <div className="grid items-stretch lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          {/* Copy */}
          <div className="relative z-10 order-2 flex flex-col justify-center gap-3 px-5 py-7 sm:px-8 lg:order-1 lg:py-14 lg:pl-12 lg:pr-12">
            <span className="tone-info w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold">
              Airport companion
            </span>
            <h1 className="text-[26px] font-bold leading-[1.12] tracking-tight sm:text-[32px] lg:text-[36px]">
              Fly with <span className="text-primary">less hassle.</span>
            </h1>
            <p className="max-w-md text-[14px] leading-relaxed text-secondary">Flights, airport map, and help — all in one place.</p>
          </div>

          {/* Image — fades into the white card so the copy stays the focus.
            AVIF first (smallest), WebP next, JPEG fallback; the container is
            already sized so the swap can never shift the layout. */}
          <div className="relative order-1 min-h-[170px] sm:min-h-[220px] lg:order-2 lg:min-h-[320px]">
            {!heroFailed && <picture>
                <source type="image/avif" srcSet={HERO_AVIF} sizes={HERO_SIZES} />
                <source type="image/webp" srcSet={HERO_WEBP} sizes={HERO_SIZES} />
                <img src={`${process.env.PUBLIC_URL}/images/airport-sunrise-1440.jpg`} srcSet={HERO_JPEG} sizes={HERO_SIZES} width={2172} height={724} alt="" aria-hidden="true" fetchPriority="high" decoding="async" onError={() => setHeroFailed(true)} className="absolute inset-0 h-full w-full object-cover object-center" />
              </picture>}
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-card via-card/45 to-transparent lg:bg-gradient-to-r lg:from-card lg:via-card/35 lg:to-transparent" />
          </div>
        </div>
      </section>

      <div className="mt-4"><SearchCard /></div>

      {/* Passenger guidance */}
      <div className="card mt-5 flex flex-wrap items-center justify-between gap-3 p-5">
        <div><h2 className="font-semibold">Before you travel</h2><p className="mt-1 text-sm text-secondary">Check-in guidance, baggage, accessibility, transport and official airport information.</p></div>
        <Link to="/passenger-guide" className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary focus-ring">Passenger guide</Link>
      </div>


      {/* Floating assistant promo. It is fixed to the viewport, so where it sits
            in the DOM has no effect on layout; it is last so it does not break up
            the reading order of the page content. */}
      
    </div>;
}
export { HomePage };
export default HomePage;
