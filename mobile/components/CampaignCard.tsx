import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import colors from '../constants/colors';
import { type Campaign, formatDate, progressPercent } from '../constants/mockData';
import { useTenant } from '../context/TenantContext';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { ProgressBar } from './ui/ProgressBar';
import { ThemedText } from './ui/ThemedText';

const STATUS_VARIANT: Record<Campaign['status'], 'success' | 'default' | 'neutral' | 'warning'> = {
  active: 'success',
  scheduled: 'warning',
  completed: 'neutral',
  paused: 'neutral',
};

const STATUS_LABEL: Record<Campaign['status'], string> = {
  active: 'Active',
  scheduled: 'Scheduled',
  completed: 'Completed',
  paused: 'Paused',
};

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const { tenant } = useTenant();
  const theme = tenant?.theme ?? colors.light;
  const pct = progressPercent(campaign.proofsSubmitted, campaign.proofsRequired);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/campaign/[id]', params: { id: campaign.id } })}
      accessible
      accessibilityLabel={`campaign-card-${campaign.id}`}
      testID={`campaign-card-${campaign.id}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <ThemedText variant="subheading" numberOfLines={1} style={styles.name}>
              {campaign.name}
            </ThemedText>
            <ThemedText variant="caption" color={theme.mutedForeground}>
              {campaign.client}
            </ThemedText>
          </View>
          <View style={styles.chevronWrap}>
            <Badge label={STATUS_LABEL[campaign.status]} variant={STATUS_VARIANT[campaign.status]} />
          </View>
        </View>

        <View style={styles.progress}>
          <ProgressBar value={pct} />
          <View style={styles.progressLabels}>
            <ThemedText variant="caption" color={theme.mutedForeground}>
              {campaign.proofsSubmitted}/{campaign.proofsRequired} proofs
            </ThemedText>
            <ThemedText variant="caption" color={theme.mutedForeground}>
              {pct}%
            </ThemedText>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Feather name="calendar" size={12} color={theme.mutedForeground} />
            <ThemedText variant="caption" color={theme.mutedForeground} style={styles.footerLabel}>
              {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
            </ThemedText>
          </View>
          <View style={styles.footerItem}>
            <Feather name="map" size={12} color={theme.mutedForeground} />
            <ThemedText variant="caption" color={theme.mutedForeground} style={styles.footerLabel}>
              {campaign.routes} routes
            </ThemedText>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  titleGroup: {
    flex: 1,
    gap: 2,
  },
  name: {
    flex: 1,
  },
  chevronWrap: {
    paddingTop: 2,
  },
  progress: {
    gap: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerLabel: {
    marginLeft: 2,
  },
});
