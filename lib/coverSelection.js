export const isLikelyImage = (url = "") =>
  typeof url === "string" && url.startsWith("http");

export const sanitizeCoverImage = (url = "") =>
  isLikelyImage(url) ? url : "";

const parseContentRangeTotal = (header = "") => {
  const match = header.match(/\/(\d+)$/);
  return match ? Number(match[1]) || 0 : 0;
};

const readUpTo = async (body, minBytes) => {
  if (!body?.getReader) return 0;
  const reader = body.getReader();
  let received = 0;
  while (received < minBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value?.length || value?.byteLength || 0;
  }
  return received;
};

export const validateImageUrl = async (
  url = "",
  { minBytes = 800, fetcher = fetch } = {}
) => {
  if (!isLikelyImage(url)) return "";

  const checkHeaders = (res) => {
    const type = (res.headers.get("content-type") || "").toLowerCase();
    const len = Number(res.headers.get("content-length")) || 0;
    const rangeTotal = parseContentRangeTotal(res.headers.get("content-range") || "");
    return { type, len, rangeTotal };
  };

  try {
    const headRes = await fetcher(url, { method: "HEAD" });
    if (headRes?.ok) {
      const { type, len, rangeTotal } = checkHeaders(headRes);
      if (type.includes("image")) {
        if ((len && len >= minBytes) || (rangeTotal && rangeTotal >= minBytes)) return url;
        if (!len && !rangeTotal) return url; // accept if we can't size it here
      }
    }
  } catch {
    // ignore and try GET
  }

  try {
    const getRes = await fetcher(url, {
      method: "GET",
      headers: { Range: "bytes=0-2047" },
    });
    if (!getRes?.ok) return "";
    const { type, len, rangeTotal } = checkHeaders(getRes);
    if (!type.includes("image")) return "";
    if (len && len >= minBytes) return url;
    if (rangeTotal && rangeTotal >= minBytes) return url;
    if (len && len < minBytes) return "";
    if (rangeTotal && rangeTotal < minBytes) return "";
    const read = await readUpTo(getRes.body, minBytes);
    return read >= minBytes ? url : "";
  } catch {
    return "";
  }
};

export const buildFallbackCover = (title = "", edition = "") => {
  const text = encodeURIComponent(
    `${title} ${edition}`.trim() || "Cover unavailable"
  );
  return `https://placehold.co/600x800/0ea5e9/ffffff?text=${text}`;
};

export const pickCoverImage = ({
  amazonImage = "",
  googleImage = "",
  openLibraryImage = "",
  openSearchImage = "",
  aiImage = "",
  fallbackImage = "",
}) =>
  amazonImage ||
  googleImage ||
  openLibraryImage ||
  openSearchImage ||
  aiImage ||
  fallbackImage;
