// Vendor detail + decision panel + history. Owned by task 02-admin-dashboard.
export const metadata = { title: "Vendor detail" };

export default async function AdminVendorDetailPage({ params }: PageProps<"/admin/vendors/[id]">) {
  const { id } = await params;
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Vendor detail</h1>
      <p className="text-muted-foreground">TODO: task 02-admin-dashboard — {id}</p>
    </main>
  );
}
