import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { ScreenMarker } from '../components/ScreenMarker';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ThemedText } from '../components/ui/ThemedText';
import { ThemedView } from '../components/ui/ThemedView';
import colors from '../constants/colors';
import {
  MAX_PROOF_UPLOAD_BYTES,
  createCampaignProofUpload,
} from '../constants/supabase';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useTenantOperationalData } from '../hooks/useTenantOperationalData';

type SelectedPhoto = {
  uri: string;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
};

function humanFileSize(size: number | null | undefined) {
  if (!size) {
    return null;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProofUploadScreen() {
  const { tenant } = useTenant();
  const { bootstrap, user, accessToken } = useAuth();
  const params = useLocalSearchParams<{ campaignId?: string }>();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const radius = tenant?.radius ?? 8;
  const { visibleCampaigns, isLoading, error, refetch } = useTenantOperationalData();
  const campaigns = visibleCampaigns.filter((campaign) => campaign.status === 'active');
  const preferredCampaignId = Array.isArray(params.campaignId) ? params.campaignId[0] : params.campaignId;
  const [selectedCampaign, setSelectedCampaign] = React.useState(preferredCampaignId ?? campaigns[0]?.id ?? '');
  const [location, setLocation] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [selectedPhoto, setSelectedPhoto] = React.useState<SelectedPhoto | null>(null);
  const [pickerError, setPickerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!campaigns.length) {
      setSelectedCampaign('');
      return;
    }

    if (preferredCampaignId && campaigns.some((campaign) => campaign.id === preferredCampaignId)) {
      setSelectedCampaign(preferredCampaignId);
      return;
    }

    if (!selectedCampaign || !campaigns.some((campaign) => campaign.id === selectedCampaign)) {
      setSelectedCampaign(campaigns[0]?.id ?? '');
    }
  }, [campaigns, preferredCampaignId, selectedCampaign]);

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const applyPickerResult = React.useCallback((result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) {
      return;
    }

    const [asset] = result.assets;
    if (!asset?.uri) {
      setPickerError('The selected photo could not be read.');
      return;
    }

    if (asset.fileSize && asset.fileSize > MAX_PROOF_UPLOAD_BYTES) {
      setPickerError('Selected photo is too large. Keep uploads under 15 MB.');
      return;
    }

    setSelectedPhoto({
      uri: asset.uri,
      fileName: asset.fileName ?? null,
      fileSize: asset.fileSize ?? null,
      mimeType: asset.mimeType ?? null,
    });
    setPickerError(null);
  }, []);

  const chooseFromLibrary = React.useCallback(async () => {
    setPickerError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPickerError('Media library access is required to attach a proof photo.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: false,
        selectionLimit: 1,
      });
      applyPickerResult(result);
    } catch {
      setPickerError('Unable to open the media library on this device.');
    }
  }, [applyPickerResult]);

  const captureWithCamera = React.useCallback(async () => {
    setPickerError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setPickerError('Camera access is required to capture a proof photo.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: false,
      });
      applyPickerResult(result);
    } catch {
      setPickerError(
        Platform.OS === 'ios'
          ? 'Camera capture is unavailable here. Use the library option on simulator builds.'
          : 'Unable to open the camera on this device.',
      );
    }
  }, [applyPickerResult]);

  const submitProof = React.useCallback(async () => {
    if (!selectedCampaign || !selectedPhoto || !accessToken || !bootstrap || !user) {
      return;
    }

    const trimmedLocation = location.trim();
    if (!trimmedLocation) {
      setPickerError('Add a proof location before submitting.');
      return;
    }
    if (!campaigns.some((campaign) => campaign.id === selectedCampaign)) {
      setPickerError('Selected campaign is no longer valid. Please choose an assigned active campaign.');
      return;
    }

    setIsSubmitting(true);
    setPickerError(null);

    try {
      await createCampaignProofUpload({
        accessToken,
        organizationId: bootstrap.organization.id,
        campaignId: selectedCampaign,
        uploadedBy: user.id,
        photoUri: selectedPhoto.uri,
        fileName: selectedPhoto.fileName,
        mimeType: selectedPhoto.mimeType,
        location: trimmedLocation,
        notes,
      });

      await refetch();
      router.replace({
        pathname: '/upload-success',
        params: {
          campaignId: selectedCampaign,
          photoUri: selectedPhoto?.uri ?? '',
        },
      });
    } catch (uploadError) {
      setPickerError(
        uploadError instanceof Error ? uploadError.message : 'Unable to submit the proof right now.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    accessToken,
    bootstrap,
    location,
    notes,
    campaigns,
    refetch,
    selectedCampaign,
    selectedPhoto,
    user,
  ]);

  return (
    <ThemedView style={styles.root}>
      <ScreenMarker id="screen-proof-upload" />
      <AppHeader title="Upload Proof" showBack onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.section}>
          <ThemedText variant="label" color={theme.mutedForeground}>Campaign</ThemedText>
          {isLoading ? (
            <ThemedText variant="caption" color={theme.mutedForeground}>Loading active campaigns...</ThemedText>
          ) : null}
          {error ? (
            <ThemedText variant="caption" color={theme.mutedForeground}>{error}</ThemedText>
          ) : null}
          <View style={styles.campaignList}>
            {campaigns.map((campaign) => (
              <Pressable
                key={campaign.id}
                onPress={() => setSelectedCampaign(campaign.id)}
                style={({ pressed }) => [
                  styles.campaignChip,
                  {
                    backgroundColor: selectedCampaign === campaign.id ? theme.primary : theme.card,
                    borderColor: selectedCampaign === campaign.id ? theme.primary : theme.border,
                    borderRadius: radius,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <ThemedText
                  variant="label"
                  color={selectedCampaign === campaign.id ? theme.primaryForeground : theme.foreground}
                  numberOfLines={1}
                >
                  {campaign.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card style={styles.section}>
          <ThemedText variant="subheading">Photo</ThemedText>
          {selectedPhoto ? (
            <Image
              source={{ uri: selectedPhoto.uri }}
              style={[styles.photoPreview, { borderRadius: radius, borderColor: theme.border }]}
            />
          ) : (
            <View
              style={[
                styles.photoPlaceholder,
                {
                  borderColor: theme.border,
                  borderRadius: radius,
                  backgroundColor: '#F8FAFC',
                },
              ]}
            >
              <Feather name="camera" size={32} color={theme.mutedForeground} />
              <ThemedText variant="body" color={theme.mutedForeground}>
                Capture a proof or choose one from the library
              </ThemedText>
            </View>
          )}

          <View style={styles.photoActions}>
            <Button
              label="Take Photo"
              variant="secondary"
              onPress={() => void captureWithCamera()}
              accessibilityLabel="action-pick-camera"
              testID="action-pick-camera"
            />
            <Button
              label={selectedPhoto ? 'Replace Photo' : 'Choose From Library'}
              variant="outline"
              onPress={() => void chooseFromLibrary()}
              accessibilityLabel="proof-photo-picker"
              testID="proof-photo-picker"
            />
          </View>

          {selectedPhoto ? (
            <ThemedText variant="caption" color={theme.mutedForeground}>
              {selectedPhoto.fileName ?? 'Selected photo'}
              {humanFileSize(selectedPhoto.fileSize) ? ` · ${humanFileSize(selectedPhoto.fileSize)}` : ''}
            </ThemedText>
          ) : null}
        </Card>

        <Card style={styles.section}>
          <ThemedText variant="subheading">Details</ThemedText>
          <View style={styles.fieldGroup}>
            <ThemedText variant="label" color={theme.mutedForeground}>Location</ThemedText>
            <View style={[styles.inputWrap, { borderColor: theme.border, borderRadius: radius, backgroundColor: theme.card }]}>
              <Feather name="map-pin" size={16} color={theme.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.foreground }]}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Main St & 5th Ave"
                placeholderTextColor={theme.mutedForeground}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText variant="label" color={theme.mutedForeground}>Notes (optional)</ThemedText>
            <View
              style={[
                styles.inputWrap,
                styles.textAreaWrap,
                { borderColor: theme.border, borderRadius: radius, backgroundColor: theme.card },
              ]}
            >
              <TextInput
                style={[styles.input, styles.textArea, { color: theme.foreground }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any notes about visibility, conditions, or truck position."
                placeholderTextColor={theme.mutedForeground}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </Card>

        {pickerError ? (
          <ThemedText variant="caption" color={theme.destructive} style={styles.note}>
            {pickerError}
          </ThemedText>
        ) : null}

        <Button
          label={isSubmitting ? 'Uploading Proof...' : 'Submit Proof'}
          onPress={() => void submitProof()}
          disabled={!selectedPhoto || !selectedCampaign || isSubmitting}
          loading={isSubmitting}
          accessibilityLabel="action-submit-proof"
          testID="action-submit-proof"
        />

        <ThemedText variant="caption" color={theme.mutedForeground} style={styles.note}>
          Uploaded proofs are stored immediately and become visible in the admin and client app views without an approval queue.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  section: { gap: 12 },
  campaignList: { gap: 8 },
  campaignChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
  },
  photoPlaceholder: {
    minHeight: 160,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  photoPreview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderWidth: 1,
    backgroundColor: '#E2E8F0',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldGroup: { gap: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  textAreaWrap: { alignItems: 'flex-start', paddingTop: 12 },
  textArea: { minHeight: 64, textAlignVertical: 'top' },
  note: { textAlign: 'center' },
});
