import Link from "next/link";
import { itemsOf, modules } from "@/lib/content";
import { DailyCard, ModuleProgress } from "@/components/Stats";
import { SignInNudge } from "@/components/auth/AccountButton";
import { authEnabledClient } from "@/lib/authConfig";

export default function Home() {
  const phase1 = modules.filter((m) => m.phase === 1);
  const phase2 = modules.filter((m) => m.phase === 2);
  return (
    <div className="space-y-8">
      <p className="text-[0.95rem] leading-relaxed text-muted">
        Short, self-checking practice for Theoretical Computer Science I. Every answer is checked by a fixed key,
        with the slide reference and an explanation.
      </p>

      <div className="space-y-3">
        <DailyCard />
        {authEnabledClient() && <SignInNudge />}
      </div>

      <section>
        <h2 className="mb-1 font-serif text-xl">Phase 1 · Basics</h2>
        <p className="mb-3 text-sm text-muted">Definitions, statements, closure facts and the lecture algorithms.</p>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
          {phase1.map((m) => {
            const n = itemsOf(m.id).length;
            const body = (
              <>
                <div className="flex items-baseline gap-3">
                  <span className="w-8 shrink-0 font-mono text-xs text-muted">{m.code}</span>
                  <span className="min-w-0 flex-1 font-medium">{m.title}</span>
                  <span className="text-xs text-muted">{n > 0 ? `${n} items` : "soon"}</span>
                </div>
                <div className="pl-11">
                  <div className="text-xs text-muted">{m.refs}</div>
                  <ModuleProgress moduleId={m.id} />
                </div>
              </>
            );
            return (
              <li key={m.id}>
                {n > 0 ? (
                  <Link href={`/practice/${m.id}`} className="block px-4 py-3 transition hover:bg-paper">
                    {body}
                  </Link>
                ) : (
                  <div className="px-4 py-3 opacity-55">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-1 font-serif text-xl">Phase 2 · Advanced</h2>
        <p className="mb-3 text-sm text-muted">Reductions, rigorous proofs and constructions. Coming after Phase 1.</p>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {phase2.map((m) => (
            <li key={m.id} className="rounded-xl border border-dashed border-line px-4 py-3 opacity-70">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xs text-muted">{m.code}</span>
                <span className="font-medium">{m.title}</span>
              </div>
              <div className="mt-0.5 text-xs text-muted">{m.blurb}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
