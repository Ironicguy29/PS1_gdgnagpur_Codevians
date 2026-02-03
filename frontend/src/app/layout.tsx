import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Chatbot from "@/components/features/Chatbot";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ToastProvider } from "@/components/providers/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ArogyaMitra - SwasthSaathi AI",
  description: "AI-Powered Government Hospital Scheduler",
};

import { SocketProvider } from "@/context/SocketContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
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
            <ThemeToggle />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
