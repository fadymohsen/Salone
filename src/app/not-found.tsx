import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-pastel-pink flex items-center justify-center mx-auto mb-6">
          <Sparkles size={36} className="text-primary" strokeWidth={1.5} />
        </div>

        <p className="font-serif text-8xl font-bold text-primary mb-2">404</p>
        <h1 className="font-serif text-2xl font-bold text-glam-text mb-3">Page Not Found</h1>
        <p className="text-sm text-muted leading-relaxed mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/"
            className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3.5 rounded-2xl shadow-md shadow-primary/25 hover:bg-secondary transition-all duration-200 cursor-pointer text-sm active:scale-[0.97]">
            <Sparkles size={14} aria-hidden="true" />
            Go Home
          </Link>
          <Link href="/en/book"
            className="inline-flex items-center justify-center bg-white border border-border text-glam-text font-bold px-6 py-3.5 rounded-2xl hover:border-primary hover:text-primary transition-all duration-200 cursor-pointer text-sm">
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}
