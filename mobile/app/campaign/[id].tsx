import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { AvatarBadge } from '../../components/AvatarBadge';
import { ProofItem } from '../../components/ProofItem';
import { ScreenMarker } from '../../components/ScreenMarker';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Divider } from '../../components/ui/Divider';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import {
  type Campaign,
  formatDate,
  progressPercent,
} from '../../constants/mockData';
import colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

const STATUS_VARIANT: Record<Campaign['status'], 'success' | 'default' | 'neutral' | 'warning'> = {
  active: 'success',
  scheduled: 'warning',
  completed: 'neutral',
  paused: 'neutral',
};

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const { campaigns, visibleCampaigns, proofs: allProofs, routes: allRoutes, isLoading, error } = useTenantOperationalData();
  const campaign = visibleCampaigns.find((candidate) => candidate.id === id) ?? campaigns.find((candidate) => candidate.id === id);
  const proofs = campaign ? allProofs.filter((proof) => proof.campaignId === campaign.id) : [];
  const routes = campaign ? allRoutes.filter((route) => route.campaignId === campaign.id) : [];

  if (!campaign && !isLoading) {
    return (
      <ThemedView style={styles.root}>
        <AppHeader title="Campaign" showBack onBack={() => router.back()} />
        <EmptyState icon="grid" title="Campaign not found" style={styles.notFound} />
      </ThemedView>
    );
  }

  if (!campaign) {
    return (
      <ThemedView style={styles.root}>
        <AppHeader title="Campaign" showBack onBack={() => router.back()} />
        <ThemedText variant="body" color={theme.mutedForeground} style={styles.notFound}>
          {error ?? 'Loading campaign...'}
        </ThemedText>
      </ThemedView>
    );
  }

  const pct = progressPercent(campaign.proofsSubmitted, campaign.proofsRequired);
  return (
    <ThemedView style={styles.root}>
      <ScreenMarker id="screen-campaign-detail" />
      <AppHeader
        title=""
        showBack
        onBack={() => router.back()}
        rightAction={
          user?.role === 'admin' ? (
            <Pressable
              onPress={() => router.push({ pathname: '/(admin)/campaign-form', params: { id: campaign.id } })}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Feather name="edit-2" size={18} color={theme.primary} />
            </Pressable>
          ) : undefined
        }
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <ThemedText variant="heading" style={styles.campaignName}>{campaign.name}</ThemedText>
            <Badge label={campaign.status} variant={STATUS_VARIANT[campaign.status]} />
          </View>
          <ThemedText variant="body" color={theme.mutedForeground}>{campaign.client}</ThemedText>
        </View>

        <ThemedText variant="body">{campaign.description}</ThemedText>

        <Card>
          <View style={styles.statGrid}>
            <View style={styles.statItem}>
              <Feather name="calendar" size={13} color={theme.mutedForeground} />
              <ThemedText variant="caption" color={theme.mutedForeground}>Start</ThemedText>
              <ThemedText variant="label">{formatDate(campaign.startDate)}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <Feather name="calendar" size={13} color={theme.mutedForeground} />
              <ThemedText variant="caption" color={theme.mutedForeground}>End</ThemedText>
              <ThemedText variant="label">{formatDate(campaign.endDate)}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <Feather name="map" size={13} color={theme.mutedForeground} />
              <ThemedText variant="caption" color={theme.mutedForeground}>Routes</ThemedText>
              <ThemedText variant="label">{campaign.routes}</ThemedText>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <ThemedText variant="label">Proof Progress</ThemedText>
              <ThemedText variant="label" color={theme.primary}>{pct}%</ThemedText>
            </View>
            <ProgressBar value={pct} height={8} />
            <ThemedText variant="caption" color={theme.mutedForeground}>
              {campaign.proofsSubmitted} of {campaign.proofsRequired} required
            </ThemedText>
          </View>
        </Card>

        {routes.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader title={`Routes (${routes.length})`} />
            <Card padded={false}>
              {routes.map((route, index) => (
                <View key={route.id}>
                  <View style={styles.routeRow}>
                    <Feather name="navigation" size={14} color={theme.primary} style={styles.routeIcon} />
                    <View style={styles.routeInfo}>
                      <ThemedText variant="label">{route.name}</ThemedText>
                      <ThemedText variant="caption" color={theme.mutedForeground} numberOfLines={1}>
                        {route.startPoint} → {route.endPoint}
                      </ThemedText>
                      {route.assignedDriverName ? (
                        <View style={styles.driverRow}>
                          <AvatarBadge
                            initials={route.assignedDriverName.split(' ').map((name) => name[0]).join('')}
                            size={16}
                          />
                          <ThemedText variant="caption" color={theme.mutedForeground}>
                            {route.assignedDriverName}
                          </ThemedText>
                        </View>
                      ) : (
                        <ThemedText variant="caption" color={theme.mutedForeground}>Unassigned</ThemedText>
                      )}
                    </View>
                    <ThemedText variant="caption" color={theme.mutedForeground}>{route.estimatedMiles} mi</ThemedText>
                  </View>
                  {index < routes.length - 1 ? <Divider inset={44} /> : null}
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        {user?.role === 'driver' ? (
          <Button
            label="Upload Proof for This Campaign"
            onPress={() => router.push({ pathname: '/proof-upload', params: { campaignId: campaign.id } })}
          />
        ) : null}

        <View style={styles.section}>
          <SectionHeader title={`Recent Proofs (${proofs.length})`} />
          {proofs.length === 0 ? (
            <EmptyState icon="image" title="No proofs yet" />
          ) : (
            <Card>
              {proofs.map((proof, index) => (
                <ProofItem key={proof.id} proof={proof} isLast={index === proofs.length - 1} />
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 20 },
  notFound: { flex: 1 },
  titleSection: { gap: 6 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flexWrap: 'wrap',
  },
  campaignName: { flex: 1 },
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statItem: {
    flex: 1,
    gap: 4,
  },
  divider: { marginVertical: 12 },
  progressSection: { gap: 8 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: { gap: 12 },
  routeRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  routeIcon: { marginTop: 2 },
  routeInfo: { flex: 1, gap: 4 },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
