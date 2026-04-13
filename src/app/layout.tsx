import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CommunityProvider } from "@/components/providers/CommunityProvider";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { PendingGate } from "@/components/PendingGate";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neighbri",
  description: "Amenity booking for your community",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <PostHogProvider>
          <AuthProvider>
            <CommunityProvider>
              <NavBar />
              <PendingGate>
                {children}
              </PendingGate>
              <Footer />
            </CommunityProvider>
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
