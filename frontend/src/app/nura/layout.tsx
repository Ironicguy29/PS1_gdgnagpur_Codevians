import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit, Cormorant_Garamond } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nura Health - Optimal Human Performance",
  description: "A high-fidelity biological research lab and avant-garde clinical boutique landing page.",
};

export default function NuraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${plusJakartaSans.variable} ${outfit.variable} ${cormorantGaramond.variable} nura-theme min-h-screen relative`}>
      <style dangerouslySetInnerHTML={{ __html: `
        .nura-theme {
          --color-moss: #2E4036;
          --color-clay: #CC5833;
          --color-cream: #F2F0E9;
          --color-charcoal: #1A1A1A;
          
          background-color: var(--color-cream);
          color: var(--color-charcoal);
          font-family: var(--font-plus-jakarta), sans-serif;
        }

        .font-sans-nura {
          font-family: var(--font-plus-jakarta), sans-serif;
        }

        .font-outfit {
          font-family: var(--font-outfit), sans-serif;
        }

        .font-serif-nura {
          font-family: var(--font-cormorant), serif;
        }

        /* Smoothing and rendering optimizations */
        .nura-theme * {
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}} />
      
      {/* Global CSS Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-5 select-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="nura-noise">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.75" 
              numOctaves="3" 
              stitchTiles="stitch" 
            />
            <feColorMatrix 
              type="matrix" 
              values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.08 0" 
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#nura-noise)" />
        </svg>
      </div>

      {children}
    </div>
  );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
