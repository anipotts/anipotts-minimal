import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/**
 * Layout for the main site routes (anipotts.com).
 * Includes Navbar and Footer, unlike subdomain routes.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
