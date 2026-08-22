import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const ERASED_ITEMS = [
  'Your goal, theme, and unlock-difficulty settings',
  'Blocked apps and schedules',
  'Progress history, streaks, and reflections',
  'Your message to your future self',
  'Progress photos stored on this device',
];

/** Everything this app stores lives only on-device (see AccountScreen — no
 *  server sync exists), so "delete account" here means what it says:
 *  wipe the local store and hand back a clean install. There's no backend
 *  record to also delete, which is worth saying plainly rather than
 *  implying a server-side deletion that wouldn't be true. */
export default function DeleteAccountScreen({
  onBack,
  onConfirmDelete,
}: {
  onBack: () => void;
  onConfirmDelete: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.circleBtn} hitSlop={10}>
          <Text style={styles.headerGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <Ionicons name="trash-outline" size={40} color="#FF6B6B" />
        </View>

        <Text style={styles.heading}>This can't be undone</Text>
        <Text style={styles.sub}>
          Everything this app has stored lives only on this device — there's no server copy to delete
          separately. Deleting here erases it for good, right now.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What gets erased</Text>
          {ERASED_ITEMS.map((item) => (
            <View key={item} style={styles.itemRow}>
              <Ionicons name="close-circle" size={16} color="#FF6B6B" />
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>

        {!confirming ? (
          <Pressable style={styles.deleteBtn} onPress={() => setConfirming(true)}>
            <Text style={styles.deleteBtnText}>Delete my account and data</Text>
          </Pressable>
        ) : (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Are you sure?</Text>
            <Text style={styles.confirmBody}>
              This deletes everything listed above immediately. There is no recovery.
            </Text>
            <Pressable
              disabled={deleting}
              style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
              onPress={async () => {
                setDeleting(true);
                await onConfirmDelete();
              }}
            >
              <Text style={styles.deleteBtnText}>{deleting ? 'Deleting…' : 'Yes, delete everything'}</Text>
            </Pressable>
            <Pressable disabled={deleting} style={styles.cancelBtn} onPress={() => setConfirming(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8 },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGlyph: { color: colors.text, fontSize: 19 },
  headerTitle: { flex: 1, color: colors.text, fontSize: 19, fontWeight: '700', textAlign: 'center' },
  scroll: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 60, alignItems: 'center' },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,107,107,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 18,
  },
  heading: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  sub: { color: colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 10, maxWidth: 320 },
  card: {
    width: '100%',
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 18,
    marginTop: 26,
  },
  cardTitle: { color: colors.text, fontSize: 14.5, fontWeight: '700', marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  itemText: { color: colors.textDim, fontSize: 13.5, flex: 1 },
  deleteBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    marginTop: 28,
  },
  deleteBtnDisabled: { opacity: 0.6 },
  deleteBtnText: { color: '#ffffff', fontSize: 15.5, fontWeight: '700' },
  confirmCard: { width: '100%', marginTop: 28, alignItems: 'center' },
  confirmTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 8 },
  confirmBody: { color: colors.textDim, fontSize: 13.5, textAlign: 'center', lineHeight: 19, marginBottom: 4 },
  cancelBtn: { paddingVertical: 16, alignItems: 'center' },
  cancelBtnText: { color: colors.textDim, fontSize: 15, fontWeight: '600' },
});
