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
      <main
        id="main-content"
        className="main-content flex-grow pt-6 pb-4 md:pt-10 md:pb-6"
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
