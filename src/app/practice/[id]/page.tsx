import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { itemsOf, moduleById, modules } from "@/lib/content";
import { Session, type SessionMode } from "@/components/Session";

const SPECIAL: Record<string, { mode: SessionMode; title: string }> = {
  daily: { mode: { kind: "daily" }, title: "Daily mix" },
  extra: { mode: { kind: "extra" }, title: "Extra practice" },
  mistakes: { mode: { kind: "mistakes" }, title: "Redo mistakes" },
};

export function generateStaticParams() {
  return [
    ...Object.keys(SPECIAL).map((id) => ({ id })),
    ...modules.filter((m) => itemsOf(m.id).length > 0).map((m) => ({ id: m.id })),
  ];
}

export async function generateMetadata({ params }: PageProps<"/practice/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: SPECIAL[id]?.title ?? moduleById(id)?.title ?? "Practice" };
}

export default async function PracticePage({ params }: PageProps<"/practice/[id]">) {
  const { id } = await params;
  const special = SPECIAL[id];
  const mod = moduleById(id);
  if (!special && (!mod || itemsOf(id).length === 0)) notFound();
  const mode: SessionMode = special?.mode ?? { kind: "module", id };
  return <Session mode={mode} />;
}
