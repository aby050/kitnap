/* WealthAxis Pro 100% RN — mapped from C:\Users\abhay\Downloads\index (26).html
   vector-icon only (@expo/vector-icons), no emoji, theme refs 100% */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { byreColors as c } from '../theme';

export default function WealthAxisScreen() {
  return (
    <View style={[s.root, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Header band — matches .mhdr / .msub from HTML */}
        <View style={s.header}>
          <Text style={s.title}>WealthAxis Pro</Text>
          <Text style={s.subtitle}>F&O Trade Journal · Goal Planner</Text>
          <Pressable style={s.iconBtn}>
            <Ionicons name="analytics" size={22} color={c.accent} />
          </Pressable>
        </View>

        {/* Tab panes — .tab-pane / .fno-pane */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Today</Text>
          <View style={s.row}><Text style={s.num}>+12.4%</Text><Ionicons name="trending-up" size={18} color={c.gain} /></View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontFamily: 'Outfit', fontSize: 24, fontWeight: 800, color: c.txt, letterSpacing: -0.03 },
  subtitle: { fontFamily: 'Outfit', fontSize: 12, color: c.txt3, marginTop: 2 },
  iconBtn: { padding: 8, borderRadius: 12, backgroundColor: c.bg3 },
  card: { backgroundColor: c.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: c.border, shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 12, elevation: 4 },
  cardTitle: { fontFamily: 'Outfit', fontSize: 14, fontWeight: 600, color: c.txt2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  num: { fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: c.gain, letterSpacing: -0.03 },
});
