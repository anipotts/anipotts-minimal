import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/**
 * Layout for the main site routes (anipotts.com).
 * Includes Navbar and Footer, unlike subdomain routes.
 * Footer is pinned to bottom via flex-grow on content area.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-grow w-full">
      <Navbar />
      <div className="flex-grow">
        {children}
      </div>
      <Footer />
    </div>
  );
}
