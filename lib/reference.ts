// Reference number allocation: VR-YYYY-NNNN, sequential per year.
// Must be called inside the same transaction that creates the Vendor so two
// concurrent submissions cannot receive the same number.
import type { Prisma } from "@/lib/generated/prisma/client";

export function formatReferenceNo(year: number, seq: number): string {
  return `VR-${year}-${String(seq).padStart(4, "0")}`;
}

/**
 * Allocates the next reference number for the given year using a row lock on
 * the latest vendor of that year. `tx` must be a transaction client.
 */
export async function nextReferenceNo(
  tx: Prisma.TransactionClient,
  now: Date = new Date(),
): Promise<string> {
  const year = now.getFullYear();
  const prefix = `VR-${year}-`;
  // Serialise allocations for this year.
  await tx.$executeRawUnsafe(
    `SELECT pg_advisory_xact_lock(hashtext($1))`,
    prefix,
  );
  const latest = await tx.vendor.findFirst({
    where: { referenceNo: { startsWith: prefix } },
    orderBy: { referenceNo: "desc" },
    select: { referenceNo: true },
  });
  const lastSeq = latest ? Number(latest.referenceNo.slice(prefix.length)) : 0;
  return formatReferenceNo(year, lastSeq + 1);
}
