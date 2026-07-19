import { marked } from "marked";

export function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export interface MarkdownHeading {
  id: string;
  text: string;
}

export function extractHeadings(markdown: string, depth = 2): MarkdownHeading[] {
  if (!markdown) return [];
  const tokens = marked.lexer(markdown);
  return tokens
    .filter((t): t is ReturnType<typeof marked.lexer>[number] & { type: "heading"; depth: number; text: string } =>
      t.type === "heading" && (t as any).depth === depth)
    .map((t) => ({ id: slugify(t.text), text: t.text }));
}

function withHeadingIds(html: string, headings: MarkdownHeading[], depth = 2): string {
  let i = 0;
  const tag = `h${depth}`;
  return html.replace(new RegExp(`<${tag}>`, "g"), () => `<${tag} id="${headings[i++]?.id ?? ""}">`);
}

export default function MarkdownContent({ markdown, maxWidth = "640px" }: { markdown: string; maxWidth?: string }) {
  if (!markdown) return null;
  const html = marked.parse(markdown, { async: false }) as string;
  const headings = extractHeadings(markdown, 2);
  const withIds = withHeadingIds(html, headings, 2);

  return (
    <div
      className="pk-markdown"
      style={{ width: "100%", maxWidth, fontSize: "15px", lineHeight: 1.75, color: "var(--color-text-secondary)" }}
      dangerouslySetInnerHTML={{ __html: withIds }}
    />
  );
}
