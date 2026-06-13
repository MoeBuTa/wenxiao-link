import { Link } from "@chakra-ui/react";
import type { ReactNode } from "react";

// Allowlist mirroring react-markdown's defaultUrlTransform: only safe
// schemes; relative and protocol-relative URLs (no scheme) are allowed.
// Blocks javascript:/data:/vbscript: so a crafted news/link can't run code.
function isSafeHref(url: string): boolean {
  const colon = url.indexOf(":");
  const slash = url.indexOf("/");
  const q = url.indexOf("?");
  const hash = url.indexOf("#");
  if (
    colon === -1 ||
    (slash !== -1 && colon > slash) ||
    (q !== -1 && colon > q) ||
    (hash !== -1 && colon > hash)
  ) {
    return true; // no scheme before the first separator → relative
  }
  const scheme = url.slice(0, colon).toLowerCase();
  return ["http", "https", "mailto", "tel"].includes(scheme);
}

// Renders the only markdown the one-line content fields use — [text](url) —
// without pulling a full markdown pipeline into every news item.
export function renderInlineMd(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (isSafeHref(match[2])) {
      nodes.push(
        <Link key={key++} href={match[2]} isExternal fontWeight="500">
          {match[1]}
        </Link>,
      );
    } else {
      // Unsafe scheme — render the label as plain text, drop the href.
      nodes.push(match[1]);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}
