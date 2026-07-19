import { Helmet } from "react-helmet";

const SITE_URL = "https://pixelsqueeze.app";
const DEFAULT_OG = `${SITE_URL}/og-image.png`;

export interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article" | "product";
  schema?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

/**
 * Reusable SEO head component. Handles title, meta description,
 * canonical URL, Open Graph, Twitter Cards, and JSON-LD schema.
 */
export const SEO = ({
  title,
  description,
  path = "/",
  image = DEFAULT_OG,
  type = "website",
  schema,
  noindex = false,
}: SEOProps) => {
  const url = `${SITE_URL}${path}`;
  const schemas = Array.isArray(schema) ? schema : schema ? [schema] : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="PixelSqueeze" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
