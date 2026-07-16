/**
 * SEO meta builder — keeps route head() blocks DRY and consistent.
 *
 * Usage:
 *   head: () => ({ meta: buildMeta({ title: "...", description: "..." }) })
 */

export interface MetaInput {
  title: string;
  description: string;
  /** Absolute https URL. Only set on leaf routes (never __root). */
  image?: string;
  /** Defaults to "website". Use "article" for content pages. */
  ogType?: string;
  /** Defaults to "summary_large_image" when image present, else "summary". */
  twitterCard?: "summary" | "summary_large_image";
}

export type MetaTag =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string };

export function buildMeta(input: MetaInput): MetaTag[] {
  const {
    title,
    description,
    image,
    ogType = "website",
    twitterCard = image ? "summary_large_image" : "summary_large_image",
  } = input;

  const tags: MetaTag[] = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: ogType },
    { name: "twitter:card", content: twitterCard },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];

  if (image) {
    tags.push(
      { property: "og:image", content: image },
      { name: "twitter:image", content: image },
    );
  }

  return tags;
}
