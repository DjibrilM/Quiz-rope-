import React from "react";
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop, G, Line, Ellipse, Polygon } from "react-native-svg";

interface IconProps {
  size?: number;
}

export function IconMath({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="math" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#60A5FA" />
          <Stop offset="1" stopColor="#3B82F6" />
        </LinearGradient>
      </Defs>
      <Rect x="2" y="2" width="20" height="20" rx="4" fill="url(#math)" opacity="0.15" />
      <Path d="M7 8h4M9 6v4" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
      <Path d="M14 7l3 3M17 7l-3 3" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
      <Path d="M7 16h4" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
      <Path d="M14 15h3M14 17h3" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function IconScience({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="sci" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#A78BFA" />
          <Stop offset="1" stopColor="#7C3AED" />
        </LinearGradient>
      </Defs>
      <Path d="M9 3v6l-4 8a2 2 0 001.8 3h10.4a2 2 0 001.8-3l-4-8V3" stroke="url(#sci)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <Line x1="9" y1="3" x2="15" y2="3" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round" />
      <Ellipse cx="12" cy="16" rx="3" ry="1.5" fill="#C4B5FD" opacity="0.5" />
      <Circle cx="10" cy="15" r="1" fill="#A78BFA" />
      <Circle cx="13" cy="17" r="0.8" fill="#C4B5FD" />
      <Circle cx="14" cy="14.5" r="0.6" fill="#7C3AED" />
    </Svg>
  );
}

export function IconEnglish({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="eng" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F59E0B" />
          <Stop offset="1" stopColor="#D97706" />
        </LinearGradient>
      </Defs>
      <Path d="M4 4h2v16H4z" fill="url(#eng)" />
      <Path d="M6 4c6 0 6 0 14 0a1 1 0 011 1v14a1 1 0 01-1 1c-8 0-8 0-14 0" stroke="#F59E0B" strokeWidth="1.5" fill="none" />
      <Path d="M10 8h7M10 12h7M10 16h5" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IconHistory({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="hist" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F472B6" />
          <Stop offset="1" stopColor="#DB2777" />
        </LinearGradient>
      </Defs>
      <Rect x="4" y="10" width="4" height="10" rx="0.5" fill="#F9A8D4" />
      <Rect x="10" y="10" width="4" height="10" rx="0.5" fill="url(#hist)" />
      <Rect x="16" y="10" width="4" height="10" rx="0.5" fill="#F9A8D4" />
      <Path d="M3 10h18" stroke="#F472B6" strokeWidth="1.5" />
      <Polygon points="12,3 3,10 21,10" fill="url(#hist)" opacity="0.8" />
      <Path d="M3 20h18" stroke="#F472B6" strokeWidth="1.5" />
    </Svg>
  );
}

export function IconGeography({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="geo" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#34D399" />
          <Stop offset="1" stopColor="#059669" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="9" stroke="url(#geo)" strokeWidth="1.8" fill="none" />
      <Ellipse cx="12" cy="12" rx="4" ry="9" stroke="#34D399" strokeWidth="1.2" fill="none" />
      <Path d="M3 12h18" stroke="#34D399" strokeWidth="1.2" />
      <Path d="M4.5 7.5h15M4.5 16.5h15" stroke="#6EE7B7" strokeWidth="0.8" />
      <Path d="M9 5c-1 2 1 4 0 6s2 3 1 5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </Svg>
  );
}

export function IconEasy({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="easy" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#34D399" />
          <Stop offset="1" stopColor="#10B981" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="9" fill="url(#easy)" opacity="0.15" />
      <Circle cx="12" cy="12" r="9" stroke="url(#easy)" strokeWidth="2" fill="none" />
      <Path d="M8 12l3 3 5-6" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function IconMedium({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="med" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FBBF24" />
          <Stop offset="1" stopColor="#F59E0B" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="9" fill="url(#med)" opacity="0.15" />
      <Circle cx="12" cy="12" r="9" stroke="url(#med)" strokeWidth="2" fill="none" />
      <Path d="M8 12h8" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M8 8.5h8M8 15.5h8" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IconHard({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="hard" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F87171" />
          <Stop offset="1" stopColor="#EF4444" />
        </LinearGradient>
      </Defs>
      <Circle cx="12" cy="12" r="9" fill="url(#hard)" opacity="0.15" />
      <Circle cx="12" cy="12" r="9" stroke="url(#hard)" strokeWidth="2" fill="none" />
      <Path d="M12 7v6" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx="12" cy="16.5" r="1.5" fill="#F87171" />
    </Svg>
  );
}

const SUBJECT_ICONS: Record<string, React.FC<IconProps>> = {
  MATH: IconMath,
  SCIENCE: IconScience,
  ENGLISH: IconEnglish,
  HISTORY: IconHistory,
  GEOGRAPHY: IconGeography,
};

export function SubjectIcon({ subject, size = 28 }: { subject: string; size?: number }) {
  const Icon = SUBJECT_ICONS[subject];
  if (!Icon) return null;
  return <Icon size={size} />;
}
