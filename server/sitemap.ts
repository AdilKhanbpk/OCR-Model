// Dynamic sitemap generation
export function generateSitemap(baseUrl: string): string {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const urls = [
    // Main pages
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/ocr-for-images', priority: '0.9', changefreq: 'weekly' },
    { loc: '/ocr-for-pdfs', priority: '0.9', changefreq: 'weekly' },
    { loc: '/ocr-for-invoices', priority: '0.9', changefreq: 'weekly' },
    { loc: '/ocr-for-id-cards', priority: '0.9', changefreq: 'weekly' },
    
    // Information pages
    { loc: '/about', priority: '0.7', changefreq: 'monthly' },
    { loc: '/contact', priority: '0.7', changefreq: 'monthly' },
    { loc: '/pricing', priority: '0.8', changefreq: 'weekly' },
    { loc: '/faq', priority: '0.6', changefreq: 'monthly' },
    
    // Legal pages
    { loc: '/privacy', priority: '0.5', changefreq: 'yearly' },
    { loc: '/terms', priority: '0.5', changefreq: 'yearly' },
    
    // Blog (if implemented)
    { loc: '/blog', priority: '0.8', changefreq: 'daily' },
  ];

  const urlElements = urls.map(url => `
  <url>
    <loc>${baseUrl}${url.loc}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

// Add sitemap route to your routes.ts
export function addSitemapRoute(app: any) {
  app.get('/sitemap.xml', (req: any, res: any) => {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    const sitemap = generateSitemap(baseUrl);
    
    res.setHeader('Content-Type', 'application/xml');
    res.send(sitemap);
  });
}
