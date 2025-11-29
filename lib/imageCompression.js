export const compressImage = async (
  file,
  { maxWidth = 1200, maxHeight = 1200, quality = 0.75 } = {}
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

  const blob = await new Promise((resolve) =>
    canvas.toBlob(
      (result) => resolve(result),
      file.type || "image/jpeg",
      quality
    )
  );

  if (!blob) return file;
  return new File([blob], file.name, { type: blob.type });
};
