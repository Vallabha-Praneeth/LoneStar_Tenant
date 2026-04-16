import React from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { CampaignCard } from '../../components/CampaignCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import colors from '../../constants/colors';
import { useTenant } from '../../context/TenantContext';
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

export default function DriverCampaignsScreen() {
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const { visibleCampaigns: campaigns, isLoading, error } = useTenantOperationalData();
  const active = campaigns.filter((campaign) => campaign.status === 'active');
  const other = campaigns.filter((campaign) => campaign.status !== 'active');

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-driver-campaigns" testID="screen-driver-campaigns">
      <AppHeader title="My Campaigns" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ThemedText variant="body" color={theme.mutedForeground}>Loading campaigns...</ThemedText>
        ) : null}
        {error ? (
          <ThemedText variant="body" color={theme.mutedForeground}>{error}</ThemedText>
        ) : null}
        {!isLoading && !error && campaigns.length === 0 ? (
          <EmptyState icon="grid" title="No assigned campaigns" message="You have not been assigned to any campaigns yet." />
        ) : (
          <>
            {active.length > 0 ? (
              <>
                <ThemedText variant="label" color={theme.mutedForeground}>ACTIVE</ThemedText>
                {active.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}
              </>
            ) : null}
            {other.length > 0 ? (
              <>
                <ThemedText variant="label" color={theme.mutedForeground} style={styles.groupLabel}>OTHER</ThemedText>
                {other.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  groupLabel: { marginTop: 8 },
});
