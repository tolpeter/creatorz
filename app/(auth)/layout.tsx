import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-start gap-6 bg-[#f6f7f2] px-4 py-8 sm:justify-center sm:gap-8 sm:py-12">
      {/* Háttér-dekoráció: FIXED + overflow-hidden konténerben, hogy NE
          befolyásolja a dokumentum magasságát és NE okozzon scroll-ugrást
          mobile-on (az animált blob-ok translate-je egyébként megnövelné a
          görgethető területet, amitől a böngésző visszaugrik a tetejére). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        {/* Lime-os animált háttér-blob-ok (a landing-design szellemében) */}
        <div className="animate-blob absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-accent/25 blur-3xl" />
        <div
          className="animate-blob absolute -right-32 top-1/3 h-[26rem] w-[26rem] rounded-full bg-accent/20 blur-3xl"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="animate-blob absolute -bottom-40 left-1/3 h-[24rem] w-[24rem] rounded-full bg-[#a3e635]/15 blur-3xl"
          style={{ animationDelay: "8s" }}
        />

        {/* Finom rácsminta-overlay a háttéren */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(10,10,10,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          }}
        />
      </div>

      <Link href="/" className="relative z-10">
        <Logo className="text-2xl" />
      </Link>
      <div className="relative z-10 flex w-full justify-center">{children}</div>
    </div>
  );
}
