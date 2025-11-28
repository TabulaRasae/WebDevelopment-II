import connectDB from "../../../lib/db";
import { createProduct } from "../../../lib/products";
import { getUserId, withSessionRoute } from "../../../lib/session";

const OPENAI_MODEL =
  process.env.OPENAI_MODEL ||
  process.env.OPENAI_MODEL_ID ||
  "gpt-5.1";

const buildPrompt = ({ title, edition, price, condition, authors }) => {
  return `
Generate a concise listing for a used college textbook.
Return a single JSON object with keys:
- headline: catchy but honest, max 80 chars
- shortDescription: 2 sentences max, under 160 chars
- description: 3-5 sentences, under 450 chars, mention edition/condition/authors, include a likely BMCC course/subject this book supports (e.g., "Helpful for BMCC CIS 485 presentations") and include the ISBN if known.
- image: direct https URL to a front cover photo of THIS title/edition (avoid placeholders, plants/objects/abstracts; if unsure, leave empty string). Use the provided title and edition in your lookup.
- isbn: 13-digit ISBN string if confident, else empty string
- specs: array of short bullet-style strings (e.g., "Edition: 3rd", "Condition: Gently used", "Authors: ...")

Input:
- Title: ${title}
- Edition: ${edition}
- Price: $${price}
- Condition: ${condition || "Not provided"}
- Authors: ${authors || "Not provided (infer likely authors if confident)"}

Prefer an Amazon product cover URL or Google Books cover if available.
Return ONLY the JSON object. Do not use markdown code fences. If you are not confident in the cover, set "image" to "" and if you are not confident in ISBN, set "isbn" to "".`;
};

const extractJson = (rawText = "") => {
  const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1];

  const firstObject = rawText.match(/{[\s\S]*}/);
  if (firstObject?.[0]) return firstObject[0];

  return rawText.trim();
};

const getOpenAIKey = () =>
  process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || process.env.OPEN || "";

async function generateWithOpenAI(payload) {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    throw new Error("Missing OpenAI API key.");
  }

   const modelCandidates = [
    OPENAI_MODEL
  ].filter(Boolean);
  let lastError = null;

  for (const model of modelCandidates) {
    const body = {
      model,
      messages: [
        {
          role: "system",
          content:
            "You write concise, accurate textbook listings and return strict JSON with no prose. Base every detail on the provided Title and Edition. Prefer trustworthy cover images that match the exact title/edition. If unsure about an image or ISBN, leave them empty.",
        },
        { role: "user", content: buildPrompt(payload) },
      ],
      temperature: 0.4,
    };

    // Newer models require max_completion_tokens instead of max_tokens
    const usesCompletionTokens = /gpt-5\.1|gpt-4\.1/i.test(model);
    if (usesCompletionTokens) {
      body.max_completion_tokens = 400;
    } else {
      body.max_tokens = 400;
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || "";
      if (!content) throw new Error("Empty response from OpenAI.");

      try {
        return JSON.parse(extractJson(content));
      } catch (error) {
        throw new Error("Unable to parse OpenAI response.");
      }
    }

    const errorText = await res.text();
    lastError = `OpenAI error for model ${model}: ${res.status} ${errorText}`;
    const isModelNotFound =
      res.status === 404 || /model_not_found|does not exist/i.test(errorText);
    if (!isModelNotFound) {
      throw new Error(lastError);
    }
    // otherwise try next candidate
  }

  throw new Error(lastError || "No OpenAI model succeeded.");
}

const isLikelyImage = (url = "") => {
  if (typeof url !== "string" || !url.startsWith("http")) return false;
  try {
    const parsed = new URL(url);
    const path = parsed.pathname || "";
    const hasExt = /\.(jpe?g|png|webp|gif)$/i.test(path);
    const isGoogleImg =
      parsed.host.includes("gstatic") ||
      parsed.host.includes("googleusercontent") ||
      parsed.host.includes("books.google");
    const hasImgParam = parsed.search.includes("img=") || parsed.search.includes("zoom=");
    return hasExt || isGoogleImg || hasImgParam;
  } catch {
    return false;
  }
};

const sanitizeCoverImage = (url = "", title = "") => {
  if (!isLikelyImage(url)) return "";
  const lower = url.toLowerCase();
  const banned = [
    "cactus",
    "succulent",
    "plant",
    "plants",
    "desert",
    "flower",
    "flowers",
    "vase",
    "pot",
    "potted",
    "tree",
    "trees",
  ];
  if (banned.some((word) => lower.includes(word))) return "";
  const titleTerms = (title || "").toLowerCase().split(/\s+/).filter(Boolean);
  const host = (() => {
    try {
      return new URL(url).host;
    } catch {
      return "";
    }
  })();
  const titleMatches = titleTerms.length
    ? titleTerms.some((term) => lower.includes(term))
    : false;
  const trustedHost =
    host.includes("books.google") ||
    host.includes("gstatic") ||
    host.includes("googleusercontent") ||
    host.includes("amazon.com") ||
    host.includes("ssl-images-amazon.com") ||
    host.includes("images-na.ssl-images-amazon.com");

  if (!titleMatches && !trustedHost) return "";
  return url;
};

const buildFallbackCover = (title = "", edition = "") => {
  const text = encodeURIComponent(`${title} ${edition}`.trim() || "BMCC UsedBooks");
  return `https://placehold.co/600x800/0ea5e9/ffffff?text=${text}`;
};

const normalizeIsbn = (value = "") => {
  const digits = value.replace(/[^0-9Xx]/g, "");
  if (digits.length === 10 || digits.length === 13) return digits.toUpperCase();
  return "";
};

const ensureCourseAndIsbn = (description = "", title = "", isbn = "") => {
  let text = description.trim();
  if (isbn && !/isbn/i.test(text)) {
    const needsPeriod = text && !/[.?!]\s*$/.test(text) ? "." : "";
    text = `${text}${needsPeriod} ISBN: ${isbn}.`;
  }
  if (title && !/bmcc/i.test(text)) {
    const period = text && !/[.?!]\s*$/.test(text) ? "." : "";
    text = `${text}${period} Helpful for BMCC courses related to "${title}".`;
  }
  return text.trim();
};

async function lookupBookCover({ title, edition, authors, isbn }) {
  if (!process.env.GOOGLE_BOOKS_API_KEY) return { image: "", isbn: "", authors: "" };

  const baseQuery = `${title} ${edition} ${authors || ""}`.trim();
  const isbnQuery = isbn ? ` isbn:${isbn}` : "";
  const query = encodeURIComponent(`${baseQuery}${isbnQuery}`);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=5&printType=books&projection=lite&key=${process.env.GOOGLE_BOOKS_API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return { image: "", isbn: "" };
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    for (const item of items) {
      const links = item?.volumeInfo?.imageLinks || {};
      const candidates = [
        links.large,
        links.medium,
        links.thumbnail,
        links.smallThumbnail,
      ].filter(Boolean);
      const match = candidates.find((u) => {
        try {
          const normalized = new URL(u.replace("http://", "https://")).toString();
          const clean = sanitizeCoverImage(normalized, title);
          return Boolean(clean);
        } catch {
          return false;
        }
      });
      if (match) {
        const sanitized = sanitizeCoverImage(
          match.replace("http://", "https://"),
          title
        );
        const identifiers = Array.isArray(item?.volumeInfo?.industryIdentifiers)
          ? item.volumeInfo.industryIdentifiers
          : [];
        const isbnCandidate =
          normalizeIsbn(
            identifiers.find((i) => /isbn\s*13/i.test(i?.type || ""))?.identifier ||
              ""
          ) ||
          normalizeIsbn(
            identifiers.find((i) => /isbn/i.test(i?.type || ""))?.identifier || ""
          );
        const volumeAuthors = Array.isArray(item?.volumeInfo?.authors)
          ? item.volumeInfo.authors.filter(Boolean).join(", ")
          : "";
        return { image: sanitized, isbn: isbnCandidate || "", authors: volumeAuthors };
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Book cover lookup failed:", error);
    return { image: "", isbn: "", authors: "" };
  }

  return { image: "", isbn: "", authors: "" };
}

const tryAmazonCover = async (isbn) => {
  if (!isbn) return "";
  const patterns = [
    `https://images-na.ssl-images-amazon.com/images/P/${isbn}.01._SL1200_.jpg`,
    `https://images-na.ssl-images-amazon.com/images/P/${isbn}.01._SX500_.jpg`,
    `https://m.media-amazon.com/images/P/${isbn}.01._SL1200_.jpg`,
    `https://m.media-amazon.com/images/P/${isbn}.01._SX500_.jpg`,
  ];

  for (const url of patterns) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) {
        return url;
      }
    } catch {
      // ignore and continue
    }
  }
  return "";
};

const tryOpenLibraryCover = async (isbn) => {
  if (!isbn) return "";
  const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (res.ok) return url;
  } catch {
    // ignore
  }
  return "";
};

async function generateRoute(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Login required." });
  }

  const { title, edition, price, condition = "", authors = "" } = req.body || {};
  if (!title || !edition || !price) {
    return res
      .status(400)
      .json({ message: "Title, edition, and price are required." });
  }

  const priceNumber = Number(price);
  if (Number.isNaN(priceNumber) || priceNumber <= 0) {
    return res.status(400).json({ message: "Price must be a positive number." });
  }

  await connectDB();

  let ai = {};
  try {
    ai = await generateWithOpenAI({
      title,
      edition,
      price: priceNumber,
      condition,
      authors,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Generate listing error (OpenAI):", error);
    ai = {
      headline: `${title} (${edition})`,
      shortDescription: `${title} ${edition} edition textbook in ${condition || "used"} condition.`,
      description: `Used textbook titled ${title} (${edition}). Condition: ${condition ||
        "Used"}. Authors: ${authors || "N/A"}. Priced at $${priceNumber.toFixed(2)}.`,
      image: "",
      isbn: "",
      specs: [],
    };
  }

  try {
    const fallbackImage = buildFallbackCover(title, edition);
    const aiIsbn = normalizeIsbn(ai?.isbn || "");
    const amazonImage = await tryAmazonCover(aiIsbn);
    const {
      image: googleImage,
      isbn: googleIsbn,
      authors: googleAuthors,
    } = await lookupBookCover({
      title,
      edition,
      authors,
      isbn: aiIsbn,
    });
    const aiImage = sanitizeCoverImage(ai?.image, title);
    const derivedIsbn = normalizeIsbn(aiIsbn || googleIsbn || "");
    const openLibraryImage = await tryOpenLibraryCover(derivedIsbn);

    const resolvedAuthors = authors || googleAuthors || ai?.authors || "";

    const specs = Array.isArray(ai?.specs) ? ai.specs.filter(Boolean) : [];
    specs.unshift(`Edition: ${edition}`);
    if (condition) specs.unshift(`Condition: ${condition}`);
    if (resolvedAuthors) specs.unshift(`Authors: ${resolvedAuthors}`);
    if (derivedIsbn) specs.unshift(`ISBN: ${derivedIsbn}`);

    const baseDescription =
      ai?.description?.slice(0, 600) ||
      `Used textbook titled ${title} (${edition}). Condition: ${condition ||
        "Used"}. Authors: ${resolvedAuthors || "N/A"}.`;
    const description = ensureCourseAndIsbn(baseDescription, title, derivedIsbn);

    const product = await createProduct({
      name: `${title} (${edition})`,
      price: priceNumber,
      shortDescription:
        ai?.shortDescription?.slice(0, 200) ||
        `${title} ${edition} edition textbook.`,
      description,
      headline:
        ai?.headline?.slice(0, 90) ||
        `${title} ${edition} edition for your course`,
      image:
        amazonImage ||
        googleImage ||
        openLibraryImage ||
        aiImage ||
        fallbackImage,
      specs,
      ownerId: userId,
    });

    return res.status(200).json({ ok: true, product });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Generate listing error (persist):", error);
    return res.status(500).json({ message: error.message });
  }
}

export default withSessionRoute(generateRoute);
