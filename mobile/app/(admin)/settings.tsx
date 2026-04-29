import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { Card } from '../../components/ui/Card';
import { Divider } from '../../components/ui/Divider';
import { Button } from '../../components/ui/Button';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import colors from '../../constants/colors';
import {
  MAX_BRANDING_LOGO_UPLOAD_BYTES,
  updateOrganizationBranding,
  uploadOrganizationBrandingLogo,
} from '../../constants/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

type SelectedLogo = {
  uri: string;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
};

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

export default function AdminSettingsScreen() {
  const { user, signOut, accessToken, bootstrap, refreshBootstrap } = useAuth();
  const { tenant } = useTenant();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const theme = tenant?.theme ?? colors.light;
  const [selectedLogo, setSelectedLogo] = React.useState<SelectedLogo | null>(null);
  const [primaryColor, setPrimaryColor] = React.useState(theme.primary);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSavingLogo, setIsSavingLogo] = React.useState(false);
  const [isSavingColor, setIsSavingColor] = React.useState(false);

  React.useEffect(() => {
    setPrimaryColor(theme.primary);
  }, [theme.primary]);

  const pickLogoFromLibrary = React.useCallback(async () => {
    setFormError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError('Media library access is required to choose a logo image.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: false,
        selectionLimit: 1,
      });
      if (result.canceled) {
        return;
      }
      const [asset] = result.assets;
      if (!asset?.uri) {
        setFormError('Selected image could not be read.');
        return;
      }
      if (asset.fileSize && asset.fileSize > MAX_BRANDING_LOGO_UPLOAD_BYTES) {
        setFormError('Selected logo is too large. Keep uploads under 5 MB.');
        return;
      }
      setSelectedLogo({
        uri: asset.uri,
        fileName: asset.fileName ?? null,
        fileSize: asset.fileSize ?? null,
        mimeType: asset.mimeType ?? null,
      });
    } catch {
      setFormError('Unable to open media library on this device.');
    }
  }, []);

  const handleSaveLogo = React.useCallback(async () => {
    if (!selectedLogo || !accessToken || !bootstrap) {
      return;
    }
    setFormError(null);
    setIsSavingLogo(true);
    try {
      await uploadOrganizationBrandingLogo({
        accessToken,
        organizationId: bootstrap.organization.id,
        logoUri: selectedLogo.uri,
        fileName: selectedLogo.fileName,
        mimeType: selectedLogo.mimeType,
      });
      await refreshBootstrap();
      setSelectedLogo(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save logo right now.');
    } finally {
      setIsSavingLogo(false);
    }
  }, [accessToken, bootstrap, refreshBootstrap, selectedLogo]);

  const handleSaveColor = React.useCallback(async () => {
    if (!accessToken || !bootstrap) {
      return;
    }
    const nextColor = primaryColor.trim();
    if (!isHexColor(nextColor)) {
      setFormError('Enter a valid hex color like #1D4ED8.');
      return;
    }
    setFormError(null);
    setIsSavingColor(true);
    try {
      await updateOrganizationBranding({
        accessToken,
        organizationId: bootstrap.organization.id,
        primaryColor: nextColor,
      });
      await refreshBootstrap();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save theme color right now.');
    } finally {
      setIsSavingColor(false);
    }
  }, [accessToken, bootstrap, primaryColor, refreshBootstrap]);

  async function handleSignOut() {
    await signOut();
    router.replace('/');
  }

  return (
    <ThemedView style={styles.root} accessibilityLabel="screen-admin-settings" testID="screen-admin-settings">
      <AppHeader title="Settings" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
        <Card style={styles.section}>
          <ThemedText variant="label" color={theme.mutedForeground} style={styles.sectionTitle}>Account</ThemedText>
          {[
            { label: 'Organization', icon: 'briefcase' as const, value: tenant?.name },
            { label: 'Role', icon: 'shield' as const, value: 'Administrator' },
            { label: 'Email', icon: 'mail' as const, value: user?.email },
          ].map((row, index, list) => (
            <View key={row.label}>
              <View style={styles.row}>
                <Feather name={row.icon} size={16} color={theme.mutedForeground} />
                <View style={styles.rowContent}>
                  <ThemedText variant="label" color={theme.mutedForeground}>{row.label}</ThemedText>
                  <ThemedText variant="body">{row.value ?? '—'}</ThemedText>
                </View>
              </View>
              {index < list.length - 1 ? <Divider inset={28} /> : null}
            </View>
          ))}
        </Card>

        <Card style={styles.section}>
          <ThemedText variant="label" color={theme.mutedForeground} style={styles.sectionTitle}>Branding</ThemedText>

          <View style={styles.brandingGroup}>
            <ThemedText variant="label" color={theme.mutedForeground}>Logo</ThemedText>
            {selectedLogo?.uri ? (
              <Image source={{ uri: selectedLogo.uri }} style={[styles.logoPreview, { borderColor: theme.border, borderRadius: tenant?.radius ?? 8 }]} />
            ) : tenant?.logoUrl ? (
              <ThemedText variant="caption" color={theme.mutedForeground}>Current logo is active. Choose a new image to replace it.</ThemedText>
            ) : (
              <ThemedText variant="caption" color={theme.mutedForeground}>No logo uploaded. Initials fallback is currently used.</ThemedText>
            )}
            <View style={styles.brandingActions}>
              <Button label="Choose Logo" variant="outline" onPress={() => void pickLogoFromLibrary()} />
              <Button
                label={isSavingLogo ? 'Saving Logo...' : 'Save Logo'}
                onPress={() => void handleSaveLogo()}
                disabled={!selectedLogo || isSavingLogo}
                loading={isSavingLogo}
              />
            </View>
          </View>

          <Divider />

          <View style={styles.brandingGroup}>
            <ThemedText variant="label" color={theme.mutedForeground}>Theme Color</ThemedText>
            <View style={[styles.inputWrap, { borderColor: theme.border, borderRadius: tenant?.radius ?? 8, backgroundColor: theme.card }]}>
              <TextInput
                style={[styles.input, { color: theme.foreground }]}
                value={primaryColor}
                onChangeText={setPrimaryColor}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="#1D4ED8"
                placeholderTextColor={theme.mutedForeground}
              />
            </View>
            <Button
              label={isSavingColor ? 'Saving Color...' : 'Save Theme Color'}
              onPress={() => void handleSaveColor()}
              disabled={isSavingColor}
              loading={isSavingColor}
            />
          </View>
        </Card>

        <Card padded={false}>
          <Pressable onPress={() => void handleSignOut()} style={({ pressed }) => [styles.signOutRow, { opacity: pressed ? 0.7 : 1 }]}>
            <Feather name="log-out" size={16} color={theme.destructive} />
            <ThemedText variant="body" color={theme.destructive}>Sign out</ThemedText>
          </Pressable>
        </Card>

        {formError ? <ThemedText variant="caption" color={theme.destructive} style={styles.disclaimer}>{formError}</ThemedText> : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 20, gap: 12 },
  section: { gap: 0 },
  sectionTitle: { marginBottom: 12 },
  brandingGroup: { gap: 8, paddingBottom: 6 },
  brandingActions: { flexDirection: 'row', gap: 10 },
  logoPreview: {
    width: 120,
    height: 120,
    borderWidth: 1,
    backgroundColor: '#F8FAFC',
  },
  inputWrap: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  rowContent: { flex: 1 },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  disclaimer: { textAlign: 'center', marginTop: 8 },
});
