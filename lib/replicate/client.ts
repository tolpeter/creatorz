import Replicate from "replicate";

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

/**
 * FLUX.1 [schnell] — gyors, olcsó (~$0.003/kép). Egy kép URL-jét adja vissza.
 */
export async function generateImage(
  prompt: string,
  opts?: { aspectRatio?: AspectRatio }
): Promise<string> {
  const output = await replicate.run("black-forest-labs/flux-schnell", {
    input: {
      prompt,
      aspect_ratio: opts?.aspectRatio ?? "1:1",
      output_format: "webp",
      output_quality: 90,
      num_outputs: 1,
      go_fast: true,
    },
  });

  const first = Array.isArray(output) ? output[0] : output;
  if (typeof first === "string") return first;
  // Újabb replicate SDK: FileOutput, .url() metódussal
  if (first && typeof (first as { url?: unknown }).url === "function") {
    return (first as { url: () => URL | string }).url().toString();
  }
  if (first instanceof URL) return first.toString();
  return String(first);
}
