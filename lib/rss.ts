/**
 * RSS Headline Fetcher for Daily Current Affairs Topics.
 * Verified reputable free feeds: BBC, NPR, The Guardian, Deutsche Welle.
 */

export interface HeadlineItem {
  title: string;
  source: string;
}

const RSS_FEEDS = [
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC" },
  { url: "https://feeds.npr.org/1001/rss.xml", source: "NPR" },
  { url: "https://www.theguardian.com/world/rss", source: "The Guardian" },
  { url: "https://rss.dw.com/xml/rss-en-world", source: "Deutsche Welle" },
];

const FETCH_TIMEOUT_MS = 4000;

function cleanXmlText(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts titles from an RSS XML string without external dependencies.
 */
function parseRssTitles(xml: string, source: string): HeadlineItem[] {
  const items: HeadlineItem[] = [];
  // Match each <item> or <entry> block
  const itemRegex = /<(?:item|entry)[\s\S]*?<\/(?:item|entry)>/gi;
  const titleRegex = /<title(?:[^>]*)>([\s\S]*?)<\/title>/i;

  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemBlock = match[0];
    const titleMatch = titleRegex.exec(itemBlock);
    if (titleMatch && titleMatch[1]) {
      const cleanTitle = cleanXmlText(titleMatch[1]);
      // Exclude generic channel headers or empty titles
      if (cleanTitle && cleanTitle.length > 10 && !cleanTitle.toLowerCase().includes("rss feed")) {
        items.push({ title: cleanTitle, source });
      }
    }
  }

  return items;
}

/**
 * Fetches current headlines from verified news feeds.
 * Tolerates any individual feed failing, with strict per-feed timeouts.
 */
export async function fetchCurrentHeadlines(maxHeadlines: number = 20): Promise<HeadlineItem[]> {
  const feedPromises = RSS_FEEDS.map(async (feed) => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const res = await fetch(feed.url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "PulseVox/1.0 (+https://pulsevox.app)",
          Accept: "application/rss+xml, application/xml, text/xml;q=0.9",
        },
        cache: "no-store",
      });

      clearTimeout(timer);

      if (!res.ok) {
        return [];
      }

      const xml = await res.text();
      return parseRssTitles(xml, feed.source);
    } catch {
      // Individual feed timeout or network failure is ignored
      return [];
    }
  });

  const settled = await Promise.allSettled(feedPromises);
  const allHeadlines: HeadlineItem[] = [];
  const seenTitles = new Set<string>();

  for (const result of settled) {
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      for (const item of result.value) {
        const normalized = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!seenTitles.has(normalized)) {
          seenTitles.add(normalized);
          allHeadlines.push(item);
        }
      }
    }
  }

  // Interleave and return top headlines
  return allHeadlines.slice(0, maxHeadlines);
}

