import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import LineArt, { ArtName } from './LineArt';

const NAMES: ArtName[] = ['sprout', 'cat', 'door', 'nightBed', 'gauge', 'chart', 'handPhone', 'shield', 'bellPhone', 'sun'];

/** Dev-only (web `?art=1`): every animated scene on one page for review. */
export default function ArtGallery() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F1EFEB' }} contentContainerStyle={{ padding: 16, gap: 8 }}>
      {NAMES.map((n) => (
        <View key={n}>
          <Text style={{ color: '#5E636B', fontSize: 12 }}>{n}</Text>
          <LineArt name={n} height={200} />
        </View>
      ))}
    </ScrollView>
  );
}
