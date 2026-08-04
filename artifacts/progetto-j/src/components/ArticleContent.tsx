// Shared component — renders article body with heading and paragraph formatting.
// Used by the public article page and the admin preview.

export function ArticleContent({ contenuto }: { contenuto: string }) {
  const blocks = contenuto
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="mt-8">
      {blocks.map((block, i) => {
        const headingMatch = block.match(/^\*\*(.+)\*\*$/);
        if (headingMatch) {
          return (
            <h2
              key={i}
              className="font-serif text-[22px] uppercase tracking-wider text-primary bebas mt-10 mb-3 first:mt-0"
            >
              {headingMatch[1].trim()}
            </h2>
          );
        }
        return (
          <p
            key={i}
            className="font-sans text-[17px] text-foreground leading-[1.8] max-w-[65ch] mb-5"
          >
            {block}
          </p>
        );
      })}
    </div>
  );
}
