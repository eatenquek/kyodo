import * as ImagePicker from 'expo-image-picker';

// opens the image picker and returns a compressed square data URI, or null if cancelled
export async function pickAvatar(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.4,
    base64: true
  });

  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.base64) return `data:image/jpeg;base64,${asset.base64}`;
  return asset.uri ?? null;
}
