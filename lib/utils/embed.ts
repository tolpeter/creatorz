export type EmbedType = "drive" | "youtube" | "vimeo" | "link";

export type ParsedEmbed = {
  type: EmbedType;
  embedUrl: string | null; // iframe src; null ha sima link
  originalUrl: string;
};

/**
 * Külső portfólió linkből beágyazható előnézetet készít.
 * - Google Drive videó link  -> /preview iframe
 * - YouTube                  -> /embed iframe
 * - Vimeo                    -> player iframe
 * - Minden más               -> sima kattintható link
 */
export function parseEmbedLink(url: string): ParsedEmbed {
  const clean = url.trim();

  // Google Drive: .../file/d/FILE_ID/view  vagy  open?id=FILE_ID
  const driveMatch = clean.match(
    /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/,
  );
  if (driveMatch) {
    return {
      type: "drive",
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      originalUrl: clean,
    };
  }

  // YouTube: watch?v=ID | youtu.be/ID | embed/ID | shorts/ID
  const ytMatch = clean.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (ytMatch) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      originalUrl: clean,
    };
  }

  // Vimeo: vimeo.com/ID  vagy  vimeo.com/video/ID
  const vimeoMatch = clean.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      originalUrl: clean,
    };
  }

  // Minden más: sima link
  return { type: "link", embedUrl: null, originalUrl: clean };
}
