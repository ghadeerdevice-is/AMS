import { useEffect } from "react";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster, SkipLink, useUserStore } from "./components/Shared.js";
import { Navbar } from "./components/Navbar.js";
import { Footer } from "./components/Footer.js";
import { HomePage } from "./components/Home.js";
import { FlightsPage } from "./components/Flights.js";
import { FlightDetailsPage } from "./components/Details.js";
import { AirportMapPage } from "./components/Map.js";
import { ServicesPage } from "./components/Services.js";
import { LostAndFoundPage } from "./components/Lost.js";
import { PassengerGuidePage } from "./components/Guide.js";
import { LoginPage } from "./components/Login.js";
import { RegisterPage } from "./components/Signup.js";
import { NotFoundPage } from "./components/Missing.js";
function ScrollReset() {
  const {
    pathname,
    hash
  } = useLocation();
  useEffect(() => {
    if (hash) {
      const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
      return () => cancelAnimationFrame(frame);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
function App() {
  const {
    theme
  } = useUserStore();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return <HashRouter><ScrollReset /><div className="flex min-h-screen flex-col bg-bg"><SkipLink /><Navbar /><main id="main-content" tabIndex={-1} className="flex-1"><Routes><Route path="/" element={<HomePage />} /><Route path="/flights" element={<FlightsPage />} /><Route path="/flights/:flightId" element={<FlightDetailsPage />} /><Route path="/airport-map" element={<AirportMapPage />} /><Route path="/services" element={<ServicesPage />} /><Route path="/lost-and-found" element={<LostAndFoundPage />} /><Route path="/passenger-guide" element={<PassengerGuidePage />} /><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route path="*" element={<NotFoundPage />} /></Routes></main><Footer /><Toaster /></div></HashRouter>;
}
export { App };
export default App;