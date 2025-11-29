import { supabase } from "./supabaseClient";

const BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "product-images";
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;

const randomSuffix = () => Math.random().toString(36).slice(2, 8);

export async function uploadImagesToSupabase(files = []) {
  if (!files.length) return [];

  if (!supabase) {
    throw new Error("Supabase client is not configured. Check env vars.");
  }

  const uploads = [];
  for (const file of files) {
    const safeName = file?.name || "upload";
    const path = `listings/${Date.now()}-${randomSuffix()}-${safeName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (error) {
      throw new Error(error.message || "Supabase upload failed");
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = publicData?.publicUrl;
    if (!publicUrl) {
      throw new Error("Unable to resolve public URL for uploaded image");
    }

    uploads.push({ url: publicUrl, path });
  }

  return uploads;
}

export const extractSupabasePath = (url = "") => {
  if (!url || typeof url !== "string") return "";
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return "";
    const prefix = `${supabaseUrl}${PUBLIC_PREFIX}`;
    return url.startsWith(prefix) ? url.slice(prefix.length) : "";
  } catch {
    return "";
  }
};

export async function deleteSupabaseImages(urls = []) {
  if (!urls.length || !supabase) return;
  const paths = urls
    .map((url) => extractSupabasePath(url))
    .filter(Boolean);
  if (!paths.length) return;
  await supabase.storage.from(BUCKET).remove(paths);
}
