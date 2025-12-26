import * as cheerio from "cheerio";

export interface ScrapedPage {
  url: string;
  title: string;
  description: string;
  headings: string[];
  bodyText: string;
  links: string[];
}

export interface ScrapedWebsite {
  url: string;
  pages: ScrapedPage[];
  combinedContent: string;
}

const USER_AGENT =
  "Mozilla/5.0 (compatible; SalesAgentDemo/1.0; +https://salesagent.runwellsystems.com)";

const PAGE_PATTERNS = [
  { name: "about", patterns: ["/about", "/about-us", "/company", "/who-we-are"] },
  { name: "products", patterns: ["/products", "/services", "/solutions", "/offerings", "/pricing"] },
  { name: "contact", patterns: ["/contact", "/contact-us", "/get-in-touch"] },
];

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.warn(`Error fetching ${url}:`, error);
    return null;
  }
}

function extractPageContent(html: string, url: string): ScrapedPage {
  const $ = cheerio.load(html);

  // Remove script, style, and nav elements
  $("script, style, nav, header, footer, noscript, iframe").remove();

  const title = $("title").text().trim() || $("h1").first().text().trim() || "";
  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";

  const headings: string[] = [];
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 200) {
      headings.push(text);
    }
  });

  // Get main content text
  const mainContent = $("main, article, .content, .main, #content, #main").first();
  const bodyElement = mainContent.length ? mainContent : $("body");

  const bodyText = bodyElement
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 10000); // Limit to 10k chars per page

  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.startsWith("/")) {
      links.push(href);
    }
  });

  return {
    url,
    title,
    description,
    headings: headings.slice(0, 20),
    bodyText,
    links: [...new Set(links)],
  };
}

function discoverPages(baseUrl: string, homepageLinks: string[]): string[] {
  const pagesToScrape: string[] = [];

  for (const pageType of PAGE_PATTERNS) {
    for (const pattern of pageType.patterns) {
      // Check if pattern exists in homepage links
      const matchingLink = homepageLinks.find(
        (link) => link.toLowerCase().includes(pattern.toLowerCase())
      );
      if (matchingLink) {
        pagesToScrape.push(new URL(matchingLink, baseUrl).href);
        break;
      }
    }
  }

  return pagesToScrape;
}

export async function scrapeWebsite(url: string): Promise<ScrapedWebsite> {
  // Normalize URL
  const baseUrl = new URL(url);
  const homepageUrl = baseUrl.origin;

  // Scrape homepage first
  const homepageHtml = await fetchPage(homepageUrl);
  if (!homepageHtml) {
    throw new Error(`Failed to fetch homepage: ${homepageUrl}`);
  }

  const homepage = extractPageContent(homepageHtml, homepageUrl);
  const pages: ScrapedPage[] = [homepage];

  // Discover and scrape additional pages
  const pagesToScrape = discoverPages(homepageUrl, homepage.links);

  for (const pageUrl of pagesToScrape.slice(0, 5)) {
    // Limit to 5 additional pages
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Rate limiting
    const html = await fetchPage(pageUrl);
    if (html) {
      const page = extractPageContent(html, pageUrl);
      if (page.bodyText.length > 100) {
        // Only include pages with meaningful content
        pages.push(page);
      }
    }
  }

  // Combine all content for analysis
  const combinedContent = pages
    .map(
      (page) => `
## ${page.title || page.url}

${page.description ? `Description: ${page.description}\n` : ""}
${page.headings.length ? `Key Points:\n${page.headings.map((h) => `- ${h}`).join("\n")}\n` : ""}
Content:
${page.bodyText}
`
    )
    .join("\n---\n");

  return {
    url: homepageUrl,
    pages,
    combinedContent: combinedContent.slice(0, 50000), // Limit total content
  };
}

export async function getWebsitePreview(
  url: string
): Promise<{ title: string; description: string; url: string } | null> {
  try {
    const html = await fetchPage(url);
    if (!html) return null;

    const $ = cheerio.load(html);
    const title =
      $("title").text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      "";
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";

    return {
      title: title.slice(0, 100),
      description: description.slice(0, 200),
      url,
    };
  } catch {
    return null;
  }
}
