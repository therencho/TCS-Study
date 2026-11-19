import katex from "katex";

/**
 * Renders text with optional inline math between $…$ (KaTeX). Plain Unicode
 * (ε, ∅, Σ, ⊆ …) is shown as is. Line breaks in the source are kept.
 */
export function Rich({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.startsWith("$") && p.endsWith("$") && p.length > 2) {
          const html = katex.renderToString(p.slice(1, -1), { throwOnError: false });
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
        }
        return (
          <span key={i} className="whitespace-pre-line">
            {p}
          </span>
        );
      })}
    </span>
  );
}
