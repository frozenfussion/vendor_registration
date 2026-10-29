// Public status page. Owned by task 01-registration-form.
export const metadata = { title: "Application status" };

export default async function StatusPage({ params }: PageProps<"/status/[ref]">) {
  const { ref } = await params;
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Application status</h1>
      <p className="text-muted-foreground">TODO: task 01-registration-form — {ref}</p>
    </main>
  );
}
