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
import { formatDate, formatTime } from '../../constants/mockData';
import colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

type Segment = 'shifts' | 'proofs';

export default function DriverHistoryScreen() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const [segment, setSegment] = React.useState<Segment>('shifts');
  const { visibleShifts, visibleProofs, isLoading, error } = useTenantOperationalData();
  const shifts = visibleShifts.filter((shift) => shift.status === 'completed');
  const proofs = visibleProofs;

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-driver-history" testID="screen-driver-history">
      <AppHeader title="History" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
        <SegmentedControl
          segments={[
            { key: 'shifts', label: `Shifts (${shifts.length})` },
            { key: 'proofs', label: `Proofs (${proofs.length})` },
          ]}
          value={segment}
          onChange={setSegment}
        />

        {isLoading ? (
          <ThemedText variant="body" color={theme.mutedForeground}>Loading history...</ThemedText>
        ) : null}
        {error ? (
          <ThemedText variant="body" color={theme.mutedForeground}>{error}</ThemedText>
        ) : null}
        {segment === 'shifts' ? (
          shifts.length === 0 ? (
            <EmptyState icon="clock" title="No completed shifts" />
          ) : (
            <Card padded={false}>
              {shifts.map((shift, index) => (
                <View key={shift.id}>
                  <View style={styles.row}>
                    <View style={styles.iconWrap}>
                      <Feather name="truck" size={15} color={theme.mutedForeground} />
                    </View>
                    <View style={styles.contentWrap}>
                      <View style={styles.headerRow}>
                        <ThemedText variant="label" style={styles.flex} numberOfLines={1}>
                          {shift.campaignName}
                        </ThemedText>
                        <Badge label="Completed" variant="neutral" />
                      </View>
                      <ThemedText variant="caption" color={theme.mutedForeground}>
                        {formatDate(shift.date)} · {shift.startTime} - {shift.endTime}
                      </ThemedText>
                      {shift.startOdometer !== null && shift.endOdometer !== null ? (
                        <ThemedText variant="caption" color={theme.mutedForeground}>
                          {(shift.endOdometer - shift.startOdometer).toLocaleString()} mi driven
                        </ThemedText>
                      ) : null}
                    </View>
                  </View>
                  {index < shifts.length - 1 ? <Divider inset={48} /> : null}
                </View>
              ))}
            </Card>
          )
        ) : proofs.length === 0 ? (
          <EmptyState icon="image" title="No proofs submitted" />
        ) : (
          <Card padded={false}>
            {proofs.map((proof, index) => (
              <View key={proof.id}>
                <View style={styles.row}>
                  <ProofThumbnail storagePath={proof.storagePath} size={36} />
                  <View style={styles.contentWrap}>
                    <View style={styles.headerRow}>
                      <ThemedText variant="label" style={styles.flex} numberOfLines={1}>{proof.location}</ThemedText>
                      <Badge label={proof.status} variant="success" />
                    </View>
                    <ThemedText variant="caption" color={theme.mutedForeground}>{proof.campaignName}</ThemedText>
                    <ThemedText variant="caption" color={theme.mutedForeground}>{formatTime(proof.submittedAt)}</ThemedText>
                    {proof.notes ? <ThemedText variant="caption" color={theme.mutedForeground} numberOfLines={1}>{proof.notes}</ThemedText> : null}
                  </View>
                </View>
                {index < proofs.length - 1 ? <Divider inset={48} /> : null}
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  row: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  iconWrap: { width: 24, alignItems: 'center', paddingTop: 2 },
  contentWrap: { flex: 1, gap: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flex: { flex: 1 },
});
