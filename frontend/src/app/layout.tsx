import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "@livekit/components-styles";
import Chatbot from "@/components/features/Chatbot";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { SocketProvider } from "@/context/SocketContext";

export const metadata: Metadata = {
  title: "ArogyaMitra - SwasthSaathi AI",
  description: "AI-Powered Government Hospital Scheduler",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <SocketProvider>
              {children}
            </SocketProvider>
            <Chatbot />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
