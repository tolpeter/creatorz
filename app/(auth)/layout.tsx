import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 overflow-x-hidden px-4 py-12">
      <Link href="/">
        <Logo className="text-2xl" />
      </Link>
      {children}
    </div>
  );
}
