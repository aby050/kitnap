import React from 'react';
import { Modal as RNModal, ModalProps, StyleSheet, View } from 'react-native';
import { CONTENT_MAX_W, IS_TABLET } from '../layout';

/**
 * Drop-in for React Native's Modal. A modal renders outside the app root, so
 * on iPad it would skip the phone-width column (src/layout.ts) and stretch a
 * phone sheet across 13 inches. On iPad this keeps the content in the column
 * and dims the margins either side; on phones it is the plain Modal.
 */
export default function Modal({ children, ...props }: ModalProps) {
  if (!IS_TABLET) return <RNModal {...props}>{children}</RNModal>;
  return (
    <RNModal {...props}>
      <View style={[styles.frame, props.transparent ? styles.dim : styles.solid]}>
        <View style={styles.column}>{children}</View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, alignItems: 'center' },
  dim: { backgroundColor: 'rgba(0,0,0,0.55)' },
  solid: { backgroundColor: '#000' },
  column: { flex: 1, width: '100%', maxWidth: CONTENT_MAX_W },
});
