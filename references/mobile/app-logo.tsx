import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

import { Text, View } from '@/components/ui';

type AppLogoSize = 'sm' | 'md' | 'lg';

type AppLogoProps = {
  size?: AppLogoSize;
  showText?: boolean;
};

const SIZE_MAP: Record<AppLogoSize, { box: string; icon: number; text: string }> = {
  sm: { box: 'size-7', icon: 14, text: 'text-sm' },
  md: { box: 'size-10', icon: 20, text: 'text-lg' },
  lg: { box: 'size-16', icon: 32, text: 'text-2xl' },
};

function TruckIcon({ size, color = '#fff' }: { size: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 3h15v13H1zM16 8h4l3 4v5h-7V8z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AppLogo({ size = 'sm', showText = true }: AppLogoProps) {
  const s = SIZE_MAP[size];

  return (
    <View className="flex-row items-center gap-2">
      <View className={`${s.box} items-center justify-center rounded-xl bg-primary`}>
        <TruckIcon size={s.icon} />
      </View>
      {showText && (
        <Text className={`${s.text} font-bold tracking-tight`}>AdTruck</Text>
      )}
    </View>
  );
}
