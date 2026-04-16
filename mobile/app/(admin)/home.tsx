import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { CampaignCard } from '../../components/CampaignCard';
import { ScreenMarker } from '../../components/ScreenMarker';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

export default function AdminHomeScreen() {
  const { user, signOut } = useAuth();
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const { campaigns, proofs, drivers, isLoading, error } = useTenantOperationalData();
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'active');
  const uploadedProofs = proofs.length;

  const stats = [
    { value: String(activeCampaigns.length), label: 'Active', icon: 'activity' as const, onPress: () => router.push('/(admin)/campaigns') },
    { value: String(uploadedProofs), label: 'Uploads', icon: 'image' as const, onPress: () => router.push('/(admin)/campaigns') },
    { value: String(drivers.filter((driver) => driver.status === 'active').length), label: 'Drivers', icon: 'truck' as const, onPress: () => router.push('/(admin)/team') },
    { value: campaigns.length > 0 ? `${Math.round((uploadedProofs / Math.max(campaigns.reduce((sum, campaign) => sum + campaign.proofsRequired, 0), 1)) * 100)}%` : '-', label: 'Completion', icon: 'check-circle' as const, onPress: () => router.push('/(admin)/analytics') },
  ];

  async function handleSignOut() {
    await signOut();
    router.replace('/');
  }

  return (
    <ThemedView style={styles.root}>
      <ScreenMarker id="screen-admin-home" />
      <AppHeader
        rightAction={
          <Pressable onPress={() => void handleSignOut()} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Feather name="log-out" size={18} color={theme.mutedForeground} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.greeting}>
          <ThemedText variant="heading">Welcome, {user?.name.split(' ')[0]}</ThemedText>
          <ThemedText variant="body" color={theme.mutedForeground}>Administrator · {tenant?.name}</ThemedText>
        </View>

        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <Pressable
              key={stat.label}
              onPress={stat.onPress}
              style={({ pressed }) => [
                styles.statCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  borderRadius: tenant?.radius ?? 8,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather name={stat.icon} size={16} color={theme.primary} />
              <ThemedText variant="heading" style={styles.statValue}>{stat.value}</ThemedText>
              <ThemedText variant="caption" color={theme.mutedForeground}>{stat.label}</ThemedText>
            </Pressable>
          ))}
        </View>

        {uploadedProofs > 0 ? (
          <Pressable onPress={() => router.push('/(admin)/gallery')} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <Card style={styles.alertBanner}>
              <Feather name="image" size={16} color={theme.accent} />
              <ThemedText variant="label" style={styles.alertText}>
                {uploadedProofs} uploaded proof{uploadedProofs !== 1 ? 's' : ''} — tap to view gallery
              </ThemedText>
              <Feather name="chevron-right" size={14} color={theme.mutedForeground} />
            </Card>
          </Pressable>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="Active Campaigns" actionLabel="View all" onAction={() => router.push('/(admin)/campaigns')} />
          {isLoading ? (
            <ThemedText variant="body" color={theme.mutedForeground}>Loading campaigns...</ThemedText>
          ) : null}
          {error ? (
            <ThemedText variant="body" color={theme.mutedForeground}>{error}</ThemedText>
          ) : null}
          {activeCampaigns.slice(0, 3).map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
          {!isLoading && !error && activeCampaigns.length === 0 ? (
            <ThemedText variant="body" color={theme.mutedForeground}>No active campaigns.</ThemedText>
          ) : null}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Quick Access" />
          <View style={styles.quickGrid}>
            <QuickLink label="New Campaign" icon="plus-circle" testID="admin-quick-campaign-form" onPress={() => router.push('/(admin)/campaign-form')} />
            <QuickLink label="Drivers" icon="truck" testID="admin-quick-team" onPress={() => router.push('/(admin)/team')} />
            <QuickLink label="Routes" icon="map" testID="admin-quick-routes" onPress={() => router.push('/(admin)/routes')} />
            <QuickLink label="Reports" icon="bar-chart-2" testID="admin-quick-analytics" onPress={() => router.push('/(admin)/analytics')} />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function QuickLink({ label, icon, testID, onPress }: { label: string; icon: React.ComponentProps<typeof Feather>['name']; testID: string; onPress: () => void }) {
  const { tenant } = useTenant();
  const theme = tenant?.theme ?? colors.light;

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={testID}
      testID={testID}
      style={({ pressed }) => [
        styles.quickCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderRadius: tenant?.radius ?? 8,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Feather name={icon} size={18} color={theme.primary} />
      <ThemedText variant="label">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 24 },
  greeting: { gap: 4 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: 1,
  },
  statValue: { fontSize: 22, lineHeight: 28 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  alertText: { flex: 1 },
  section: { gap: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    width: '48%',
    borderWidth: 1,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 8,
  },
});
