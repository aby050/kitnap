import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Modal from './Modal';
import Icon from '../ui/Icon';
import BailoutGlyph from './BailoutGlyph';
import { palette, radius, space, type } from '../design/tokens';

/**
 * The header key opens this rather than pushing a whole screen: checking how
 * many ways out you have left is a glance, not a destination.
 *
 * With none left the sheet leads with the purchase action; with some in hand
 * it stays quiet and buying is a secondary link, so it never nags someone who
 * is already covered.
 */
export default function BailoutSheet({
  balance,
  onBuy,
  onClose,
  fromPrice,
}: {
  balance: number;
  /** Opens the real store screen. */
  onBuy: () => void;
  onClose: () => void;
  /** Cheapest pack's localised price, from the store. Naming the number here
   *  means the buy button isn't a blind tap — absent until the store answers,
   *  and the label falls back to the plain wording. */
  fromPrice?: string | null;
}) {
  const empty = balance <= 0;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />

        <View style={styles.sheet}>
          <Pressable onPress={onClose} style={styles.close} hitSlop={8} accessibilityLabel="Close">
            <Icon name="close" size={16} color={palette.text} strokeWidth={1.8} />
          </Pressable>

          <View style={styles.hero}>
            <BailoutGlyph size={52} />
            <Text style={styles.balance}>{balance}</Text>
            <Text style={styles.balanceLabel}>
              {balance === 1 ? 'Bailout available' : 'Bailouts available'}
            </Text>
          </View>

          <Text style={styles.body}>
            {empty
              ? "You're out of Bailouts. A locked session can't be ended early without one — that's the point of it, so there's no free way around it."
              : 'Once a session is locked, a Bailout is the way out early. Use one and it ends immediately, no questions asked.'}
          </Text>

          {empty ? (
            <Pressable style={styles.primaryBtn} onPress={onBuy}>
              <Text style={styles.primaryLabel}>
                {fromPrice ? `Get more — from ${fromPrice}` : 'Get more Bailouts'}
              </Text>
            </Pressable>
          ) : (
            <>
              <Pressable style={styles.secondaryBtn} onPress={onClose}>
                <Text style={styles.secondaryLabel}>Got it</Text>
              </Pressable>
              <Pressable onPress={onBuy} hitSlop={8}>
                <Text style={styles.link}>Get more</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: palette.scrim,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  sheet: {
    backgroundColor: palette.surfaceRaised,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.lg,
    alignItems: 'center',
    gap: space.sm,
  },
  close: { position: 'absolute', top: space.md, right: space.md, zIndex: 2 },
  hero: { alignItems: 'center', gap: 2, marginTop: space.xs },
  balance: { ...type.hero, marginTop: space.sm },
  balanceLabel: { ...type.sub },
  body: {
    ...type.body,
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: space.xs,
    marginBottom: space.sm,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    backgroundColor: palette.surfaceInverse,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryLabel: { color: palette.textInverse, fontSize: 15.5, fontWeight: '700' },
  secondaryBtn: {
    alignSelf: 'stretch',
    backgroundColor: palette.surfaceHigh,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryLabel: { color: palette.text, fontSize: 15.5, fontWeight: '700' },
  link: {
    color: palette.textTertiary,
    fontSize: 13.5,
    fontWeight: '600',
    paddingVertical: space.xs,
  },
});
