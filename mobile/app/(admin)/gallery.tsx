import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import { getCampaignProofImageSource } from '../../constants/supabase';
import type { Proof } from '../../constants/mockData';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { useTenantOperationalData } from '../../hooks/useTenantOperationalData';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const TILE_GAP = 2;
const TILE_SIZE = (SCREEN_WIDTH - TILE_GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function AdminGalleryScreen() {
  const { tenant } = useTenant();
  const { accessToken } = useAuth();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme;
  const { proofs, isLoading, error } = useTenantOperationalData();
  const [selected, setSelected] = React.useState<Proof | null>(null);

  if (isLoading) {
    return (
      <ThemedView style={styles.root} accessibilityLabel="screen-admin-gallery" testID="screen-admin-gallery">
        <AppHeader title="Proof Gallery" />
        <ThemedText variant="body" color={theme?.mutedForeground} style={styles.center}>
          Loading proofs…
        </ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.root} accessibilityLabel="screen-admin-gallery" testID="screen-admin-gallery">
        <AppHeader title="Proof Gallery" />
        <ThemedText variant="body" color={theme?.mutedForeground} style={styles.center}>
          {error}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-admin-gallery" testID="screen-admin-gallery">
      <AppHeader title={`Proof Gallery (${proofs.length})`} />

      {proofs.length === 0 ? (
        <EmptyState icon="image" title="No proofs yet" message="Proofs uploaded by drivers will appear here." />
      ) : (
        <FlatList
          data={proofs}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{ paddingBottom: botPad + 80, padding: TILE_GAP }}
          columnWrapperStyle={{ gap: TILE_GAP }}
          ItemSeparatorComponent={() => <View style={{ height: TILE_GAP }} />}
          renderItem={({ item }) => (
            <ProofTile
              proof={item}
              accessToken={accessToken}
              onPress={() => setSelected(item)}
            />
          )}
        />
      )}

      {selected ? (
        <LightboxModal
          proof={selected}
          accessToken={accessToken}
          insets={insets}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </ThemedView>
  );
}

function ProofTile({
  proof,
  accessToken,
  onPress,
}: {
  proof: Proof;
  accessToken: string | null;
  onPress: () => void;
}) {
  const [hasError, setHasError] = React.useState(false);

  const source =
    accessToken && proof.storagePath && !hasError
      ? getCampaignProofImageSource(accessToken, proof.storagePath)
      : null;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.8 : 1 }]}>
      {source ? (
        <Image
          source={source}
          style={styles.tileImage}
          onError={() => setHasError(true)}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.tilePlaceholder}>
          <Feather name="image" size={24} color="#94A3B8" />
        </View>
      )}
    </Pressable>
  );
}

function LightboxModal({
  proof,
  accessToken,
  insets,
  onClose,
}: {
  proof: Proof;
  accessToken: string | null;
  theme?: unknown;
  insets: { top: number; bottom: number };
  onClose: () => void;
}) {
  const [hasError, setHasError] = React.useState(false);

  const source =
    accessToken && proof.storagePath && !hasError
      ? getCampaignProofImageSource(accessToken, proof.storagePath)
      : null;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={[styles.closeBtn, { top: insets.top + 12 }]}>
          <Feather name="x" size={22} color="#FFFFFF" />
        </Pressable>

        {source ? (
          <Image
            source={source}
            style={styles.fullImage}
            resizeMode="contain"
            onError={() => setHasError(true)}
          />
        ) : (
          <View style={styles.fullPlaceholder}>
            <Feather name="image" size={48} color="#64748B" />
            <ThemedText variant="caption" color="#64748B">Image unavailable</ThemedText>
          </View>
        )}

        <View style={[styles.captionBar, { paddingBottom: insets.bottom + 16 }]}>
          <ThemedText variant="label" color="#FFFFFF" numberOfLines={1}>{proof.campaignName}</ThemedText>
          <ThemedText variant="caption" color="#94A3B8">{proof.location} · {proof.driverName}</ThemedText>
          {proof.notes ? (
            <ThemedText variant="caption" color="#94A3B8" numberOfLines={2}>{proof.notes}</ThemedText>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { textAlign: 'center', marginTop: 40 },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: '#E2E8F0',
  },
  tileImage: {
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  tilePlaceholder: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.3,
  },
  fullPlaceholder: {
    alignItems: 'center',
    gap: 12,
  },
  captionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 4,
  },
});
