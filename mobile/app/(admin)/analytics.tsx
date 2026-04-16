import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Divider } from '../../components/ui/Divider';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import { MOCK_ANALYTICS } from '../../constants/mockData';
import colors from '../../constants/colors';
import { useTenant } from '../../context/TenantContext';

export default function AdminAnalyticsScreen() {
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const data = tenant ? MOCK_ANALYTICS[tenant.id] : null;

  if (!data) {
    return (
      <ThemedView style={styles.root} accessibilityLabel="screen-admin-analytics" testID="screen-admin-analytics">
        <AppHeader title="Reports" />
        <ThemedText variant="body" color={theme.mutedForeground} style={styles.center}>
          No analytics data available.
        </ThemedText>
      </ThemedView>
    );
  }

  const proofCoverageRate = Math.round((data.uploadedProofs / data.totalProofs) * 100);
  const metrics = [
    { label: 'Total Campaigns', value: String(data.totalCampaigns), icon: 'grid' as const },
    { label: 'Active', value: String(data.activeCampaigns), icon: 'activity' as const },
    { label: 'Completed', value: String(data.completedCampaigns), icon: 'check-circle' as const },
    { label: 'Active Drivers', value: String(data.activeDrivers), icon: 'truck' as const },
    { label: 'Miles Driven', value: data.totalMilesDriven.toLocaleString(), icon: 'navigation' as const },
    { label: 'Active Clients', value: String(data.activeClients), icon: 'briefcase' as const },
  ];

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-admin-analytics" testID="screen-admin-analytics">
      <AppHeader title="Reports" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.periodRow}>
          <ThemedText variant="subheading">{data.period}</ThemedText>
          <Badge label="MOCK DATA" variant="neutral" />
        </View>

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
            <MetricStat label="Uploaded" value={data.uploadedProofs} color="#166534" />
            <MetricStat label="Visible to Admin" value={data.uploadedProofs} color={theme.primary} />
            <MetricStat label="Visible to Client" value={data.uploadedProofs} color={theme.accent} />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.rateRow}>
            <ThemedText variant="label">Upload Coverage</ThemedText>
            <ThemedText variant="label" color={theme.primary}>{proofCoverageRate}%</ThemedText>
          </View>
          <ProgressBar value={proofCoverageRate} />
        </Card>

        <Card style={styles.section}>
          <ThemedText variant="subheading">Top Campaigns</ThemedText>
          {data.topCampaigns.map((campaign, index) => (
            <View key={campaign.name}>
              <View style={styles.campaignItem}>
                <View style={styles.campaignInfo}>
                  <ThemedText variant="label" numberOfLines={1}>{campaign.name}</ThemedText>
                  <ThemedText variant="caption" color={theme.mutedForeground}>{campaign.proofs} proofs</ThemedText>
                </View>
                <View style={styles.campaignMeter}>
                  <ProgressBar value={campaign.completion} height={5} />
                  <ThemedText variant="caption" color={theme.mutedForeground} style={styles.pct}>
                    {campaign.completion}%
                  </ThemedText>
                </View>
              </View>
              {index < data.topCampaigns.length - 1 ? <Divider style={styles.divider} /> : null}
            </View>
          ))}
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

function MetricStat({ label, value, color }: { label: string; value: number; color: string }) {
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
  periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
});
