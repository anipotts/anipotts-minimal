import SignalsBar from "./SignalsBar";

export default function Footer() {
  return (
    <footer className="w-full mt-24 pb-12">
      <SignalsBar />
      <div className="text-xs text-gray-600 font-mono">
        © {new Date().getFullYear()} ani potts
      </div>
    </footer>
  );
}
