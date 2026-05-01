import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
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

/** Brand-safe presets; hex must stay #RRGGBB for save validation. */
const THEME_COLOR_PRESETS = [
  { label: 'Navy', value: '#1B3A5C' },
  { label: 'Blue', value: '#2563EB' },
  { label: 'Sky', value: '#0EA5E9' },
  { label: 'Green', value: '#16A34A' },
  { label: 'Amber', value: '#D97706' },
  { label: 'Red', value: '#DC2626' },
  { label: 'Purple', value: '#7C3AED' },
  { label: 'Slate', value: '#334155' },
] as const;

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

function hexMatches(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Local UX only: soft cap on opening external AI logo helpers (AsyncStorage). */
const AI_LOGO_EXTERNAL_OPENS_KEY = 'lonestar_tenant_ai_logo_external_opens';
const AI_LOGO_EXTERNAL_OPENS_MAX = 5;

const AI_LOGO_TOOL_LINKS = [
  { label: 'SologoAI', url: 'https://www.sologo.ai/' },
  /** Free-tier logo tooling; curated as “FreeBrand” helper (FreeLogoDesign). */
  { label: 'FreeBrand', url: 'https://www.freelogodesign.org/' },
  { label: 'ZSky AI Logo', url: 'https://zsky.ai/ai-logo-generator' },
  { label: 'Canva', url: 'https://www.canva.com/create/logos/' },
] as const;

async function persistAiLogoOpenCount(nextUsed: number) {
  await AsyncStorage.setItem(AI_LOGO_EXTERNAL_OPENS_KEY, String(nextUsed));
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
  const [aiLogoOpensUsed, setAiLogoOpensUsed] = React.useState(0);
  const [aiLogoLinkError, setAiLogoLinkError] = React.useState<string | null>(null);
  const [isSavingLogo, setIsSavingLogo] = React.useState(false);
  const [isSavingColor, setIsSavingColor] = React.useState(false);

  React.useEffect(() => {
    setPrimaryColor(theme.primary);
  }, [theme.primary]);

  React.useEffect(() => {
    void AsyncStorage.getItem(AI_LOGO_EXTERNAL_OPENS_KEY)
      .then((raw) => {
        const parsed = Number.parseInt(raw ?? '0', 10);
        if (!Number.isFinite(parsed) || parsed < 0) {
          setAiLogoOpensUsed(0);
          return;
        }
        setAiLogoOpensUsed(Math.min(parsed, AI_LOGO_EXTERNAL_OPENS_MAX));
      })
      .catch(() => {});
  }, []);

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

  const pickLogoFromCamera = React.useCallback(async () => {
    setFormError(null);
    if (Platform.OS === 'web') {
      setFormError("Camera capture isn't available in web preview. Use Choose Logo, or Take Logo Photo on the Android app.");
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setFormError('Camera permission was denied. Allow camera access in system settings to take a logo photo.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (result.canceled) {
        return;
      }
      const [asset] = result.assets;
      if (!asset?.uri) {
        setFormError('The photo could not be read.');
        return;
      }
      if (asset.fileSize && asset.fileSize > MAX_BRANDING_LOGO_UPLOAD_BYTES) {
        setFormError('Captured logo is too large. Keep uploads under 5 MB.');
        return;
      }
      setSelectedLogo({
        uri: asset.uri,
        fileName: asset.fileName ?? null,
        fileSize: asset.fileSize ?? null,
        mimeType: asset.mimeType ?? null,
      });
    } catch {
      setFormError('Unable to open the camera on this device.');
    }
  }, []);

  const handleOpenAiLogoTool = React.useCallback(
    async (url: string) => {
      setAiLogoLinkError(null);
      if (aiLogoOpensUsed >= AI_LOGO_EXTERNAL_OPENS_MAX) {
        return;
      }
      try {
        const supported = await Linking.canOpenURL(url);
        if (!supported) {
          setAiLogoLinkError('Unable to open that link from this device.');
          return;
        }
        await Linking.openURL(url);
        const next = Math.min(aiLogoOpensUsed + 1, AI_LOGO_EXTERNAL_OPENS_MAX);
        setAiLogoOpensUsed(next);
        await persistAiLogoOpenCount(next);
      } catch {
        setAiLogoLinkError('Could not open link. Try again later.');
      }
    },
    [aiLogoOpensUsed],
  );

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
            <View style={styles.logoPickRow}>
              <Button
                label="Choose Logo"
                variant="outline"
                style={styles.logoPickButton}
                onPress={() => void pickLogoFromLibrary()}
              />
              <Button
                label="Take Logo Photo"
                variant="outline"
                style={styles.logoPickButton}
                onPress={() => void pickLogoFromCamera()}
              />
            </View>
            <Button
              label={isSavingLogo ? 'Saving Logo...' : 'Save Logo'}
              onPress={() => void handleSaveLogo()}
              disabled={!selectedLogo || isSavingLogo}
              loading={isSavingLogo}
            />
          </View>

          <Divider />

          <View style={styles.aiLogoIdeas}>
            <ThemedText variant="label" style={styles.ideaTitle}>Need logo ideas?</ThemedText>
            <ThemedText variant="caption" color={theme.mutedForeground}>
              Try an external AI logo tool, download your favorite, then upload it here.
            </ThemedText>
            <ThemedText variant="caption" color={theme.mutedForeground}>
              External tools may change pricing or limits anytime.
            </ThemedText>
            <ThemedText variant="caption" color={theme.mutedForeground}>
              Check commercial rights before using a generated logo for business use.
            </ThemedText>
            <ThemedText variant="caption" color={theme.mutedForeground} style={styles.ideaDisclaimer}>
              We do not send your tenant data to these tools automatically. Only open the tool you choose; anything you submit is between you and that site.
            </ThemedText>
            <ThemedText variant="caption" color={theme.mutedForeground}>
              AI logo helper:{' '}
              {aiLogoOpensUsed >= AI_LOGO_EXTERNAL_OPENS_MAX
                ? `0 opens left on this device (max ${AI_LOGO_EXTERNAL_OPENS_MAX}).`
                : `${AI_LOGO_EXTERNAL_OPENS_MAX - aiLogoOpensUsed} external open${AI_LOGO_EXTERNAL_OPENS_MAX - aiLogoOpensUsed === 1 ? '' : 's'} left (${AI_LOGO_EXTERNAL_OPENS_MAX} max tracked locally).`}
            </ThemedText>
            <View style={styles.aiLogoLinkGrid}>
              {AI_LOGO_TOOL_LINKS.map((link) => (
                <Button
                  key={link.url}
                  label={link.label}
                  variant="outline"
                  disabled={aiLogoOpensUsed >= AI_LOGO_EXTERNAL_OPENS_MAX}
                  style={styles.aiLogoToolButton}
                  accessibilityLabel={`${link.label}, opens logo tool in browser`}
                  onPress={() => void handleOpenAiLogoTool(link.url)}
                />
              ))}
            </View>
            {aiLogoLinkError ? (
              <ThemedText variant="caption" color={theme.destructive}>
                {aiLogoLinkError}
              </ThemedText>
            ) : null}
          </View>

          <Divider />

          <View style={styles.brandingGroup}>
            <ThemedText variant="label" color={theme.mutedForeground}>Theme Color</ThemedText>
            <View style={styles.paletteGrid} accessibilityRole="radiogroup" accessibilityLabel="Theme color presets">
              {THEME_COLOR_PRESETS.map((preset) => {
                const isSelected = hexMatches(primaryColor, preset.value);
                return (
                  <Pressable
                    key={preset.value}
                    accessibilityRole="radio"
                    accessibilityLabel={`Theme color ${preset.label}`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      setFormError(null);
                      setPrimaryColor(preset.value);
                    }}
                    style={({ pressed }) => [styles.presetTile, pressed && styles.presetTilePressed]}
                  >
                    <View
                      style={[
                        styles.swatch,
                        { backgroundColor: preset.value, borderColor: theme.border },
                        isSelected && [
                          styles.swatchSelected,
                          { borderColor: theme.foreground, shadowColor: theme.foreground },
                        ],
                      ]}
                    />
                    <ThemedText variant="caption" color={theme.mutedForeground} style={styles.presetLabel} numberOfLines={1}>
                      {preset.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <ThemedText variant="label" color={theme.mutedForeground}>Custom color</ThemedText>
            <View style={[styles.inputWrap, { borderColor: theme.border, borderRadius: tenant?.radius ?? 8, backgroundColor: theme.card }]}>
              <TextInput
                style={[styles.input, { color: theme.foreground }]}
                value={primaryColor}
                onChangeText={(text) => {
                  setFormError(null);
                  setPrimaryColor(text);
                }}
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
  logoPickRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  logoPickButton: {
    flex: 1,
    minWidth: 140,
  },
  aiLogoIdeas: { gap: 8, paddingBottom: 4 },
  ideaTitle: { marginTop: 2 },
  ideaDisclaimer: { marginTop: 2 },
  aiLogoLinkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  aiLogoToolButton: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 120,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginTop: 4,
    marginBottom: 4,
  },
  presetTile: {
    width: '25%',
    paddingHorizontal: 4,
    paddingBottom: 10,
    alignItems: 'center',
  },
  presetTilePressed: { opacity: 0.85 },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
  },
  swatchSelected: {
    borderWidth: 3,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 0 0 1px rgba(0,0,0,0.12)' }
      : {
          shadowOpacity: 0.25,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 3,
        }),
  },
  presetLabel: { marginTop: 4, textAlign: 'center', width: '100%' },
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
