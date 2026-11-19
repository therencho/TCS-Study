"use client";

import type { GridItem } from "@/lib/items";
import { gridCell, type GridResponse } from "@/lib/check";
import { Rich } from "../Rich";
import { type BlockProps, stateClass } from "./shared";

export function Grid({ item, value, onChange, result }: BlockProps<GridItem, GridResponse>) {
  // map (row, col) of answer cells to their index in result.parts
  let k = 0;
  const partIndex = item.rows.map((_, ri) =>
    item.columns.map((_, ci) => (gridCell(item, ri, ci).kind === "answer" ? k++ : -1)),
  );
  const setCell = (ri: number, ci: number, v: string) => {
    const next = value.map((r) => [...r]);
    next[ri][ci] = v;
    onChange(next);
  };

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="border-separate border-spacing-1 text-[0.95rem]">
        <thead>
          <tr>
            <th />
            {item.columns.map((c) => (
              <th key={c} className="px-1 pb-1 text-center font-medium whitespace-nowrap">
                <Rich text={c} className="sym" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {item.rows.map((r, ri) => (
            <tr key={r}>
              <th className="pr-2 text-left font-medium whitespace-nowrap">
                <Rich text={r} className="sym" />
              </th>
              {item.columns.map((_, ci) => {
                const cell = gridCell(item, ri, ci);
                if (cell.kind === "given")
                  return (
                    <td key={ci} className="rounded-md bg-paper px-2 py-1.5 text-center text-muted">
                      <Rich text={cell.text} className="sym" />
                    </td>
                  );
                const pi = partIndex[ri][ci];
                const v = value[ri]?.[ci] ?? "";
                const cls = `h-10 w-full min-w-16 rounded-md border border-line bg-card px-2 text-center text-base outline-none focus:border-accent ${stateClass(result, result?.parts[pi])}`;
                return (
                  <td key={ci}>
                    {cell.options ? (
                      <select
                        aria-label={`${r}, ${item.columns[ci]}`}
                        value={v}
                        disabled={!!result}
                        onChange={(e) => setCell(ri, ci, e.target.value)}
                        className={cls}
                      >
                        <option value="">·</option>
                        {cell.options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        aria-label={`${r}, ${item.columns[ci]}`}
                        value={v}
                        disabled={!!result}
                        autoCapitalize="off"
                        autoCorrect="off"
                        autoComplete="off"
                        spellCheck={false}
                        onChange={(e) => setCell(ri, ci, e.target.value)}
                        className={cls}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
