# JetlyXO – AI-Powered Travel Booking Platform

A modern, responsive travel booking UI with a premium dark navy theme, glassmorphism, and AI-focused features.

## Tech Stack

- **Next.js 14** (React) – App Router
- **TailwindCSS** – Styling
- **Framer Motion** – Animations

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Features

- **Hero** – Full-width hero with “Plan Your Perfect Journey”, animated planes, gradient overlay, Search Flights CTA
- **Services** – Horizontal scroll cards: Flights, Hotels, Trains, Buses, Visa, Holidays, Forex, Insurance, **JetlyCargo** (orange glow + NEW badge)
- **Flight Search** – One Way / Round Trip / Multi City tabs; From, To, Departure, Return, Travellers, Cabin Class; Search Flights CTA; AI Smart Results after search
- **AI Smart Picks** – Cheapest, Fastest, Best value cards with “JetlyXO AI Pick” badge
- **AI Price Prediction** – Tip card (e.g. “Prices may increase… Book now to save ₹850” or “Prices may drop… Consider waiting”)
- **Flight Results** – Sort (Cheapest, Fastest, Best, Departure, Airline); filters (Airlines, Stops, Price range, Departure/Duration); glass cards with Book
- **AI Travel Assistant** – Floating “JetlyXO AI ✈️” button; chat panel with welcome message, quick actions (Find Cheap Flights, Best Destinations, Travel Deals, Visa Help)
- **Trending Destinations** – Dubai, Goa, Bangkok, Bali, Singapore, Maldives image cards with hover
- **Deals** – Today’s Best Flight Deals (Delhi→Dubai, Mumbai→Bangkok, Hyderabad→Singapore) with Book
- **Features** – Best Prices, Secure Payments, 24/7 Support with subtle float animation
- **Trust** – Trusted by travelers, Secure payment, Real-time booking
- **Footer** – About, Contact, Support, Terms, Privacy; logo and social icons

## Design

- Dark navy theme, glassmorphism, soft glows, rounded corners, Framer Motion animations
- Responsive (mobile and desktop), performance-conscious, SEO-friendly metadata

## Project structure

```
src/
  app/
    globals.css
    layout.tsx
    page.tsx
  components/
    Header.tsx
    Hero.tsx
    Services.tsx
    FlightSearch.tsx
    AIAssistant.tsx
    TrendingDestinations.tsx
    Deals.tsx
    Features.tsx
    Trust.tsx
    Footer.tsx
```
