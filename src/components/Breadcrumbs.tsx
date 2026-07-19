import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { Helmet } from "react-helmet";

export interface Crumb {
  label: string;
  path?: string; // omit for current page
}

interface BreadcrumbsProps {
  items: Crumb[];
  className?: string;
}

const SITE_URL = "https://pixelsqueeze.app";

/**
 * Accessible breadcrumb trail with BreadcrumbList JSON-LD.
 * Always prepends Home. The last item is rendered as the current page.
 */
export const Breadcrumbs = ({ items, className = "" }: BreadcrumbsProps) => {
  const trail: Crumb[] = [{ label: "Home", path: "/" }, ...items];

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: `${SITE_URL}${c.path ?? ""}`,
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <nav aria-label="Breadcrumb" className={`text-sm ${className}`}>
        <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
          {trail.map((c, i) => {
            const isLast = i === trail.length - 1;
            return (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />}
                {isLast || !c.path ? (
                  <span aria-current="page" className="text-foreground font-medium">
                    {i === 0 ? <Home className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" /> : null}
                    {c.label}
                  </span>
                ) : (
                  <Link to={c.path} className="hover:text-primary transition-colors inline-flex items-center">
                    {i === 0 ? <Home className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" /> : null}
                    {c.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumbs;
