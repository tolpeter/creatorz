/** Blog tartalom blokkjai — az AI ezt a struktúrát adja vissza JSON-ben. */
export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "cta"; text: string; href: string; label: string };

export type BlogFaq = { q: string; a: string };

/** Az AI-tól várt nyers JSON struktúra. */
export type GeneratedPost = {
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  keywords: string[];
  tags: string[];
  coverPrompt: string;
  coverAlt: string;
  readMinutes: number;
  blocks: BlogBlock[];
  faq: BlogFaq[];
};
