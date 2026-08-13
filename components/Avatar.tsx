import { Image, StyleSheet, Text, View } from 'react-native';

// shows the uploaded picture, or the name's initial as a fallback
export function Avatar({
  name,
  uri,
  size = 40,
  color = '#DDF2E9',
  textColor = '#17392F'
}: {
  name: string;
  uri?: string;
  size?: number;
  color?: string;
  textColor?: string;
}) {
  const radius = size / 2;

  if (uri) {
    return (
      <Image
        accessibilityRole="image"
        accessibilityLabel={name ? `${name}'s profile picture` : 'Profile picture'}
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  return (
    <View
      accessibilityLabel={name ? `${name}, no profile picture` : 'No profile picture'}
      style={[styles.fallback, { width: size, height: size, borderRadius: radius, backgroundColor: color }]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.4, color: textColor }]}>
        {(name || '?').slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontWeight: '900' }
});
