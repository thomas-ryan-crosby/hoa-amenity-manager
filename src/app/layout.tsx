import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CommunityProvider } from "@/components/providers/CommunityProvider";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanctuary Booking",
  description: "HOA Amenity Booking System",
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
            {children}
          </CommunityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
