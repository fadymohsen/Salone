import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-md mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 font-serif font-bold text-primary text-lg">
            <Sparkles size={15} aria-hidden="true" />
            GlowBook
          </Link>
          <Link href="/book" className="text-xs font-semibold text-primary bg-pastel-pink px-4 py-2 rounded-full hover:bg-primary hover:text-white transition-colors duration-150 cursor-pointer">
            Book Now
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
