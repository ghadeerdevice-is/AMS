import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { PageContainer, PageHeader } from "./Shared.js";
const officialAirports = [{
  name: 'Beirut Rafic Hariri',
  code: 'BEY',
  url: 'https://www.beirutairport.gov.lb/'
}, {
  name: 'Singapore Changi',
  code: 'SIN',
  url: 'https://www.changiairport.com/'
}, {
  name: 'Dubai International',
  code: 'DXB',
  url: 'https://www.dubaiairports.ae/'
}, {
  name: 'London Heathrow',
  code: 'LHR',
  url: 'https://www.heathrow.com/'
}, {
  name: 'Hamad International',
  code: 'DOH',
  url: 'https://dohahamadairport.com/'
}, {
  name: 'Istanbul',
  code: 'IST',
  url: 'https://www.istairport.com/'
}, {
  name: 'Amsterdam Schiphol',
  code: 'AMS',
  url: 'https://www.schiphol.nl/en/'
}, {
  name: 'Hong Kong International',
  code: 'HKG',
  url: 'https://www.hongkongairport.com/'
}, {
  name: 'Incheon International',
  code: 'ICN',
  url: 'https://www.airport.kr/'
}];
const passengerGuide = [{
  id: 'check-in',
  title: 'Check-in and airline bookings',
  text: 'Use your airline’s official website or app for tickets, seat selection, changes and check-in. Check the arrival time, terminal and check-in deadline on your airline’s instructions. SkyAble does not sell tickets or issue boarding passes.'
}, {
  id: 'baggage',
  title: 'Baggage and missing luggage',
  text: 'Your ticket and operating airline determine baggage size, weight and fees. For checked luggage that did not arrive, contact the airline or its baggage-handling desk and keep your baggage receipt. For an item left in the terminal, contact the airport’s lost-property service.'
}, {
  id: 'security',
  title: 'Security screening',
  text: 'Check the departure airport’s current screening guidance before packing. Rules for liquids, electronics and prohibited items vary. Follow staff instructions at the checkpoint; no security queue estimates are available here.'
}, {
  id: 'documents',
  title: 'Passports and entry requirements',
  text: 'Requirements depend on your nationality, destination, transit points and documents. Check the destination government or consulate and your airline before travelling. The IATA Travel Centre provides a starting point for checking requirements.',
  url: 'https://www.iata.org/en/travel-centre/',
  label: 'IATA Travel Centre'
}, {
  id: 'assistance',
  title: 'Accessibility and special assistance',
  text: 'Contact your airline and the airport’s official assistance service before travel to arrange the support you need. Confirm meeting points, accessible transport and arrangements for mobility equipment directly with them.'
}, {
  id: 'families',
  title: 'Travelling with children',
  text: 'Confirm travel documents, infant baggage, pushchair handling and unaccompanied-minor arrangements with your airline. Use the airport’s official directory to locate family facilities.'
}, {
  id: 'connections',
  title: 'Terminals and connecting flights',
  text: 'Check your ticket and current airport information for the correct terminal. Confirm whether your connection requires baggage collection, immigration or a terminal transfer. Explore the terminal map to locate gates and services.'
}, {
  id: 'transport',
  title: 'Transport, parking and pick-up',
  text: 'Use the airport’s official transport pages for taxi and ride-hailing pick-up points, public transport schedules, parking rates, car rentals and drop-off rules. Check current prices with the operator.'
}, {
  id: 'facilities',
  title: 'Dining, shopping and airport facilities',
  text: 'Check the airport directory for restaurants, shops, lounges, prayer rooms, information desks, Wi-Fi, charging, ATMs and medical assistance. Availability, opening hours, prices and airside access must be confirmed with the airport or provider.'
}, {
  id: 'advisories',
  title: 'Travel updates and disruptions',
  text: 'Check your airline’s flight status and the official airport website before setting off. This site has no verified news or advisory feed. Ask the airline about available options during a disruption; assistance and refund eligibility depend on the journey and applicable rules.'
}, {
  id: 'contact',
  title: 'Contact the right team',
  text: 'For tickets, check-in or checked baggage, contact the operating airline. For terminal facilities, access or lost property, use the airport’s official contact page. The assistant here is automated and cannot transfer you to an airport employee.'
}];
function PassengerGuidePage() {
  return <PageContainer className="guide-page py-6 sm:py-8">
    <PageHeader title="Passenger guide" subtitle="Prepare for your journey. Find the right airport or airline information." />
    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-secondary">Plan your airport visit with practical guidance and travel resources.</p>
    <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav aria-label="Passenger guide topics" className="card h-fit p-4 lg:sticky lg:top-4">
        {passengerGuide.map(item => <a key={item.id} href={`#/passenger-guide#${item.id}`} onClick={event => {
          event.preventDefault();
          document.getElementById(item.id)?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }} className="block rounded-lg px-2 py-3 text-sm text-primary hover:bg-surface focus-ring">{item.title}</a>)}
      </nav>
      <div className="min-w-0 space-y-4">
        {passengerGuide.map(item => <section key={item.id} id={item.id} className="card scroll-mt-6 p-5 sm:p-6" aria-labelledby={`guide-${item.id}`}>
          <h2 id={`guide-${item.id}`} className="text-lg font-semibold">{item.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-secondary">{item.text}</p>
          {item.url && <a href={item.url} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline focus-ring">{item.label}<ExternalLink className="h-4 w-4" aria-hidden /></a>}
          {item.id === 'baggage' && <Link to="/lost-and-found" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline focus-ring">Lost & Found</Link>}
          {item.id === 'transport' && <Link to="/flights" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline focus-ring">Explore flights</Link>}
        </section>)}
        <section id="official-airports" className="card scroll-mt-6 p-5 sm:p-6" aria-labelledby="official-title">
          <h2 id="official-title" className="text-lg font-semibold">Official airport websites</h2>
          <p className="mt-2 text-sm text-secondary">Flight information, contact details, transport and local passenger services.</p>
          <ul className="mt-3 divide-y divide-line">{officialAirports.map(airport => <li key={airport.code}><a href={airport.url} className="flex min-h-12 items-center justify-between gap-3 py-3 text-sm text-primary underline focus-ring"><span>{airport.name} ({airport.code})</span><ExternalLink className="h-4 w-4 shrink-0" aria-hidden /></a></li>)}</ul>
        </section>
      </div>
    </div>
  </PageContainer>;
}
export { officialAirports, passengerGuide, PassengerGuidePage };
export default PassengerGuidePage;
