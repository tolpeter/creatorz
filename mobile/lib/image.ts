import * as ImagePicker from "expo-image-picker";

/**
 * Kép választása a galériából (négyzetes vágással), base64-ben.
 * Visszaad: { base64, ext } vagy null, ha a felhasználó megszakította / nincs engedély.
 */
export async function pickImage(): Promise<{ base64: string; ext: string } | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });
  if (res.canceled || !res.assets?.[0]?.base64) return null;

  const asset = res.assets[0];
  const uri = asset.uri ?? "";
  const ext = (uri.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z]/g, "") || "jpg";
  return { base64: asset.base64!, ext: ext === "heif" ? "heic" : ext };
}
