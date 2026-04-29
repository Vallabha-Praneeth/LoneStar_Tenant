import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { ProofItem } from '../../components/ProofItem';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

export default function DriverProofsScreen() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const { visibleProofs: proofs, isLoading, error } = useTenantOperationalData();

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-driver-proofs" testID="screen-driver-proofs">
      <AppHeader title="My Proofs" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
        <Button label="Upload New Proof" onPress={() => router.push('/proof-upload')} style={styles.uploadBtn} />

        {isLoading ? (
          <ThemedText variant="body" color={theme.mutedForeground}>Loading proofs...</ThemedText>
        ) : null}
        {error ? (
          <ThemedText variant="body" color={theme.mutedForeground}>{error}</ThemedText>
        ) : null}
        {!isLoading && !error && proofs.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="image" size={32} color={theme.mutedForeground} />
            <ThemedText variant="body" color={theme.mutedForeground}>No proofs submitted yet.</ThemedText>
          </View>
        ) : (
          <Card>
            {proofs.map((proof, index) => (
              <ProofItem key={proof.id} proof={proof} isLast={index === proofs.length - 1} />
            ))}
          </Card>
        )}

        <ThemedText variant="caption" color={theme.mutedForeground} style={styles.note}>
          New uploads post directly to storage and appear here immediately once the campaign photo row is written.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  uploadBtn: { marginBottom: 4 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  note: { textAlign: 'center', marginTop: 8 },
});
