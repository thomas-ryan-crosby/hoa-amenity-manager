import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CommunityProvider } from "@/components/providers/CommunityProvider";
import { PendingGate } from "@/components/PendingGate";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neighbri",
  description: "Amenity booking for your community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <CommunityProvider>
            <NavBar />
            <PendingGate>
              {children}
            </PendingGate>
          </CommunityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
