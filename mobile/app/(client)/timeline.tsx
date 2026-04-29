import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Divider } from '../../components/ui/Divider';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import { formatDate, progressPercent } from '../../constants/mockData';
import colors from '../../constants/colors';
import { fetchSupabaseRows } from '../../constants/supabase';
import type { TenantTheme } from '../../constants/tenants';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

interface ShiftTimingRow {
  id: string;
  campaign_id: string;
  started_at: string;
  ended_at: string | null;
}

type TimingCardData = {
  campaignId: string;
  campaignName: string;
  campaignDate: string;
  startedAt: string | null;
  endedAt: string | null;
  firstPhotoAt: string | null;
};

function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function fmtDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function hoursLabel(startedAt: string, endedAt: string | null): string | null {
  if (!endedAt) return null;
  const mins = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ClientTimelineScreen() {
  const { accessToken, bootstrap } = useAuth();
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const { visibleCampaigns: campaigns, visibleProofs, isLoading, error } = useTenantOperationalData();
  const orgId = bootstrap?.organization?.id ?? null;
  const [shiftTimings, setShiftTimings] = React.useState<ShiftTimingRow[]>([]);
  const [shiftTimingError, setShiftTimingError] = React.useState<string | null>(null);
  const [shiftTimingLoading, setShiftTimingLoading] = React.useState(false);

  const contentStyle = React.useMemo(
    () => [styles.content, { paddingBottom: botPad + 80 }],
    [botPad],
  );

  React.useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!accessToken || !orgId) {
      setShiftTimings([]);
      setShiftTimingError(null);
      return;
    }

    const campaignIds = campaigns.map((campaign) => campaign.id);
    if (campaignIds.length === 0) {
      setShiftTimings([]);
      setShiftTimingError(null);
      return;
    }

    let active = true;
    setShiftTimingLoading(true);
    setShiftTimingError(null);

    fetchSupabaseRows<ShiftTimingRow>('driver_shifts', {
      select: 'id,campaign_id,started_at,ended_at',
      campaign_id: `in.(${campaignIds.join(',')})`,
      organization_id: `eq.${orgId}`,
      order: 'started_at.asc',
    }, accessToken)
      .then((rows) => {
        if (active) {
          setShiftTimings(rows);
        }
      })
      .catch((loadError) => {
        if (active) {
          setShiftTimingError(loadError instanceof Error ? loadError.message : 'Unable to load shift timing.');
          setShiftTimings([]);
        }
      })
      .finally(() => {
        if (active) {
          setShiftTimingLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, campaigns, isLoading, orgId]);

  const firstProofByCampaign = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const proof of visibleProofs) {
      const existing = map.get(proof.campaignId);
      if (!existing || proof.submittedAt < existing) {
        map.set(proof.campaignId, proof.submittedAt);
      }
    }
    return map;
  }, [visibleProofs]);

  const timingCards = React.useMemo<TimingCardData[]>(() => {
    const shiftsByCampaign = shiftTimings.reduce<Map<string, ShiftTimingRow[]>>((map, shift) => {
      const current = map.get(shift.campaign_id) ?? [];
      current.push(shift);
      map.set(shift.campaign_id, current);
      return map;
    }, new Map());

    const cards: TimingCardData[] = [];
    for (const campaign of campaigns) {
      const campaignShifts = shiftsByCampaign.get(campaign.id) ?? [];
      for (const shift of campaignShifts) {
        cards.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          campaignDate: campaign.startDate,
          startedAt: shift.started_at,
          endedAt: shift.ended_at,
          firstPhotoAt: firstProofByCampaign.get(campaign.id) ?? null,
        });
      }
    }
    return cards;
  }, [campaigns, firstProofByCampaign, shiftTimings]);

  const timelineEvents = React.useMemo(() => {
    const proofsByDate = new Map<string, number>();
    for (const proof of visibleProofs) {
      const date = proof.submittedAt.slice(0, 10);
      proofsByDate.set(date, (proofsByDate.get(date) ?? 0) + 1);
    }
    return [...proofsByDate.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 10)
      .map(([date, count]) => ({
        date,
        label: `${count} proof${count !== 1 ? 's' : ''} submitted`,
      }));
  }, [visibleProofs]);

  const showEmptyState = !shiftTimingLoading && timingCards.length === 0 && timelineEvents.length === 0;

  const totalProofs = campaigns.reduce((sum, campaign) => sum + campaign.proofsSubmitted, 0);
  const totalRequired = campaigns.reduce((sum, campaign) => sum + campaign.proofsRequired, 0);
  const overallPct = progressPercent(totalProofs, totalRequired);
  const uploadedProofs = visibleProofs.length;

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-client-timeline" testID="screen-client-timeline">
      <AppHeader title="Timeline" />
      <ScrollView contentContainerStyle={contentStyle} showsVerticalScrollIndicator={false}>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <ThemedText variant="subheading">Campaign Summary</ThemedText>
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
          <ThemedText variant="subheading">Shift Timing</ThemedText>
          {shiftTimingLoading ? (
            <ThemedText variant="body" color={theme.mutedForeground}>Loading shift timing...</ThemedText>
          ) : null}
          {shiftTimingError ? (
            <ThemedText variant="body" color={theme.mutedForeground}>{shiftTimingError}</ThemedText>
          ) : null}
          {timingCards.map((card) => (
            <TimingCard key={`${card.campaignId}-${card.startedAt ?? 'na'}`} card={card} theme={theme} />
          ))}
        </View>

        <View style={styles.section}>
          <ThemedText variant="subheading">Recent Activity</ThemedText>
          {timelineEvents.length === 0 ? (
            <EmptyState icon="image" title="No proof events yet" message="Recent proof submissions will appear here." />
          ) : (
            <Card>
              {timelineEvents.map((event, index) => (
                <View key={`${event.date}-${index}`}>
                  <View style={styles.timelineRow}>
                    <View style={[styles.timelineIcon, { backgroundColor: `${theme.primary}14` }]}>
                      <Feather name="image" size={13} color={theme.primary} />
                    </View>
                    <View style={styles.timelineContent}>
                      <ThemedText variant="label" numberOfLines={2}>{event.label}</ThemedText>
                      <ThemedText variant="caption" color={theme.mutedForeground}>{fmtDate(event.date)}</ThemedText>
                    </View>
                  </View>
                  {index < timelineEvents.length - 1 ? <View style={[styles.timelineLine, { backgroundColor: theme.border }]} /> : null}
                </View>
              ))}
            </Card>
          )}
        </View>

        {showEmptyState ? (
          <EmptyState icon="clock" title="No activity yet" message="Shift timing and proof activity will appear once campaign work begins." />
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

function TimingCard({ card, theme }: { card: TimingCardData; theme: TenantTheme }) {
  const milestones = [
    { label: 'Shift start', time: fmtTime(card.startedAt), done: Boolean(card.startedAt) },
    { label: 'First proof', time: fmtTime(card.firstPhotoAt), done: Boolean(card.firstPhotoAt) },
    { label: 'Shift end', time: fmtTime(card.endedAt), done: Boolean(card.endedAt) },
  ];
  const hours = card.startedAt ? hoursLabel(card.startedAt, card.endedAt) : null;

  return (
    <Card style={styles.timingCard}>
      <View style={styles.timingHeader}>
        <ThemedText variant="label">{card.campaignName}</ThemedText>
        <ThemedText variant="caption" color={theme.mutedForeground}>{fmtDate(card.campaignDate)}</ThemedText>
      </View>
      {milestones.map((milestone, index) => (
        <View key={milestone.label}>
          <View style={styles.milestoneRow}>
            <Feather
              name={milestone.done ? 'check-circle' : 'clock'}
              size={14}
              color={milestone.done ? '#16A34A' : theme.mutedForeground}
            />
            <ThemedText variant="caption" color={theme.mutedForeground}>{milestone.label}</ThemedText>
            <ThemedText variant="caption">{milestone.time}</ThemedText>
          </View>
          {index < milestones.length - 1 ? <Divider style={styles.milestoneDivider} /> : null}
        </View>
      ))}
      {hours ? (
        <View style={styles.hoursRow}>
          <ThemedText variant="caption" color={theme.mutedForeground}>Total hours</ThemedText>
          <ThemedText variant="caption">{hours}</ThemedText>
        </View>
      ) : null}
    </Card>
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
  timingCard: { gap: 8 },
  timingHeader: { gap: 2 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  milestoneDivider: { marginVertical: 2 },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  campaignRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  campaignInfo: { flex: 1, gap: 6 },
  campaignProgress: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  timelineIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  timelineContent: { flex: 1, gap: 2, paddingTop: 2 },
  timelineLine: { width: 1, height: 12, marginLeft: 14 },
});
