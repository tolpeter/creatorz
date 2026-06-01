"use client";

/**
 * Kliens oldali videó-thumbnail generálás canvas-szal.
 * A videó ~1. másodpercéből készít egy JPEG képet (File). Hibánál null.
 */
export async function generateVideoThumbnail(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      const cleanup = () => URL.revokeObjectURL(objectUrl);

      video.onloadedmetadata = () => {
        const target = Math.min(1, (video.duration || 1) / 2);
        video.currentTime = isFinite(target) ? target : 0;
      };

      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          resolve(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob) {
              resolve(null);
              return;
            }
            resolve(new File([blob], "thumbnail.jpg", { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.8
        );
      };

      video.onerror = () => {
        cleanup();
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}
