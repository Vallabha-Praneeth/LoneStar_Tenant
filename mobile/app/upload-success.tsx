import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ThemedText } from '../components/ui/ThemedText';
import { ThemedView } from '../components/ui/ThemedView';
import colors from '../constants/colors';
import { useTenant } from '../context/TenantContext';

export default function UploadSuccessScreen() {
  const { campaignId, photoUri } = useLocalSearchParams<{ campaignId?: string; photoUri?: string }>();
  const { tenant } = useTenant();
  const theme = tenant?.theme ?? colors.light;
  const resolvedCampaignId = typeof campaignId === 'string' ? campaignId : '';
  const resolvedPhotoUri = typeof photoUri === 'string' ? photoUri : '';

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-upload-success" testID="screen-upload-success">
      <Card style={styles.card}>
        {resolvedPhotoUri ? (
          <Image source={{ uri: resolvedPhotoUri }} style={styles.thumbnail} />
        ) : null}
        <View style={styles.checkWrap}>
          <Feather name="check-circle" size={56} color="#16A34A" />
        </View>
        <ThemedText variant="heading" style={styles.centerText}>Photo Submitted!</ThemedText>
        <ThemedText variant="body" color={theme.mutedForeground} style={styles.centerText}>
          Your proof is now visible to the admin and client.
        </ThemedText>
        <View style={styles.actions}>
          <Button
            label="Upload Another"
            onPress={() => router.replace('/proof-upload')}
            style={styles.fullWidth}
            accessibilityLabel="action-upload-another"
            testID="action-upload-another"
          />
          <Button
            label="Back to Campaign"
            variant="secondary"
            onPress={() => {
              if (resolvedCampaignId) {
                router.replace({ pathname: '/campaign/[id]', params: { id: resolvedCampaignId } });
              } else {
                router.replace('/(driver)/home');
              }
            }}
            style={styles.fullWidth}
            accessibilityLabel="action-back-to-campaign"
            testID="action-back-to-campaign"
          />
        </View>
      </Card>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    gap: 20,
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
  },
  checkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  fullWidth: {
    width: '100%',
  },
});
