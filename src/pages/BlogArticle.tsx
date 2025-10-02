import { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowLeft, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const blogArticles = [
  {
    id: 'best-image-compression-tools-2025',
    title: 'Best Image Compression Tools in 2025: Complete Guide',
    description: 'Discover the top image compression tools that maintain quality while reducing file sizes by up to 80%. Compare features, pricing, and performance.',
    content: `
      <p>Image compression is essential for modern web development, digital marketing, and content creation. With websites loading 53% of mobile users abandoning sites that take longer than 3 seconds to load, optimizing your images is no longer optional.</p>
      
      <h2>Why Image Compression Matters</h2>
      <p>Large image files significantly impact website performance, SEO rankings, and user experience. Proper image compression can reduce file sizes by 60-80% while maintaining visual quality, leading to faster page loads and better conversion rates.</p>
      
      <h2>Top Image Compression Techniques</h2>
      <p><strong>Lossy Compression:</strong> Achieves higher compression ratios by removing some image data. Perfect for web images where slight quality reduction is acceptable. Tools like JPEG optimization can reduce file sizes by 70-90%.</p>
      
      <p><strong>Lossless Compression:</strong> Reduces file size without quality loss by removing metadata and optimizing encoding. Ideal for professional photography and archival purposes.</p>
      
      <h2>Professional Image Optimization Tools</h2>
      <p>Modern compression tools offer AI-powered optimization that intelligently balances quality and file size. Features to look for include batch processing, custom DPI settings, dimension control, and format conversion.</p>
      
      <h2>Best Practices for Web Images</h2>
      <ul>
        <li>Use WebP format for modern browsers (30% smaller than JPEG)</li>
        <li>Optimize images to exact display dimensions</li>
        <li>Set DPI to 72 for web use (screen resolution)</li>
        <li>Compress images before uploading to your website</li>
        <li>Enable lazy loading for below-the-fold images</li>
      </ul>
      
      <h2>Impact on SEO and Core Web Vitals</h2>
      <p>Google's Core Web Vitals include Largest Contentful Paint (LCP), which is heavily influenced by image optimization. Compressed images improve LCP scores, directly affecting search rankings and user experience metrics.</p>
    `,
    publishDate: '2025-01-15',
    readTime: '8 min read',
    category: 'Tools & Software',
    keywords: ['image compression', 'web optimization', 'SEO', 'page speed'],
  },
  {
    id: 'reduce-photo-size-without-losing-quality',
    title: 'How to Reduce Photo Size Without Losing Quality: Expert Guide',
    description: 'Learn professional techniques to compress photos while maintaining stunning visual quality. Step-by-step guide with real examples and results.',
    content: `
      <p>Reducing photo size without sacrificing quality is a critical skill for photographers, web developers, and content creators. This comprehensive guide covers proven techniques and tools for optimal image compression.</p>
      
      <h2>Understanding Image Quality vs File Size</h2>
      <p>The key to successful compression is finding the sweet spot between visual quality and file size. Human perception studies show that JPEG quality settings of 75-85% produce visually identical results to 100% quality while reducing file size by 50-70%.</p>
      
      <h2>Smart Compression Techniques</h2>
      <p><strong>Quality Settings:</strong> For web use, 80-85% quality provides excellent results. For print materials, use 90-95% quality. Social media platforms automatically compress images, so using 75-80% quality before upload prevents double compression artifacts.</p>
      
      <p><strong>Resolution Optimization:</strong> Match image dimensions to display size. A 1920x1080 image displayed at 960x540 wastes bandwidth and storage. Resize images to their actual display dimensions for optimal performance.</p>
      
      <h2>Advanced Compression Methods</h2>
      <p>AI-powered compression analyzes each image to determine optimal settings. These tools identify areas where quality can be reduced without visible impact, achieving up to 80% compression while maintaining perceived quality.</p>
      
      <h2>Format Selection for Best Results</h2>
      <p><strong>JPEG:</strong> Best for photographs and complex images with gradients. Excellent compression for web use.</p>
      <p><strong>PNG:</strong> Ideal for graphics, logos, and images with transparency. Lossless compression maintains exact quality.</p>
      <p><strong>WebP:</strong> Modern format with 25-35% better compression than JPEG. Supported by all major browsers since 2020.</p>
      
      <h2>Bulk Photo Compression Workflow</h2>
      <p>Professional workflows involve batch processing with consistent settings. Set up presets for different use cases: web thumbnails, full-size web images, social media posts, and email attachments. This ensures consistency and saves time.</p>
      
      <h2>Testing and Validation</h2>
      <p>Always compare compressed images side-by-side with originals. Check for compression artifacts like banding, blockiness, or color shifts. Validate file size reductions and maintain backup copies of originals.</p>
    `,
    publishDate: '2025-01-10',
    readTime: '10 min read',
    category: 'Tutorial',
    keywords: ['photo compression', 'image quality', 'reduce file size', 'photography'],
  },
  {
    id: 'jpeg-vs-png-vs-webp-compression-comparison',
    title: 'JPEG vs PNG vs WebP: Complete Compression Format Guide',
    description: 'Comprehensive comparison of image formats. Learn which format to use for maximum compression, quality, and browser compatibility in 2025.',
    content: `
      <p>Choosing the right image format dramatically impacts file size, quality, and website performance. This guide compares JPEG, PNG, and WebP formats with real-world examples and recommendations.</p>
      
      <h2>JPEG: The Universal Standard</h2>
      <p>JPEG remains the most widely used format for photographs and complex images. Lossy compression achieves excellent file size reduction while maintaining visual quality. Modern JPEG encoders can reduce file sizes by 70-90% compared to uncompressed images.</p>
      
      <p><strong>Best Use Cases:</strong> Photographs, product images, backgrounds, and any image with gradients or complex color patterns. Not suitable for images requiring transparency or sharp text.</p>
      
      <h2>PNG: Quality Without Compromise</h2>
      <p>PNG uses lossless compression, preserving exact image quality. Supports transparency (alpha channel), making it essential for logos, icons, and graphics. File sizes are typically 3-5x larger than equivalent JPEG files.</p>
      
      <p><strong>Optimal Applications:</strong> Logos, icons, graphics with text, images requiring transparency, and screenshots. Use PNG-8 for simple graphics and PNG-24 for complex images with transparency.</p>
      
      <h2>WebP: The Modern Winner</h2>
      <p>Developed by Google, WebP provides superior compression compared to both JPEG and PNG. Supports both lossy and lossless compression, plus transparency. Typically 25-35% smaller than JPEG and 26% smaller than PNG for equivalent quality.</p>
      
      <p><strong>Why WebP Matters:</strong> Faster page loads, reduced bandwidth costs, better user experience, and improved SEO rankings. All major browsers support WebP as of 2020, with 95%+ global browser compatibility.</p>
      
      <h2>Performance Comparison</h2>
      <p>Real-world testing shows significant differences:</p>
      <ul>
        <li>Test photo (3000x2000px): JPEG (450KB), PNG (2.1MB), WebP (320KB)</li>
        <li>Logo with transparency (800x600px): PNG (85KB), WebP (45KB)</li>
        <li>Complex graphic (1920x1080px): PNG (1.2MB), WebP (380KB)</li>
      </ul>
      
      <h2>Format Selection Strategy</h2>
      <p><strong>Use JPEG for:</strong> Photographs, product images, backgrounds, social media posts</p>
      <p><strong>Use PNG for:</strong> Logos requiring transparency, simple graphics, images with text, screenshots</p>
      <p><strong>Use WebP for:</strong> Modern websites, progressive web apps, e-commerce product images, blog post images</p>
      
      <h2>Implementation Best Practices</h2>
      <p>Serve WebP with JPEG/PNG fallbacks for maximum compatibility. Use picture elements or server-side detection to deliver optimal format. Always compress images before converting to WebP for best results.</p>
    `,
    publishDate: '2025-01-05',
    readTime: '12 min read',
    category: 'Technical Guide',
    keywords: ['image formats', 'JPEG', 'PNG', 'WebP', 'compression comparison'],
  },
  {
    id: 'optimize-images-page-speed-seo',
    title: 'Optimize Images for Page Speed and SEO: 2025 Complete Guide',
    description: 'Master image optimization for faster websites and higher search rankings. Proven strategies for Core Web Vitals and SEO success.',
    content: `
      <p>Image optimization is crucial for achieving top Google rankings and passing Core Web Vitals. This comprehensive guide covers everything you need to know about optimizing images for maximum page speed and SEO performance.</p>
      
      <h2>Core Web Vitals and Image Impact</h2>
      <p>Google's Core Web Vitals directly affect search rankings. Images impact three critical metrics:</p>
      <p><strong>Largest Contentful Paint (LCP):</strong> Large hero images significantly affect LCP. Optimize to under 2.5 seconds by compressing images to 200KB or less.</p>
      <p><strong>Cumulative Layout Shift (CLS):</strong> Always specify image dimensions to prevent layout shifts. Use aspect-ratio CSS property for responsive images.</p>
      <p><strong>First Input Delay (FID):</strong> Heavy image processing can delay interactivity. Use progressive loading and lazy loading techniques.</p>
      
      <h2>SEO Image Optimization Checklist</h2>
      <ul>
        <li>Descriptive file names: "red-running-shoes-nike.jpg" vs "IMG_1234.jpg"</li>
        <li>Alt text with target keywords naturally integrated</li>
        <li>Compressed file sizes (under 200KB for above-fold, under 500KB total)</li>
        <li>Responsive images using srcset and sizes attributes</li>
        <li>Modern formats (WebP) with fallbacks</li>
        <li>Image sitemaps for better indexing</li>
      </ul>
      
      <h2>Advanced Compression Techniques for SEO</h2>
      <p>Implement adaptive image serving based on device and connection speed. Use responsive images with multiple resolutions. Compress images at 80-85% quality for web use. Convert to WebP for 25-35% additional size reduction.</p>
      
      <h2>Lazy Loading Strategy</h2>
      <p>Native lazy loading (loading="lazy") defers below-fold images, improving initial page load. Combine with intersection observer for progressive loading. Always eager-load above-fold images for optimal LCP scores.</p>
      
      <h2>CDN and Caching Optimization</h2>
      <p>Serve images through CDN for global performance. Implement browser caching with long expiry times. Use image CDNs with automatic format conversion and responsive image generation.</p>
      
      <h2>Mobile-First Image Strategy</h2>
      <p>With 60% of searches on mobile, optimize for mobile first. Serve smaller images to mobile devices. Use art direction to show different crops on different screen sizes. Test mobile page speed regularly.</p>
      
      <h2>Measuring Image Performance</h2>
      <p>Use Google PageSpeed Insights, WebPageTest, and Chrome DevTools to measure image impact. Monitor Core Web Vitals in Google Search Console. Track page load times and conversion rates after optimization.</p>
      
      <h2>Common Mistakes to Avoid</h2>
      <p>Don't use uncompressed images from cameras or design tools. Avoid serving desktop-sized images to mobile users. Don't forget to specify image dimensions. Never use images where CSS or SVG would work better.</p>
    `,
    publishDate: '2024-12-28',
    readTime: '15 min read',
    category: 'SEO & Performance',
    keywords: ['image SEO', 'page speed', 'Core Web Vitals', 'website optimization'],
  },
];

const BlogArticle = () => {
  const { articleId } = useParams();
  const { toast } = useToast();
  
  const article = blogArticles.find(a => a.id === articleId);

  useEffect(() => {
    if (article) {
      // Set page title and meta description for SEO
      document.title = `${article.title} | PixelSqueeze Blog`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', article.description);
      }

      // Scroll to top when article loads
      window.scrollTo(0, 0);
    }
  }, [article]);

  if (!article) {
    return <Navigate to="/blog" replace />;
  }

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Article URL copied to clipboard",
    });
  };

  // Get related articles (exclude current article)
  const relatedArticles = blogArticles
    .filter(a => a.id !== articleId)
    .slice(0, 2);

  return (
    <article className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-foreground hover:text-primary transition-colors">
            PixelSqueeze
          </Link>
          <div className="flex gap-6">
            <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/blog" className="text-foreground hover:text-foreground transition-colors font-medium">
              Blog
            </Link>
            <Link to="/company" className="text-foreground/80 hover:text-foreground transition-colors">
              Company
            </Link>
          </div>
        </div>
      </nav>

      {/* Article Header */}
      <header className="bg-card border-b border-border py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Link to="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
          
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <Badge variant="outline">{article.category}</Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {new Date(article.publishDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {article.readTime}
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {article.title}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-6">
            {article.description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {article.keywords.map((keyword, idx) => (
              <Badge key={idx} variant="secondary">
                {keyword}
              </Badge>
            ))}
          </div>

          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Article
          </Button>
        </div>
      </header>

      {/* Article Content */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 md:p-12">
            <div 
              className="prose prose-lg max-w-none dark:prose-invert
                prose-headings:font-bold prose-headings:text-foreground
                prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-6
                prose-strong:text-foreground prose-strong:font-semibold
                prose-ul:my-6 prose-li:text-muted-foreground prose-li:mb-2
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </Card>
        </div>
      </section>

      {/* Related Articles */}
      <section className="py-16 px-6 bg-secondary/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Related Articles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedArticles.map((relatedArticle) => (
              <Card key={relatedArticle.id} className="p-6 hover:shadow-lg transition-shadow">
                <Badge variant="outline" className="mb-3">{relatedArticle.category}</Badge>
                
                <h3 className="text-xl font-bold mb-3 hover:text-primary transition-colors">
                  <Link to={`/blog/${relatedArticle.id}`}>
                    {relatedArticle.title}
                  </Link>
                </h3>
                
                <p className="text-muted-foreground text-sm mb-4">
                  {relatedArticle.description}
                </p>
                
                <Link to={`/blog/${relatedArticle.id}`}>
                  <Button variant="outline" size="sm">
                    Read More →
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
};

export default BlogArticle;
