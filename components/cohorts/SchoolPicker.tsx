import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Image, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '@/constants/theme';
import { universities, universityLogos } from '@/constants/universities';

// searchable school list with logos
export function SchoolPicker({
  visible,
  onClose,
  onSelect
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (slug: string, name: string) => void;
}) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return universities;
    return universities.filter((uni) => uni.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable accessibilityLabel="Close school picker" onPress={onClose} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Choose your school</Text>
            <Pressable accessibilityLabel="Close" hitSlop={10} onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={23} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              accessibilityLabel="Search schools"
              placeholder="Search schools…"
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              style={styles.searchInput}
            />
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => item.slug}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>No school matches that search.</Text>}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.name}
                onPress={() => {
                  onSelect(item.slug, item.name);
                  setQuery('');
                  onClose();
                }}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <Image source={universityLogos[item.slug]} style={styles.logo} resizeMode="contain" />
                <Text numberOfLines={1} style={styles.rowName}>{item.name}</Text>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17, 28, 22, 0.42)' },
  sheet: {
    width: '100%',
    maxWidth: 520,
    height: '80%',
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10
  },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#CBD2CE', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '900' },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF3F0'
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginTop: 12,
    marginBottom: 6
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as unknown as undefined } : null)
  },
  list: { flex: 1 },
  empty: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', paddingVertical: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2EF'
  },
  logo: { width: 34, height: 34 },
  rowName: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  pressed: { opacity: 0.6 }
});
