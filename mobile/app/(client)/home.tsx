import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { CampaignCard } from '../../components/CampaignCard';
import { ScreenMarker } from '../../components/ScreenMarker';
import { Card } from '../../components/ui/Card';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import { progressPercent } from '../../constants/mockData';
import colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

export default function ClientHomeScreen() {
  const { user, signOut } = useAuth();
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const { visibleCampaigns: campaigns, isLoading, error } = useTenantOperationalData();
  const active = campaigns.filter((campaign) => campaign.status === 'active');
  const totalProofs = campaigns.reduce((sum, campaign) => sum + campaign.proofsSubmitted, 0);
  const totalRequired = campaigns.reduce((sum, campaign) => sum + campaign.proofsRequired, 0);
  const overallPct = progressPercent(totalProofs, totalRequired);

  async function handleSignOut() {
    await signOut();
    router.replace('/');
  }

  return (
    <ThemedView style={styles.root}>
      <ScreenMarker id="screen-client-home" />
      <AppHeader
        rightAction={
          <Pressable onPress={() => void handleSignOut()} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Feather name="log-out" size={18} color={theme.mutedForeground} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.greeting}>
          <ThemedText variant="heading">{user?.name?.split(' ')[0]}</ThemedText>
          <ThemedText variant="body" color={theme.mutedForeground}>
            Client view · {tenant?.name}
          </ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <ThemedText variant="heading" style={styles.bigNumber}>{active.length}</ThemedText>
            <ThemedText variant="caption" color={theme.mutedForeground}>Active Campaigns</ThemedText>
          </Card>
          <Card style={styles.summaryCard}>
            <ThemedText variant="heading" style={styles.bigNumber}>{overallPct}%</ThemedText>
            <ThemedText variant="caption" color={theme.mutedForeground}>Proof Completion</ThemedText>
          </Card>
          <Card style={styles.summaryCard}>
            <ThemedText variant="heading" style={styles.bigNumber}>{totalProofs}</ThemedText>
            <ThemedText variant="caption" color={theme.mutedForeground}>Proofs Delivered</ThemedText>
          </Card>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subheading">Your Campaigns</ThemedText>
            <Pressable
              onPress={() => router.push('/(client)/campaigns')}
              accessibilityLabel="client-view-all-campaigns"
              testID="client-view-all-campaigns"
            >
              <ThemedText variant="label" color={theme.accent}>View all</ThemedText>
            </Pressable>
          </View>
          {isLoading ? (
            <ThemedText variant="body" color={theme.mutedForeground}>Loading campaigns...</ThemedText>
          ) : null}
          {error ? (
            <ThemedText variant="body" color={theme.mutedForeground}>{error}</ThemedText>
          ) : null}
          {active.slice(0, 2).map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
          {!isLoading && !error && active.length === 0 ? (
            <ThemedText variant="body" color={theme.mutedForeground}>No active campaigns.</ThemedText>
          ) : null}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 24 },
  greeting: { gap: 4 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, alignItems: 'center', gap: 4, padding: 14 },
  bigNumber: { fontSize: 28 },
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
