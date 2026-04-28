import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { CampaignCard } from '../../components/CampaignCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import { type Campaign } from '../../constants/mockData';
import colors from '../../constants/colors';
import { useTenant } from '../../context/TenantContext';
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

type Filter = 'all' | Campaign['status'];

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'completed', label: 'Completed' },
  { key: 'paused', label: 'Paused' },
];

export default function AdminCampaignsScreen() {
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const [filter, setFilter] = React.useState<Filter>('all');
  const { campaigns: all, isLoading, error, refetch } = useTenantOperationalData();
  const filtered = filter === 'all' ? all : all.filter((campaign) => campaign.status === filter);
  const stableRefetch = React.useCallback(() => {
    refetch();
  }, [refetch]);

  useFocusEffect(
    React.useCallback(() => {
      stableRefetch();
    }, [stableRefetch]),
  );

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-admin-campaigns" testID="screen-admin-campaigns">
      <AppHeader
        title="Campaigns"
        rightAction={
          <Pressable onPress={() => router.push('/(admin)/campaign-form')} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Feather name="plus" size={22} color={theme.primary} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((candidate) => (
            <Pressable
              key={candidate.key}
              onPress={() => setFilter(candidate.key)}
              style={({ pressed }) => [
                styles.filterChip,
                {
                  backgroundColor: filter === candidate.key ? theme.primary : theme.card,
                  borderColor: filter === candidate.key ? theme.primary : theme.border,
                  opacity: pressed ? 0.8 : 1,
                  borderRadius: tenant?.radius ?? 6,
                },
              ]}
            >
              <ThemedText variant="label" color={filter === candidate.key ? theme.primaryForeground : theme.foreground}>
                {candidate.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {!isLoading && !error ? (
          <ThemedText variant="caption" color={theme.mutedForeground} style={styles.count}>
            {filtered.length} campaign{filtered.length !== 1 ? 's' : ''}
          </ThemedText>
        ) : null}

        {isLoading ? (
          <ThemedText variant="body" color={theme.mutedForeground}>Loading campaigns...</ThemedText>
        ) : error ? (
          <ThemedText variant="body" color={theme.mutedForeground}>{error}</ThemedText>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="grid"
            title="No campaigns"
            message="No campaigns match this filter."
            actionLabel="Create campaign"
            onAction={() => router.push('/(admin)/campaign-form')}
          />
        ) : (
          filtered.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 4 },
  filters: { flexDirection: 'row', gap: 8, paddingVertical: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  count: { marginBottom: 4 },
});
