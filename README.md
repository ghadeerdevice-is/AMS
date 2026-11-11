# SkyAssist — Airport Management System (AMS)

SkyAssist is a single-page airport companion web app. Passengers can search and compare flights, view flight details and baggage allowances, explore an interactive airport terminal map, browse airport services, report or search lost items, and read a passenger guide. The UI supports light and dark themes and is responsive down to mobile widths.

This is a **frontend-only** project (no backend): data is bundled with the app and user state (theme, bookings, lost & found reports, login) is kept in the browser's `localStorage`.

**Live demo:** _add your deployed URL here after deploying (see [Deployment](#deployment))_

## Tech stack

React 19 · React Router 7 (`HashRouter`) · Zustand · React Hook Form + Zod · Tailwind-style utility CSS · Lucide icons · Sonner toasts · date-fns · Create React App

## Features

- Flight search (round trip / one way / multi-city), filtering and sorting
- Flight details: timeline, baggage allowance, fare summary and booking
- Interactive airport terminal map
- Airport services directory
- Lost & Found reporting and search
- Passenger guide (check-in, baggage, accessibility, transport)
- Sign up / log in with form validation
- Light / dark theme, accessible skip-link and keyboard navigation

## Setup instructions

Requirements: [Node.js](https://nodejs.org/) 18+ and npm.

```bash
git clone <your-repo-url>
cd <repo-folder>/client
npm install
npm start          # dev server at http://localhost:3000
```

Production build:

```bash
npm run build      # outputs to client/build
```

## Deployment

The app uses `HashRouter` and relative asset paths, so it works from any host or sub-path.

- **GitHub Pages** — push to `main`; the workflow in `.github/workflows/deploy.yml` builds and publishes. In the repo go to *Settings → Pages → Source: GitHub Actions*.
- **Netlify** — import the repo; `netlify.toml` is already configured (base `client`, publish `build`).
- **Vercel** — import the repo; `vercel.json` is already configured.

## Project structure

```
client/
  public/            static assets (images, icons, index.html)
  src/
    App.js           routes and layout
    components/      pages (Home, Flights, Details, Map, Services, Lost, Guide, Login, Signup) and shared UI
.github/workflows/   GitHub Pages deployment
```
