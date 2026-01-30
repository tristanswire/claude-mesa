/**
 * Fetch HTML from a URL with timeout, user-agent, and size guards.
 */

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB
const FETCH_TIMEOUT_MS = 10000; // 10 seconds

export interface FetchResult {
  success: true;
  html: string;
  url: string;
}

export interface FetchError {
  success: false;
  error: string;
}

export type FetchResponse = FetchResult | FetchError;

export async function fetchRecipeHtml(url: string): Promise<FetchResponse> {
  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { success: false, error: "Invalid URL format" };
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return { success: false, error: "Only HTTP and HTTPS URLs are supported" };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RecipeImporter/1.0; +https://example.com/bot)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
      };
    }

    // Check content type
    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml")
    ) {
      return {
        success: false,
        error: `Unexpected content type: ${contentType}. Expected HTML.`,
      };
    }

    // Check content length if available
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
      return {
        success: false,
        error: "Response too large. Maximum size is 5MB.",
      };
    }

    // Read response with size limit
    const reader = response.body?.getReader();
    if (!reader) {
      return { success: false, error: "Unable to read response body" };
    }

    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalSize += value.length;
      if (totalSize > MAX_RESPONSE_SIZE) {
        reader.cancel();
        return {
          success: false,
          error: "Response too large. Maximum size is 5MB.",
        };
      }

      chunks.push(value);
    }

    const decoder = new TextDecoder("utf-8");
    const html = chunks.map((chunk) => decoder.decode(chunk, { stream: true })).join("");

    return { success: true, html, url: response.url };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return { success: false, error: "Request timed out after 10 seconds" };
      }
      return { success: false, error: `Fetch error: ${error.message}` };
    }
    return { success: false, error: "Unknown fetch error" };
  }
}
