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
import { formatDate, progressPercent } from '../../constants/mockData';
import colors from '../../constants/colors';
import { useTenant } from '../../context/TenantContext';
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

const TIMELINE_EVENTS = [
  { date: 'Apr 13', label: '14 proofs submitted', icon: 'image' as const, type: 'proof' },
  { date: 'Apr 12', label: '29 proofs uploaded and shared', icon: 'image' as const, type: 'proof' },
  { date: 'Apr 11', label: '35 proofs submitted', icon: 'image' as const, type: 'proof' },
  { date: 'Apr 10', label: 'Campaign scheduled', icon: 'calendar' as const, type: 'event' },
  { date: 'Apr 9', label: '31 proofs uploaded and shared', icon: 'image' as const, type: 'proof' },
  { date: 'Apr 7', label: 'Campaign week started', icon: 'play-circle' as const, type: 'event' },
];

export default function ClientTimelineScreen() {
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const { visibleCampaigns: campaigns, visibleProofs, isLoading, error } = useTenantOperationalData();
  const totalProofs = campaigns.reduce((sum, campaign) => sum + campaign.proofsSubmitted, 0);
  const totalRequired = campaigns.reduce((sum, campaign) => sum + campaign.proofsRequired, 0);
  const overallPct = progressPercent(totalProofs, totalRequired);
  const uploadedProofs = visibleProofs.length;

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-client-timeline" testID="screen-client-timeline">
      <AppHeader title="Timeline" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <ThemedText variant="subheading">Campaign Summary</ThemedText>
            <Badge label="LIVE DEMO" variant="neutral" />
          </View>

          <View style={styles.summaryMetrics}>
            <SummaryMetric label="Total Campaigns" value={campaigns.length} />
            <SummaryMetric label="Proofs Submitted" value={totalProofs} />
            <SummaryMetric label="Uploaded" value={uploadedProofs} />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <ThemedText variant="label">Overall Completion</ThemedText>
              <ThemedText variant="label" color={theme.primary}>{overallPct}%</ThemedText>
            </View>
            <ProgressBar value={overallPct} height={8} />
            <ThemedText variant="caption" color={theme.mutedForeground}>
              {totalProofs} of {totalRequired} proofs required
            </ThemedText>
          </View>
        </Card>

        <View style={styles.section}>
          <ThemedText variant="subheading">Campaign Status</ThemedText>
          {isLoading ? (
            <ThemedText variant="body" color={theme.mutedForeground}>Loading campaign status...</ThemedText>
          ) : null}
          {error ? (
            <ThemedText variant="body" color={theme.mutedForeground}>{error}</ThemedText>
          ) : null}
          <Card padded={false}>
            {campaigns.map((campaign, index) => {
              const pct = progressPercent(campaign.proofsSubmitted, campaign.proofsRequired);
              return (
                <View key={campaign.id}>
                  <View style={styles.campaignRow}>
                    <View style={styles.campaignInfo}>
                      <ThemedText variant="label" numberOfLines={1}>{campaign.name}</ThemedText>
                      <ThemedText variant="caption" color={theme.mutedForeground}>
                        {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
                      </ThemedText>
                      <View style={styles.campaignProgress}>
                        <ProgressBar value={pct} height={5} style={styles.progressBar} />
                        <ThemedText variant="caption" color={theme.primary}>{pct}%</ThemedText>
                      </View>
                    </View>
                    <Badge label={campaign.status} variant={campaign.status === 'active' ? 'success' : campaign.status === 'completed' ? 'neutral' : 'warning'} />
                  </View>
                  {index < campaigns.length - 1 ? <Divider inset={16} /> : null}
                </View>
              );
            })}
          </Card>
        </View>

        <View style={styles.section}>
          <ThemedText variant="subheading">Activity Timeline</ThemedText>
          <Card>
            {TIMELINE_EVENTS.map((event, index) => (
              <View key={`${event.date}-${index}`}>
                <View style={styles.timelineRow}>
                  <View style={[styles.timelineIcon, { backgroundColor: `${theme.primary}14` }]}>
                    <Feather
                      name={event.icon}
                      size={13}
                      color={theme.primary}
                    />
                  </View>
                  <View style={styles.timelineContent}>
                    <ThemedText variant="label" numberOfLines={2}>{event.label}</ThemedText>
                    <ThemedText variant="caption" color={theme.mutedForeground}>{event.date}</ThemedText>
                  </View>
                </View>
                {index < TIMELINE_EVENTS.length - 1 ? <View style={[styles.timelineLine, { backgroundColor: theme.border }]} /> : null}
              </View>
            ))}
          </Card>
        </View>

        <ThemedText variant="caption" color={theme.mutedForeground} style={styles.note}>
          Summary data is live demo data. Export and timeline events remain placeholder-only.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <ThemedText variant="heading" style={styles.metricValue}>{value}</ThemedText>
      <ThemedText variant="caption" color={colors.light.mutedForeground}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 20 },
  summaryCard: { gap: 16 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryMetrics: { flexDirection: 'row', justifyContent: 'space-around' },
  metric: { alignItems: 'center', gap: 4 },
  metricValue: { fontSize: 24, lineHeight: 30 },
  divider: { marginVertical: 4 },
  progressSection: { gap: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { gap: 12 },
  campaignRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  campaignInfo: { flex: 1, gap: 6 },
  campaignProgress: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  timelineIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  timelineContent: { flex: 1, gap: 2, paddingTop: 2 },
  timelineLine: { width: 1, height: 12, marginLeft: 14 },
  note: { textAlign: 'center' },
});
