import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface ImageIssue {
  src: string
  alt: string
  width: number | null
  height: number | null
  fileSize: number | null
  format: string
  issues: string[]
  severity: 'critical' | 'warning' | 'info'
  estimatedSavings: number
}

interface ScanResult {
  url: string
  totalImages: number
  issueCount: number
  images: ImageIssue[]
  performanceGrade: string
  estimatedLoadTimeReduction: number
  seoScore: number
  totalCurrentSize: number
  totalOptimizedSize: number
  recommendations: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: 'URL is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'Firecrawl not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('[SCAN] Scraping:', formattedUrl);

    // Scrape the page with Firecrawl
    const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['html', 'links', 'screenshot'],
        onlyMainContent: false,
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) {
      console.error('[SCAN] Firecrawl error:', scrapeData);
      return new Response(JSON.stringify({ success: false, error: scrapeData.error || 'Failed to scrape page' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const html = scrapeData.data?.html || scrapeData.html || '';
    const screenshot = scrapeData.data?.screenshot || scrapeData.screenshot || null;

    // Parse images from HTML
    const imgRegex = /<img[^>]*>/gi;
    const imgTags = html.match(imgRegex) || [];

    const images: ImageIssue[] = [];
    let totalCurrentSize = 0;
    let totalOptimizedSize = 0;

    for (const tag of imgTags) {
      const srcMatch = tag.match(/src=["']([^"']+)["']/i);
      const altMatch = tag.match(/alt=["']([^"']*?)["']/i);
      const widthMatch = tag.match(/width=["']?(\d+)["']?/i);
      const heightMatch = tag.match(/height=["']?(\d+)["']?/i);
      const loadingMatch = tag.match(/loading=["']([^"']+)["']/i);

      if (!srcMatch) continue;

      const src = srcMatch[1];
      // Skip data URIs, SVGs, and tracking pixels
      if (src.startsWith('data:') || src.endsWith('.svg') || src.includes('1x1')) continue;

      const alt = altMatch ? altMatch[1] : '';
      const width = widthMatch ? parseInt(widthMatch[1]) : null;
      const height = heightMatch ? parseInt(heightMatch[1]) : null;
      const loading = loadingMatch ? loadingMatch[1] : null;

      // Determine format from URL
      const urlLower = src.toLowerCase();
      let format = 'unknown';
      if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) format = 'jpeg';
      else if (urlLower.includes('.png')) format = 'png';
      else if (urlLower.includes('.webp')) format = 'webp';
      else if (urlLower.includes('.avif')) format = 'avif';
      else if (urlLower.includes('.gif')) format = 'gif';

      const issues: string[] = [];
      let severity: 'critical' | 'warning' | 'info' = 'info';

      // Check for missing alt text
      if (!alt || alt.trim() === '') {
        issues.push('Missing alt text (SEO impact)');
        severity = 'warning';
      }

      // Check for missing dimensions
      if (!width || !height) {
        issues.push('Missing width/height attributes (causes layout shift)');
        severity = 'warning';
      }

      // Check format
      if (format === 'png' || format === 'jpeg' || format === 'gif') {
        issues.push(`Using ${format.toUpperCase()} — convert to WebP/AVIF for 30-80% savings`);
        severity = 'critical';
      }

      // Check for lazy loading
      if (!loading || loading !== 'lazy') {
        issues.push('Missing lazy loading attribute');
        if (severity === 'info') severity = 'info';
      }

      // Check for oversized images
      if (width && width > 2000) {
        issues.push(`Image width ${width}px exceeds recommended 1920px`);
        severity = 'critical';
      }

      // Estimate file sizes based on format and dimensions
      const pixelCount = (width || 800) * (height || 600);
      let estimatedSize = 0;
      if (format === 'png') estimatedSize = pixelCount * 0.5;
      else if (format === 'jpeg') estimatedSize = pixelCount * 0.15;
      else if (format === 'gif') estimatedSize = pixelCount * 0.3;
      else if (format === 'webp') estimatedSize = pixelCount * 0.08;
      else estimatedSize = pixelCount * 0.2;

      // Cap estimates at reasonable sizes
      estimatedSize = Math.min(estimatedSize, 5_000_000);
      estimatedSize = Math.max(estimatedSize, 10_000);

      const optimizedSize = estimatedSize * 0.3; // ~70% savings typical
      const savings = estimatedSize - optimizedSize;

      totalCurrentSize += estimatedSize;
      totalOptimizedSize += optimizedSize;

      if (issues.length > 0) {
        images.push({
          src: src.length > 200 ? src.substring(0, 200) + '...' : src,
          alt,
          width,
          height,
          fileSize: Math.round(estimatedSize),
          format,
          issues,
          severity,
          estimatedSavings: Math.round(savings),
        });
      }
    }

    // Sort by severity (critical first)
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    images.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Calculate scores
    const criticalCount = images.filter(i => i.severity === 'critical').length;
    const warningCount = images.filter(i => i.severity === 'warning').length;
    const totalImages = imgTags.length;

    let gradeScore = 100;
    gradeScore -= criticalCount * 15;
    gradeScore -= warningCount * 5;
    gradeScore = Math.max(0, Math.min(100, gradeScore));

    let grade = 'A';
    if (gradeScore < 50) grade = 'F';
    else if (gradeScore < 60) grade = 'D';
    else if (gradeScore < 70) grade = 'C';
    else if (gradeScore < 80) grade = 'B';
    else if (gradeScore < 90) grade = 'A-';

    // Estimated load time reduction (simplified)
    const savingsBytes = totalCurrentSize - totalOptimizedSize;
    const loadTimeReduction = Math.round((savingsBytes / 1_000_000) * 0.8 * 10) / 10; // ~0.8s per MB on 3G

    // SEO score
    const imagesWithAlt = images.filter(i => !i.issues.some(iss => iss.includes('alt text'))).length;
    const seoScore = totalImages > 0 ? Math.round((1 - (images.filter(i => i.issues.some(iss => iss.includes('alt text'))).length / Math.max(totalImages, 1))) * 100) : 100;

    // Generate recommendations
    const recommendations: string[] = [];
    if (criticalCount > 0) recommendations.push(`Convert ${criticalCount} images to WebP/AVIF format for major size savings`);
    if (images.some(i => i.issues.some(iss => iss.includes('alt text')))) recommendations.push('Add descriptive alt text to all images for better SEO');
    if (images.some(i => i.issues.some(iss => iss.includes('dimensions')))) recommendations.push('Add width/height attributes to prevent Cumulative Layout Shift (CLS)');
    if (images.some(i => i.issues.some(iss => iss.includes('lazy')))) recommendations.push('Add loading="lazy" to below-the-fold images');
    if (images.some(i => i.issues.some(iss => iss.includes('exceeds')))) recommendations.push('Resize oversized images to max 1920px width');
    if (recommendations.length === 0) recommendations.push('Your images look well-optimized!');

    const result: ScanResult = {
      url: formattedUrl,
      totalImages,
      issueCount: images.length,
      images: images.slice(0, 50), // Limit to 50 images
      performanceGrade: grade,
      estimatedLoadTimeReduction: loadTimeReduction,
      seoScore,
      totalCurrentSize: Math.round(totalCurrentSize),
      totalOptimizedSize: Math.round(totalOptimizedSize),
      recommendations,
    };

    console.log('[SCAN] Complete:', { totalImages, issues: images.length, grade });

    return new Response(JSON.stringify({ success: true, data: result, screenshot }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SCAN] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Scan failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
