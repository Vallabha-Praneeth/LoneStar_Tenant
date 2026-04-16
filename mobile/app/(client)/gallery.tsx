import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { ProofThumbnail } from '../../components/ProofThumbnail';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Divider } from '../../components/ui/Divider';
import { EmptyState } from '../../components/ui/EmptyState';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import { type Proof, formatTime } from '../../constants/mockData';
import colors from '../../constants/colors';
import type { TenantTheme } from '../../constants/tenants';
import { useTenant } from '../../context/TenantContext';
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

type Filter = 'all' | 'uploaded';

export default function ClientGalleryScreen() {
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const [filter, setFilter] = React.useState<Filter>('all');
  const { visibleProofs: proofs, isLoading, error } = useTenantOperationalData();
  const filtered = filter === 'all' ? proofs : proofs.filter((proof) => proof.status === filter);

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-client-gallery" testID="screen-client-gallery">
      <AppHeader title="Proof Gallery" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
        <SegmentedControl
          segments={[
            { key: 'all', label: `All (${proofs.length})` },
            { key: 'uploaded', label: 'Uploaded' },
          ]}
          value={filter}
          onChange={setFilter}
        />

        {isLoading ? (
          <ThemedText variant="body" color={theme.mutedForeground}>Loading proof gallery...</ThemedText>
        ) : null}
        {error ? (
          <ThemedText variant="body" color={theme.mutedForeground}>{error}</ThemedText>
        ) : null}
        {!isLoading && !error && filtered.length === 0 ? (
          <EmptyState icon="image" title="No proofs" message="No proof records match this filter." />
        ) : (
          <Card padded={false} style={styles.list}>
            {filtered.map((proof, index) => (
              <ProofGalleryRow key={proof.id} proof={proof} theme={theme} radius={tenant?.radius ?? 8} isLast={index === filtered.length - 1} />
            ))}
          </Card>
        )}

        <ThemedText variant="caption" color={theme.mutedForeground} style={styles.note}>
          Uploaded proof photos are stored privately and streamed into the app for tenant-scoped review.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

function ProofGalleryRow({
  proof,
  theme,
  radius,
  isLast,
}: {
  proof: Proof;
  theme: TenantTheme;
  radius: number;
  isLast: boolean;
}) {
  return (
    <>
      <View style={styles.row}>
        <ProofThumbnail storagePath={proof.storagePath} size={48} borderRadius={radius / 2} />
        <View style={styles.rowContent}>
          <View style={styles.rowHeader}>
            <ThemedText variant="label" style={styles.flex} numberOfLines={1}>{proof.location}</ThemedText>
            <Badge label={proof.status} variant="success" />
          </View>
          <ThemedText variant="caption" color={theme.mutedForeground}>{proof.campaignName}</ThemedText>
          <View style={styles.meta}>
            <Feather name="user" size={11} color={theme.mutedForeground} />
            <ThemedText variant="caption" color={theme.mutedForeground}>{proof.driverName}</ThemedText>
            <ThemedText variant="caption" color={theme.mutedForeground}>·</ThemedText>
            <ThemedText variant="caption" color={theme.mutedForeground}>{formatTime(proof.submittedAt)}</ThemedText>
          </View>
          {proof.notes ? <ThemedText variant="caption" color={theme.mutedForeground} numberOfLines={1}>{proof.notes}</ThemedText> : null}
        </View>
      </View>
      {!isLast ? <Divider inset={76} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  list: { overflow: 'hidden' },
  row: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 12, alignItems: 'flex-start' },
  rowContent: { flex: 1, gap: 4 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flex: { flex: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  note: { textAlign: 'center' },
});
