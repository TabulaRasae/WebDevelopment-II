export const compressImage = async (
  file,
  { maxWidth = 900, maxHeight = 900, quality = 0.6, maxBytes = 380 * 1024 } = {}
) => {
  if (typeof window === "undefined") return file;
  if (!file || !file.type?.startsWith?.("image/")) return file;

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const ratio = Math.min(1, maxWidth / img.width, maxHeight / img.height);
  const targetWidth = Math.max(1, Math.round(img.width * ratio));
  const targetHeight = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const toBlobWithQuality = (q) =>
    new Promise((resolve) =>
      canvas.toBlob(
        (result) => resolve(result),
        file.type || "image/jpeg",
        q
      )
    );

  let blob = await toBlobWithQuality(quality);
  if (!blob) return file;

  if (maxBytes && blob.size > maxBytes) {
    // Try a slightly lower quality to fit within bucket limits
    const secondPass = await toBlobWithQuality(Math.max(0.4, quality * 0.8));
    if (secondPass && secondPass.size < blob.size) blob = secondPass;
    if (secondPass && maxBytes && secondPass.size > maxBytes) {
      const thirdPass = await toBlobWithQuality(Math.max(0.35, quality * 0.6));
      if (thirdPass && thirdPass.size < blob.size) blob = thirdPass;
    }
  }

  return new File([blob], file.name, { type: blob.type });
};
