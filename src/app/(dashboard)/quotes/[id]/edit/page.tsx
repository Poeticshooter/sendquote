import { redirect } from "next/navigation";

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/quotes/${id}`);
}
