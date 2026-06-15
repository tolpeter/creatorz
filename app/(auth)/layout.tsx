import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-start gap-6 overflow-x-hidden bg-[#f6f7f2] px-4 py-8 sm:justify-center sm:gap-8 sm:py-12">
      {/* Lime-os animált háttér-blob-ok (a landing-design szellemében) */}
      <div
        aria-hidden
        className="animate-blob pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-accent/25 blur-3xl"
      />
      <div
        aria-hidden
        className="animate-blob pointer-events-none absolute -right-32 top-1/3 h-[26rem] w-[26rem] rounded-full bg-accent/20 blur-3xl"
        style={{ animationDelay: "4s" }}
      />
      <div
        aria-hidden
        className="animate-blob pointer-events-none absolute -bottom-40 left-1/3 h-[24rem] w-[24rem] rounded-full bg-[#a3e635]/15 blur-3xl"
        style={{ animationDelay: "8s" }}
      />

      {/* Finom rácsminta-overlay a háttéren */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
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

      <Link href="/" className="relative z-10">
        <Logo className="text-2xl" />
      </Link>
      <div className="relative z-10 flex w-full justify-center">{children}</div>
    </div>
  );
}
