import { parseTemplate, type Accept, type Item } from "@/lib/items";
import { gridCell } from "@/lib/check";
import { Rich } from "./Rich";

const first = (a: Accept) => (Array.isArray(a) ? a[0] : a);

/** The model answer of an item, shown after a wrong attempt. */
export function KeyView({ item }: { item: Item }) {
  switch (item.block) {
    case "cloze":
    case "chip-cloze": {
      const keys = item.block === "cloze" ? item.answers : item.answer;
      return (
        <p className="leading-relaxed">
          {parseTemplate(item.template).map((p, i) =>
            typeof p === "string" ? (
              <Rich key={i} text={p} className="sym" />
            ) : (
              <mark key={i} className="rounded bg-good-soft px-1 font-medium text-good">
                <Rich text={first(keys[p - 1])} className="sym" />
              </mark>
            ),
          )}
        </p>
      );
    }
    case "match":
      return (
        <ul className="space-y-1">
          {item.pairs.map((p) => (
            <li key={p.left} className="flex gap-2">
              <Rich text={p.left} className="sym" />
              <span className="text-muted">→</span>
              <Rich text={p.right} className="sym font-medium" />
            </li>
          ))}
        </ul>
      );
    case "order":
      return (
        <div>
          <ol className="list-decimal space-y-1 pl-5">
            {item.steps.map((s) => (
              <li key={s}>
                <Rich text={s} />
              </li>
            ))}
          </ol>
          {item.before && <p className="mt-2 text-sm text-muted">Other orders that respect the dependencies also count.</p>}
          {item.distractors.length > 0 && (
            <p className="mt-2 text-sm text-muted">
              Not part of the proof: {item.distractors.map((d, i) => (
                <span key={d}>
                  {i > 0 && " · "}“<Rich text={d} />”
                </span>
              ))}
            </p>
          )}
        </div>
      );
    case "buckets":
      return (
        <div className="space-y-2">
          {item.buckets.map((b) => (
            <div key={b}>
              <div className="text-sm font-medium">
                <Rich text={b} className="sym" />
              </div>
              <div className="text-muted">
                {item.items
                  .filter((i) => i.bucket === b)
                  .map((i, k) => (
                    <span key={i.text}>
                      {k > 0 && " · "}
                      <Rich text={i.text} className="sym" />
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      );
    case "grid":
      return (
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-x-3 border-spacing-y-1 text-sm">
            <thead>
              <tr>
                <th />
                {item.columns.map((c) => (
                  <th key={c} className="font-medium whitespace-nowrap">
                    <Rich text={c} className="sym" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {item.rows.map((r, ri) => (
                <tr key={r}>
                  <th className="text-left font-medium whitespace-nowrap">
                    <Rich text={r} className="sym" />
                  </th>
                  {item.columns.map((_, ci) => {
                    const c = gridCell(item, ri, ci);
                    return (
                      <td key={ci} className="text-center">
                        <Rich text={c.kind === "given" ? c.text : first(c.accept)} className="sym" />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "tf":
      return (
        <p>
          <span className="font-medium">{item.answer ? "True" : "False"}.</span>{" "}
          <Rich text={item.reasons.find((r) => r.correct)!.text} />
        </p>
      );
  }
}
