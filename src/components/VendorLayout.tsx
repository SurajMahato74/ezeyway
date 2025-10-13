import { ReactNode } from "react";
import VendorSidebar, { VendorBottomNav } from "./VendorNav";
import { VendorHeader } from "./VendorHeader";
import { GlobalOrderNotificationProvider } from "@/contexts/GlobalOrderNotificationContext";
import { MobileOrderAlert } from "./MobileOrderAlert";

interface VendorLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
}

export function VendorLayout({ children, title, subtitle, headerActions }: VendorLayoutProps) {

  return (
    <GlobalOrderNotificationProvider>
      <VendorSidebar>
        <div className="flex flex-col min-h-screen bg-gray-50 safe-area-inset max-w-full overflow-x-hidden">
          <MobileOrderAlert />
          <div className="pt-safe-top">
            <VendorHeader title={title} subtitle={subtitle} headerActions={headerActions} />
          </div>
          <main className="flex-1 pb-20 px-safe-x max-w-full overflow-x-hidden pt-14 sm:pt-16">
            {children}
          </main>
          <VendorBottomNav />
        </div>
      </VendorSidebar>
    </GlobalOrderNotificationProvider>
  );
}

// Wrapper component for individual vendor pages
interface VendorPageProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
    headerActions?: ReactNode;
}

export function VendorPage({ children, title, subtitle, headerActions }: VendorPageProps) {
  return (
    <VendorLayout title={title} subtitle={subtitle} headerActions={headerActions}>
      {children}
    </VendorLayout>
  );
}