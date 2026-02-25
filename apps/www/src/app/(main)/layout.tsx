import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/**
 * Layout for all main site routes (anipotts.com).
 * Wraps each page with Navbar and Footer.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-grow w-full">
      <Navbar />
      <div id="main-content" className="flex-grow">
        {children}
      </div>
      <Footer />
    </div>
  );
}
