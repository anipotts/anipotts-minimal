import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-grow w-full">
      <Navbar />
      <main id="main-content" className="flex-grow py-2 md:py-4">
        {children}
      </main>
      <Footer />
    </div>
  );
}
