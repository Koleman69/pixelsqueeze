export interface SeoMetadata {
  slug: string;
  filename: string;
  title: string;
  altText: string;
  caption: string;
  description: string;
  keywords: string[];
  subject: string;
  category: string;
  pinterestDescription: string;
  twitterAltText: string;
  ogTitle: string;
  ogDescription: string;
  schema: Record<string, unknown>;
}
