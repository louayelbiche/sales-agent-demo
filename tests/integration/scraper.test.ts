import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scrapeWebsite, getWebsitePreview } from "@/lib/scraper";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Sample HTML responses
const mockHomepageHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Company - Home</title>
  <meta name="description" content="We are a test company providing great services">
</head>
<body>
  <nav><a href="/home">Home</a></nav>
  <main>
    <h1>Welcome to Test Company</h1>
    <h2>Our Mission</h2>
    <p>We provide excellent products and services to our customers.</p>
    <h2>Why Choose Us</h2>
    <p>Quality, innovation, and customer focus.</p>
    <a href="/about">About Us</a>
    <a href="/products">Our Products</a>
    <a href="/contact">Contact</a>
  </main>
  <footer>Copyright 2024</footer>
</body>
</html>
`;

const mockAboutHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>About Us - Test Company</title>
  <meta name="description" content="Learn about our company history">
</head>
<body>
  <main>
    <h1>About Test Company</h1>
    <p>Founded in 2020, we have been serving customers worldwide.</p>
    <h2>Our Team</h2>
    <p>A dedicated group of professionals.</p>
  </main>
</body>
</html>
`;

const mockProductsHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Products - Test Company</title>
</head>
<body>
  <main>
    <h1>Our Products</h1>
    <h2>Product A</h2>
    <p>An amazing product for your needs.</p>
    <h2>Product B</h2>
    <p>Another fantastic solution.</p>
  </main>
</body>
</html>
`;

describe("Website Scraper", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("scrapeWebsite", () => {
    it("should scrape homepage successfully", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHomepageHtml),
      });

      const result = await scrapeWebsite("https://example.com");

      expect(result.url).toBe("https://example.com");
      expect(result.pages.length).toBeGreaterThanOrEqual(1);
      expect(result.pages[0].title).toBe("Test Company - Home");
      expect(result.pages[0].description).toBe(
        "We are a test company providing great services"
      );
    });

    it("should extract headings from page", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHomepageHtml),
      });

      const result = await scrapeWebsite("https://example.com");

      expect(result.pages[0].headings).toContain("Welcome to Test Company");
      expect(result.pages[0].headings).toContain("Our Mission");
      expect(result.pages[0].headings).toContain("Why Choose Us");
    });

    it("should discover and scrape additional pages", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockHomepageHtml),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockAboutHtml),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockProductsHtml),
        });

      const result = await scrapeWebsite("https://example.com");

      expect(result.pages.length).toBeGreaterThanOrEqual(1);
      expect(result.combinedContent).toContain("Test Company");
    });

    it("should throw error when homepage fetch fails", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(scrapeWebsite("https://example.com")).rejects.toThrow(
        "Failed to fetch homepage"
      );
    });

    it("should handle network errors gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(scrapeWebsite("https://example.com")).rejects.toThrow(
        "Failed to fetch homepage"
      );
    });

    it("should combine content from all pages", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHomepageHtml),
      });

      const result = await scrapeWebsite("https://example.com");

      expect(result.combinedContent).toBeDefined();
      expect(result.combinedContent.length).toBeGreaterThan(0);
      expect(result.combinedContent).toContain("Test Company");
    });

    it("should limit combined content to 50000 characters", async () => {
      const longContent = "x".repeat(60000);
      const longHtml = `<html><head><title>Test</title></head><body><p>${longContent}</p></body></html>`;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(longHtml),
      });

      const result = await scrapeWebsite("https://example.com");

      expect(result.combinedContent.length).toBeLessThanOrEqual(50000);
    });

    it("should extract internal links from homepage", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHomepageHtml),
      });

      const result = await scrapeWebsite("https://example.com");

      expect(result.pages[0].links).toContain("/about");
      expect(result.pages[0].links).toContain("/products");
      expect(result.pages[0].links).toContain("/contact");
    });

    it("should remove script and style elements", async () => {
      const htmlWithScripts = `
        <html>
        <head><title>Test</title></head>
        <body>
          <script>alert('bad');</script>
          <style>.hidden { display: none; }</style>
          <p>Good content here</p>
        </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(htmlWithScripts),
      });

      const result = await scrapeWebsite("https://example.com");

      expect(result.pages[0].bodyText).toContain("Good content here");
      expect(result.pages[0].bodyText).not.toContain("alert");
      expect(result.pages[0].bodyText).not.toContain("display: none");
    });

    it("should normalize URL to origin", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHomepageHtml),
      });

      const result = await scrapeWebsite("https://example.com/some/path?query=1");

      expect(result.url).toBe("https://example.com");
    });

    it("should skip pages with minimal content", async () => {
      const minimalHtml = `<html><head><title>Empty</title></head><body><p>Hi</p></body></html>`;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(mockHomepageHtml),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(minimalHtml),
        });

      const result = await scrapeWebsite("https://example.com");

      // Should only include homepage since about page has < 100 chars
      const minimalPageIncluded = result.pages.some(
        (p) => p.title === "Empty"
      );
      expect(minimalPageIncluded).toBe(false);
    });
  });

  describe("getWebsitePreview", () => {
    it("should return preview for valid URL", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHomepageHtml),
      });

      const result = await getWebsitePreview("https://example.com");

      expect(result).not.toBeNull();
      expect(result?.title).toBe("Test Company - Home");
      expect(result?.description).toBe(
        "We are a test company providing great services"
      );
      expect(result?.url).toBe("https://example.com");
    });

    it("should use og:title as fallback", async () => {
      const htmlWithOg = `
        <html>
        <head>
          <meta property="og:title" content="OG Title">
          <meta property="og:description" content="OG Description">
        </head>
        <body></body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(htmlWithOg),
      });

      const result = await getWebsitePreview("https://example.com");

      expect(result?.title).toBe("OG Title");
      expect(result?.description).toBe("OG Description");
    });

    it("should return null for failed fetch", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await getWebsitePreview("https://example.com");

      expect(result).toBeNull();
    });

    it("should return null for network error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await getWebsitePreview("https://example.com");

      expect(result).toBeNull();
    });

    it("should truncate long titles and descriptions", async () => {
      const longTitle = "A".repeat(150);
      const longDesc = "B".repeat(250);
      const htmlWithLong = `
        <html>
        <head>
          <title>${longTitle}</title>
          <meta name="description" content="${longDesc}">
        </head>
        <body></body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(htmlWithLong),
      });

      const result = await getWebsitePreview("https://example.com");

      expect(result?.title.length).toBeLessThanOrEqual(100);
      expect(result?.description.length).toBeLessThanOrEqual(200);
    });
  });
});

describe("Scraper Edge Cases", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("should handle HTML without main content element", async () => {
    const simpleHtml = `
      <html>
      <head><title>Simple Page</title></head>
      <body>
        <p>Just some text in the body.</p>
      </body>
      </html>
    `;

    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(simpleHtml),
    });

    const result = await scrapeWebsite("https://example.com");

    expect(result.pages[0].bodyText).toContain("Just some text");
  });

  it("should handle pages with no headings", async () => {
    const noHeadingsHtml = `
      <html>
      <head><title>No Headings</title></head>
      <body><p>Content without any headings.</p></body>
      </html>
    `;

    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(noHeadingsHtml),
    });

    const result = await scrapeWebsite("https://example.com");

    expect(result.pages[0].headings).toEqual([]);
  });

  it("should handle empty description", async () => {
    const noDescHtml = `
      <html>
      <head><title>No Description</title></head>
      <body><p>Content here.</p></body>
      </html>
    `;

    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(noDescHtml),
    });

    const result = await scrapeWebsite("https://example.com");

    expect(result.pages[0].description).toBe("");
  });

  it("should filter out very long headings", async () => {
    const longHeading = "X".repeat(250);
    const longHeadingHtml = `
      <html>
      <head><title>Test</title></head>
      <body>
        <h1>${longHeading}</h1>
        <h2>Normal Heading</h2>
      </body>
      </html>
    `;

    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(longHeadingHtml),
    });

    const result = await scrapeWebsite("https://example.com");

    expect(result.pages[0].headings).toContain("Normal Heading");
    expect(result.pages[0].headings).not.toContain(longHeading);
  });

  it("should deduplicate internal links", async () => {
    const duplicateLinksHtml = `
      <html>
      <head><title>Test</title></head>
      <body>
        <a href="/about">About 1</a>
        <a href="/about">About 2</a>
        <a href="/about">About 3</a>
      </body>
      </html>
    `;

    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(duplicateLinksHtml),
    });

    const result = await scrapeWebsite("https://example.com");

    const aboutLinks = result.pages[0].links.filter((l) => l === "/about");
    expect(aboutLinks.length).toBe(1);
  });
});
