import connectDB from "../../../lib/db";
import { createProduct } from "../../../lib/products";
import { getUserId, withSessionRoute } from "../../../lib/session";
import {
  buildFallbackCover,
  pickCoverImage,
  sanitizeCoverImage,
  validateImageUrl,
} from "../../../lib/coverSelection.js";

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
- authors: comma-separated author names; if not provided, infer the most likely authors for this title/edition. If unsure, leave empty string.
- specs: array of short bullet-style strings (e.g., "Edition: 3rd", "Condition: Gently used", "Authors: ...")

Input:
- Title: ${title}
- Edition: ${edition || "Not provided"}
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

async function requestCoverOnly({ title, edition, authors }) {
  const apiKey = getOpenAIKey();
  if (!apiKey) return "";

  const body = {
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content:
          "Return only a direct https image URL to the front cover for the exact title/edition provided. If unsure, return an empty string.",
      },
      {
        role: "user",
        content: `Title: ${title}\nEdition: ${edition}\nAuthors: ${authors || "Not provided"}\nRespond with ONLY the URL, nothing else.`,
      },
    ],
    temperature: 0.2,
  };

  if (/gpt-5\.1|gpt-4\.1/i.test(OPENAI_MODEL)) {
    body.max_completion_tokens = 50;
  } else {
    body.max_tokens = 50;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return "";
    const data = await res.json();
    const url = (data?.choices?.[0]?.message?.content || "").trim();
    return sanitizeCoverImage(url);
  } catch {
    return "";
  }
}

async function generateWithOpenAI(payload) {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    throw new Error("Missing OpenAI API key.");
  }

   const model = OPENAI_MODEL;
  const body = {
    model,
    messages: [
      {
        role: "system",
        content:
          "You write concise, accurate textbook listings and return strict JSON with no prose. Base every detail on the provided Title and Edition. Prefer trustworthy cover images that match the exact title/edition; return a non-empty https image URL whenever possible and only leave it empty if absolutely necessary. Infer likely authors when not provided (leave blank if unsure). If unsure about an ISBN, leave it empty.",
      },
      { role: "user", content: buildPrompt(payload) },
    ],
    temperature: 0.4,
  };

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

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI error for model ${model}: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "";
  if (!content) throw new Error("Empty response from OpenAI.");

  try {
    return JSON.parse(extractJson(content));
  } catch (error) {
    throw new Error("Unable to parse OpenAI response.");
  }
}

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

const dedupeSpecs = (specs = []) => {
  const seen = new Set();
  const result = [];
  for (const spec of specs) {
    const normalized = (spec || "").trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
};

const searchOpenLibraryByTitle = async ({ title, edition, authors }) => {
  const query = encodeURIComponent([title, edition, authors].filter(Boolean).join(" "));
  const url = `https://openlibrary.org/search.json?q=${query}&fields=cover_i,isbn,author_name,title&limit=20`;
  try {
    const res = await fetch(url);
    if (!res.ok) return { image: "", isbn: "", authors: "" };
    const data = await res.json();
    const docs = Array.isArray(data?.docs) ? data.docs : [];
    for (const doc of docs) {
      const coverId = doc.cover_i;
      const isbnCandidate = normalizeIsbn(
        Array.isArray(doc.isbn) ? doc.isbn.find((v) => normalizeIsbn(v)) || "" : ""
      );
      const authorNames = Array.isArray(doc.author_name)
        ? doc.author_name.filter(Boolean).join(", ")
        : "";
      const image = coverId
        ? sanitizeCoverImage(`https://covers.openlibrary.org/b/id/${coverId}-L.jpg`)
        : "";
      if (image || isbnCandidate) {
        return { image, isbn: isbnCandidate, authors: authorNames };
      }
    }
  } catch {
    // ignore
  }
  return { image: "", isbn: "", authors: "" };
};

async function generateRoute(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Login required." });
  }

  const { title, edition = "", price, condition = "", authors = "" } = req.body || {};
  const providedImages = Array.isArray(req.body?.images) ? req.body.images.filter(Boolean) : [];
  if (!title || !price) {
    return res
      .status(400)
      .json({ message: "Title and price are required." });
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
    const amazonImage = "";
    const googleImage = "";
    const googleIsbn = "";
    const googleAuthors = "";
    const aiImage = sanitizeCoverImage(ai?.image);
    const openSearch = await searchOpenLibraryByTitle({
      title,
      edition,
      authors: authors || googleAuthors || ai?.authors || "",
    });
    const derivedIsbn = normalizeIsbn(aiIsbn || googleIsbn || openSearch.isbn || "");
    const openLibraryImage = await tryOpenLibraryCover(derivedIsbn);

    const resolvedAuthors =
      authors || googleAuthors || openSearch.authors || ai?.authors || "";

    const specs = Array.isArray(ai?.specs) ? ai.specs.filter(Boolean) : [];
    if (edition) specs.unshift(`Edition: ${edition}`);
    if (condition) specs.unshift(`Condition: ${condition}`);
    if (resolvedAuthors) specs.unshift(`Authors: ${resolvedAuthors}`);
    if (derivedIsbn) specs.unshift(`ISBN: ${derivedIsbn}`);
    const uniqueSpecs = dedupeSpecs(specs);

    const baseDescription =
      ai?.description?.slice(0, 600) ||
      [
        `Used textbook titled ${title}${edition ? ` (${edition})` : ""}.`,
        `Condition: ${condition || "Used"}.`,
        resolvedAuthors ? `Authors: ${resolvedAuthors}.` : "",
      ]
        .filter(Boolean)
        .join(" ");
    const description = ensureCourseAndIsbn(baseDescription, title, derivedIsbn);

    const providedImageList = providedImages.map((u) => sanitizeCoverImage(u));
    const candidates = [
      ...providedImageList.map((url) => ({ label: "user", url })),
      { label: "google", url: googleImage },
      { label: "openLibrary", url: openLibraryImage },
      { label: "openSearch", url: openSearch.image },
      { label: "ai", url: aiImage },
    ];

    const providedImageList = providedImages.map((u) => sanitizeCoverImage(u)).filter(Boolean);
    let image = "";
    for (const { url } of candidates) {
      const valid = await validateImageUrl(url);
      if (valid) {
        image = valid;
        break;
      }
    }

    if (!image) {
      const coverFromModel = await requestCoverOnly({
        title,
        edition,
        authors: resolvedAuthors,
      });
      const fallbackCandidates = [
        { label: "modelCover", url: coverFromModel },
        ...candidates,
      ];
      for (const { url } of fallbackCandidates) {
        const valid = await validateImageUrl(url);
        if (valid) {
          image = valid;
          break;
        }
      }
    }

    if (!image && providedImageList.length) {
      image = providedImageList[0];
    }

    if (!image) {
      image = fallbackImage;
    }

    const displayName = edition ? `${title} (${edition})` : title;

    const imageList = providedImageList.length
      ? providedImageList
      : [image, openLibraryImage, openSearch.image, aiImage].filter(Boolean);

    const product = await createProduct({
      name: displayName,
      price: priceNumber,
      shortDescription:
        ai?.shortDescription?.slice(0, 200) ||
        `${title}${edition ? ` ${edition} edition` : ""} textbook.`,
      description,
      headline:
        ai?.headline?.slice(0, 90) ||
        `${title}${edition ? ` ${edition} edition` : ""} for your course`,
      image: image || fallbackImage,
      images: imageList.length ? imageList : [fallbackImage],
      specs: uniqueSpecs,
      status: "available",
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
