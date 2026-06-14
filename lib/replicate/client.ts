import Replicate from "replicate";

let cached: Replicate | null = null;
function getReplicate(): Replicate {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN hiányzik — kép-generálás nem elérhető");
  }
  if (!cached) cached = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  return cached;
}

export const replicate = new Proxy({} as Replicate, {
  get(_target, prop) {
    return Reflect.get(getReplicate() as unknown as object, prop);
  },
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
