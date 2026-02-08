import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/**
 * Layout for subdomain routes (thoughts, dev, links, etc.).
 * Uses the same Navbar and Footer as the main site for consistency.
 */
export default function SubdomainLayout({
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
