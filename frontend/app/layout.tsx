import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Triply AI — Intelligent Indian Travel Planner',
  description: 'Plan your perfect Indian trip with AI-powered multi-agent itinerary generation. Get real-time transport options, hotel recommendations, food guides, safety alerts, and crowd heatmaps — all in one place.',
  keywords: 'travel planner india, AI trip planner, itinerary generator, india travel, budget travel, triply',
  openGraph: {
    title: 'Triply AI — Your Intelligent Indian Travel Planner',
    description: 'Generate a complete, AI-powered travel itinerary for any destination in India.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
