import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let current: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    current = await getCurrentUser();
  } catch {
    current = null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isLoggedIn={Boolean(current?.dbUser)} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
