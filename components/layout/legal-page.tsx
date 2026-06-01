export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl space-y-4 py-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">{title}</h1>
        {updated && <p className="text-sm text-muted-foreground">Utolsó frissítés: {updated}</p>}
      </header>
      <div className="prose prose-sm dark:prose-invert max-w-none space-y-3 text-sm leading-relaxed [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:my-1 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}
