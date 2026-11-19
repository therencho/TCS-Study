"use client";

import { parseTemplate, type ClozeItem } from "@/lib/items";
import type { ClozeResponse } from "@/lib/check";
import { Rich } from "../Rich";
import { type BlockProps, stateClass } from "./shared";

export function Cloze({ item, value, onChange, result }: BlockProps<ClozeItem, ClozeResponse>) {
  const parts = parseTemplate(item.template);
  return (
    <p className="text-[1.05rem] leading-[2.6rem]">
      {parts.map((p, i) => {
        if (typeof p === "string") return <Rich key={i} text={p} />;
        const gi = p - 1;
        const v = value[gi] ?? "";
        return (
          <input
            key={i}
            aria-label={`Blank ${p}`}
            value={v}
            disabled={!!result}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              const next = [...value];
              next[gi] = e.target.value;
              onChange(next);
            }}
            style={{ width: `${Math.max(6, v.length + 2)}ch` }}
            className={`mx-1 inline-block h-9 rounded-md border border-line bg-card px-2 align-middle text-base text-ink outline-none focus:border-accent ${stateClass(result, result?.parts[gi])}`}
          />
        );
      })}
    </p>
  );
}
