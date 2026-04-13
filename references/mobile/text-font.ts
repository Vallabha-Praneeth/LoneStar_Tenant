const INTER_FONT_FAMILY = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export function getInterFontFamily(className = '') {
  if (/\bfont-bold\b/.test(className))
    return INTER_FONT_FAMILY.bold;
  if (/\bfont-semibold\b/.test(className))
    return INTER_FONT_FAMILY.semibold;
  if (/\bfont-medium\b/.test(className))
    return INTER_FONT_FAMILY.medium;
  return INTER_FONT_FAMILY.regular;
}
