import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/ui/Card';
import { Divider } from '../../components/ui/Divider';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import colors from '../../constants/colors';
import { useTenant } from '../../context/TenantContext';
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

export default function AdminAnalyticsScreen() {
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const { campaigns, drivers, clients, proofs, shifts, isLoading, error } = useTenantOperationalData();

  if (isLoading) {
    return (
      <ThemedView style={styles.root} accessibilityLabel="screen-admin-analytics" testID="screen-admin-analytics">
        <AppHeader title="Reports" />
        <ThemedText variant="body" color={theme.mutedForeground} style={styles.center}>
          Loading analytics…
        </ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.root} accessibilityLabel="screen-admin-analytics" testID="screen-admin-analytics">
        <AppHeader title="Reports" />
        <ThemedText variant="body" color={theme.mutedForeground} style={styles.center}>
          {error}
        </ThemedText>
      </ThemedView>
    );
  }

  // Computed KPIs
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
  const completedCampaigns = campaigns.filter((c) => c.status === 'completed').length;
  const activeDrivers = drivers.filter((d) => d.status === 'active').length;
  const activeClients = clients.filter((c) => c.status === 'active').length;
  const uploadedProofs = proofs.length;
  const totalProofsRequired = campaigns.reduce((sum, c) => sum + c.proofsRequired, 0);
  const proofCoverageRate = totalProofsRequired > 0 ? Math.round((uploadedProofs / totalProofsRequired) * 100) : 0;

  // Top 5 campaigns by proof completion pct
  const topCampaigns = campaigns
    .map((c) => ({
      name: c.name,
      proofs: c.proofsSubmitted,
      required: c.proofsRequired,
      completion: c.proofsRequired > 0 ? Math.round((c.proofsSubmitted / c.proofsRequired) * 100) : 0,
    }))
    .sort((a, b) => b.completion - a.completion)
    .slice(0, 5);

  // Total hours worked from shifts
  const totalHours = shifts.reduce((sum, shift) => {
    if (!shift.startTime || !shift.endTime) return sum;
    // parse HH:MM strings
    const [sh, sm] = shift.startTime.split(':').map(Number);
    const [eh, em] = shift.endTime.split(':').map(Number);
    const diffH = (eh * 60 + em - (sh * 60 + sm)) / 60;
    return sum + (diffH > 0 ? diffH : 0);
  }, 0);

  const metrics = [
    { label: 'Total Campaigns', value: String(totalCampaigns), icon: 'grid' as const },
    { label: 'Active', value: String(activeCampaigns), icon: 'activity' as const },
    { label: 'Completed', value: String(completedCampaigns), icon: 'check-circle' as const },
    { label: 'Active Drivers', value: String(activeDrivers), icon: 'truck' as const },
    { label: 'Active Clients', value: String(activeClients), icon: 'briefcase' as const },
    { label: 'Shift Hours', value: totalHours > 0 ? totalHours.toFixed(1) : '—', icon: 'clock' as const },
  ];

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-admin-analytics" testID="screen-admin-analytics">
      <AppHeader title="Reports" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>

        <View style={styles.metricsGrid}>
          {metrics.map((metric) => (
            <Card key={metric.label} style={styles.metricCard}>
              <Feather name={metric.icon} size={14} color={theme.primary} />
              <ThemedText variant="heading" style={styles.metricValue}>{metric.value}</ThemedText>
              <ThemedText variant="caption" color={theme.mutedForeground} style={styles.metricLabel}>
                {metric.label}
              </ThemedText>
            </Card>
          ))}
        </View>

        <Card style={styles.section}>
          <ThemedText variant="subheading">Proof Summary</ThemedText>
          <View style={styles.proofRow}>
            <MetricStat label="Uploaded" value={uploadedProofs} color="#166534" />
            <MetricStat label="Required" value={totalProofsRequired} color={theme.primary} />
            <MetricStat label="Coverage" value={`${proofCoverageRate}%`} color={theme.accent} />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.rateRow}>
            <ThemedText variant="label">Upload Coverage</ThemedText>
            <ThemedText variant="label" color={theme.primary}>{proofCoverageRate}%</ThemedText>
          </View>
          <ProgressBar value={proofCoverageRate} />
        </Card>

        {topCampaigns.length > 0 ? (
          <Card style={styles.section}>
            <ThemedText variant="subheading">Top Campaigns by Proof Completion</ThemedText>
            {topCampaigns.map((campaign, index) => (
              <View key={campaign.name}>
                <View style={styles.campaignItem}>
                  <View style={styles.campaignInfo}>
                    <ThemedText variant="label" numberOfLines={1}>{campaign.name}</ThemedText>
                    <ThemedText variant="caption" color={theme.mutedForeground}>
                      {campaign.proofs} of {campaign.required} proofs
                    </ThemedText>
                  </View>
                  <View style={styles.campaignMeter}>
                    <ProgressBar value={campaign.completion} height={5} />
                    <ThemedText variant="caption" color={theme.mutedForeground} style={styles.pct}>
                      {campaign.completion}%
                    </ThemedText>
                  </View>
                </View>
                {index < topCampaigns.length - 1 ? <Divider style={styles.divider} /> : null}
              </View>
            ))}
          </Card>
        ) : (
          <Card style={styles.section}>
            <ThemedText variant="body" color={theme.mutedForeground} style={styles.emptyNote}>
              No campaigns yet. Create your first campaign to see analytics here.
            </ThemedText>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function MetricStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={styles.proofStat}>
      <ThemedText variant="heading" style={[styles.metricLarge, { color }]}>{value}</ThemedText>
      <ThemedText variant="caption" color={colors.light.mutedForeground}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { textAlign: 'center', marginTop: 40 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricCard: {
    width: '31%',
    alignItems: 'center',
    gap: 4,
    padding: 12,
    minWidth: 90,
  },
  metricValue: { fontSize: 20, lineHeight: 26 },
  metricLabel: { textAlign: 'center' },
  metricLarge: { fontSize: 24, lineHeight: 30 },
  section: { gap: 14 },
  proofRow: { flexDirection: 'row', justifyContent: 'space-around' },
  proofStat: { alignItems: 'center', gap: 4 },
  divider: { marginVertical: 6 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  campaignItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  campaignInfo: { flex: 1, gap: 2 },
  campaignMeter: { width: 80, gap: 4 },
  pct: { textAlign: 'right' },
  emptyNote: { textAlign: 'center' },
});
