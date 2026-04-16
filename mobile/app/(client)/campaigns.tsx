import React from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { CampaignCard } from '../../components/CampaignCard';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import colors from '../../constants/colors';
import { useTenant } from '../../context/TenantContext';
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

export default function ClientCampaignsScreen() {
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const { visibleCampaigns: campaigns, isLoading, error } = useTenantOperationalData();

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-client-campaigns" testID="screen-client-campaigns">
      <AppHeader title="All Campaigns" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ThemedText variant="body" color={theme.mutedForeground}>Loading campaigns...</ThemedText>
        ) : null}
        {error ? (
          <ThemedText variant="body" color={theme.mutedForeground}>{error}</ThemedText>
        ) : null}
        {campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}
        {!isLoading && !error && campaigns.length === 0 ? (
          <ThemedText variant="body" color={theme.mutedForeground} style={styles.empty}>
            No campaigns found.
          </ThemedText>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, gap: 0 },
  empty: { marginTop: 24, textAlign: 'center' },
});
