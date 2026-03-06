import React from "react";
import Svg, { Circle, Path, Rect, Ellipse, G } from "react-native-svg";

interface IconProps {
  size?: number;
}

// ─── LION ───
function LionIcon({ size = 32 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Mane */}
      <Circle cx="16" cy="16" r="14" fill="#D97706" />
      <Circle cx="8" cy="10" r="3" fill="#F59E0B" />
      <Circle cx="24" cy="10" r="3" fill="#F59E0B" />
      <Circle cx="6" cy="16" r="3" fill="#F59E0B" />
      <Circle cx="26" cy="16" r="3" fill="#F59E0B" />
      <Circle cx="8" cy="22" r="3" fill="#F59E0B" />
      <Circle cx="24" cy="22" r="3" fill="#F59E0B" />
      {/* Face */}
      <Circle cx="16" cy="17" r="10" fill="#FBBF24" />
      {/* Eyes */}
      <Ellipse cx="12" cy="15" rx="2" ry="2.2" fill="#1a1a2e" />
      <Ellipse cx="20" cy="15" rx="2" ry="2.2" fill="#1a1a2e" />
      <Circle cx="12.6" cy="14.2" r="0.7" fill="white" />
      <Circle cx="20.6" cy="14.2" r="0.7" fill="white" />
      {/* Nose */}
      <Ellipse cx="16" cy="19" rx="2.5" ry="1.8" fill="#D97706" />
      {/* Mouth */}
      <Path d="M14 21q2 2 4 0" stroke="#92400E" strokeWidth="1" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// ─── FOX ───
function FoxIcon({ size = 32 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Ears */}
      <Path d="M8 4L5 14h6z" fill="#EA580C" />
      <Path d="M24 4l3 10h-6z" fill="#EA580C" />
      <Path d="M9 6l-2 7h4z" fill="#FBBF24" />
      <Path d="M23 6l2 7h-4z" fill="#FBBF24" />
      {/* Face */}
      <Ellipse cx="16" cy="18" rx="11" ry="10" fill="#F97316" />
      {/* White chin */}
      <Ellipse cx="16" cy="22" rx="7" ry="6" fill="white" />
      {/* Eyes */}
      <Ellipse cx="11" cy="16" rx="2" ry="2.2" fill="#1a1a2e" />
      <Ellipse cx="21" cy="16" rx="2" ry="2.2" fill="#1a1a2e" />
      <Circle cx="11.5" cy="15.3" r="0.7" fill="white" />
      <Circle cx="21.5" cy="15.3" r="0.7" fill="white" />
      {/* Nose */}
      <Ellipse cx="16" cy="19.5" rx="2" ry="1.5" fill="#1a1a2e" />
      {/* Mouth */}
      <Path d="M14.5 21.5q1.5 1.5 3 0" stroke="#9CA3AF" strokeWidth="0.8" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// ─── PANDA ───
function PandaIcon({ size = 32 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Ears */}
      <Circle cx="7" cy="8" r="5" fill="#1a1a2e" />
      <Circle cx="25" cy="8" r="5" fill="#1a1a2e" />
      {/* Face */}
      <Circle cx="16" cy="17" r="12" fill="white" />
      {/* Eye patches */}
      <Ellipse cx="11" cy="15" rx="4" ry="4.5" fill="#1a1a2e" transform="rotate(-10 11 15)" />
      <Ellipse cx="21" cy="15" rx="4" ry="4.5" fill="#1a1a2e" transform="rotate(10 21 15)" />
      {/* Eyes */}
      <Circle cx="11" cy="15" r="2" fill="white" />
      <Circle cx="21" cy="15" r="2" fill="white" />
      <Circle cx="11.4" cy="14.6" r="1" fill="#1a1a2e" />
      <Circle cx="21.4" cy="14.6" r="1" fill="#1a1a2e" />
      <Circle cx="11.8" cy="14" r="0.4" fill="white" />
      <Circle cx="21.8" cy="14" r="0.4" fill="white" />
      {/* Nose */}
      <Ellipse cx="16" cy="20" rx="2" ry="1.5" fill="#1a1a2e" />
      {/* Mouth */}
      <Path d="M14.5 22q1.5 1.2 3 0" stroke="#4B5563" strokeWidth="0.8" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// ─── UNICORN ───
function UnicornIcon({ size = 32 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Horn */}
      <Path d="M16 1l-2.5 10h5z" fill="#FFD93D" />
      {/* Ears */}
      <Path d="M8 8l-1 6h4z" fill="#F9A8D4" />
      <Path d="M24 8l1 6h-4z" fill="#F9A8D4" />
      {/* Face */}
      <Ellipse cx="16" cy="18" rx="11" ry="11" fill="#F9A8D4" />
      {/* Mane */}
      <Path d="M5 12q-2 4-1 8" stroke="#C084FC" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <Path d="M4 14q-2 3-1 6" stroke="#F472B6" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Eyes */}
      <Ellipse cx="11" cy="17" rx="2.2" ry="2.5" fill="#1a1a2e" />
      <Ellipse cx="21" cy="17" rx="2.2" ry="2.5" fill="#1a1a2e" />
      <Circle cx="11.7" cy="16" r="0.8" fill="white" />
      <Circle cx="21.7" cy="16" r="0.8" fill="white" />
      {/* Blush */}
      <Ellipse cx="8" cy="20" rx="2" ry="1" fill="#F472B6" opacity="0.3" />
      <Ellipse cx="24" cy="20" rx="2" ry="1" fill="#F472B6" opacity="0.3" />
      {/* Nose */}
      <Circle cx="16" cy="21" r="1.2" fill="#E879A0" />
      {/* Smile */}
      <Path d="M13.5 23q2.5 2 5 0" stroke="#C9607A" strokeWidth="0.8" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// ─── DRAGON ───
function DragonIcon({ size = 32 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Horns */}
      <Path d="M9 5l-3-3v5z" fill="#F59E0B" />
      <Path d="M23 5l3-3v5z" fill="#F59E0B" />
      {/* Face */}
      <Ellipse cx="16" cy="17" rx="12" ry="11" fill="#22C55E" />
      {/* Snout */}
      <Ellipse cx="16" cy="21" rx="7" ry="5" fill="#16A34A" />
      {/* Nostrils */}
      <Circle cx="13" cy="21" r="1.2" fill="#15803D" />
      <Circle cx="19" cy="21" r="1.2" fill="#15803D" />
      {/* Eyes */}
      <Ellipse cx="11" cy="14" rx="2.5" ry="3" fill="#FBBF24" />
      <Ellipse cx="21" cy="14" rx="2.5" ry="3" fill="#FBBF24" />
      <Ellipse cx="11" cy="14.5" rx="1.2" ry="2.5" fill="#1a1a2e" />
      <Ellipse cx="21" cy="14.5" rx="1.2" ry="2.5" fill="#1a1a2e" />
      {/* Scales */}
      <Circle cx="16" cy="9" r="1.5" fill="#16A34A" />
      <Circle cx="13" cy="10" r="1" fill="#16A34A" />
      <Circle cx="19" cy="10" r="1" fill="#16A34A" />
      {/* Mouth */}
      <Path d="M12 25q4 2 8 0" stroke="#15803D" strokeWidth="1" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// ─── OWL ───
function OwlIcon({ size = 32 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Ear tufts */}
      <Path d="M7 6l-2-4 4 2z" fill="#92400E" />
      <Path d="M25 6l2-4-4 2z" fill="#92400E" />
      {/* Body */}
      <Ellipse cx="16" cy="18" rx="12" ry="12" fill="#A16207" />
      {/* Belly */}
      <Ellipse cx="16" cy="22" rx="7" ry="6" fill="#FBBF24" />
      {/* Eye circles */}
      <Circle cx="11" cy="15" r="5" fill="white" />
      <Circle cx="21" cy="15" r="5" fill="white" />
      {/* Eyes */}
      <Circle cx="11" cy="15" r="3" fill="#D97706" />
      <Circle cx="21" cy="15" r="3" fill="#D97706" />
      <Circle cx="11" cy="15" r="1.8" fill="#1a1a2e" />
      <Circle cx="21" cy="15" r="1.8" fill="#1a1a2e" />
      <Circle cx="11.5" cy="14.2" r="0.6" fill="white" />
      <Circle cx="21.5" cy="14.2" r="0.6" fill="white" />
      {/* Beak */}
      <Path d="M14 19l2 3 2-3z" fill="#F59E0B" />
    </Svg>
  );
}

// ─── DOLPHIN ───
function DolphinIcon({ size = 32 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Body */}
      <Ellipse cx="16" cy="16" rx="13" ry="11" fill="#3B82F6" />
      {/* Belly */}
      <Ellipse cx="16" cy="19" rx="9" ry="7" fill="#93C5FD" />
      {/* Fin */}
      <Path d="M16 5l-3 4h6z" fill="#2563EB" />
      {/* Eye */}
      <Circle cx="11" cy="14" r="2.2" fill="white" />
      <Circle cx="11.3" cy="13.8" r="1.2" fill="#1a1a2e" />
      <Circle cx="11.8" cy="13.2" r="0.4" fill="white" />
      {/* Snout */}
      <Ellipse cx="22" cy="16" rx="5" ry="3.5" fill="#60A5FA" />
      {/* Smile */}
      <Path d="M18 18q3-1 6 0" stroke="#2563EB" strokeWidth="1" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// ─── ROCKET ───
function RocketIcon({ size = 32 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Body */}
      <Path d="M16 2c-4 4-5 10-5 16h10c0-6-1-12-5-16z" fill="#E5E7EB" />
      {/* Nose cone */}
      <Path d="M16 2c-2 2-3 5-3.5 8h7c-.5-3-1.5-6-3.5-8z" fill="#EF4444" />
      {/* Window */}
      <Circle cx="16" cy="14" r="3" fill="#3B82F6" />
      <Circle cx="16" cy="14" r="2" fill="#60A5FA" />
      <Circle cx="16.8" cy="13.2" r="0.6" fill="white" />
      {/* Fins */}
      <Path d="M11 18l-3 6h3z" fill="#EF4444" />
      <Path d="M21 18l3 6h-3z" fill="#EF4444" />
      {/* Flames */}
      <Path d="M13 26q1.5 4 3 4t3-4" fill="#F59E0B" />
      <Path d="M14 26q1 3 2 3t2-3" fill="#FBBF24" />
    </Svg>
  );
}

// ─── STAR ───
function StarIcon({ size = 32 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Star shape */}
      <Path
        d="M16 3l3.5 7.5 8 1-6 5.5 1.5 8L16 21l-7 4 1.5-8-6-5.5 8-1z"
        fill="#FFD93D"
      />
      {/* Eyes */}
      <Ellipse cx="13" cy="15" rx="1.5" ry="1.8" fill="#1a1a2e" />
      <Ellipse cx="19" cy="15" rx="1.5" ry="1.8" fill="#1a1a2e" />
      <Circle cx="13.4" cy="14.4" r="0.5" fill="white" />
      <Circle cx="19.4" cy="14.4" r="0.5" fill="white" />
      {/* Blush */}
      <Ellipse cx="10.5" cy="17" rx="1.5" ry="0.8" fill="#F59E0B" opacity="0.5" />
      <Ellipse cx="21.5" cy="17" rx="1.5" ry="0.8" fill="#F59E0B" opacity="0.5" />
      {/* Smile */}
      <Path d="M14 18q2 2 4 0" stroke="#D97706" strokeWidth="1" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// ─── DINO ───
function DinoIcon({ size = 32 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Back plates */}
      <Circle cx="12" cy="5" r="2.5" fill="#16A34A" />
      <Circle cx="16" cy="4" r="2" fill="#16A34A" />
      <Circle cx="20" cy="5" r="2.5" fill="#16A34A" />
      {/* Head */}
      <Ellipse cx="16" cy="17" rx="12" ry="11" fill="#4ADE80" />
      {/* Snout bump */}
      <Ellipse cx="16" cy="22" rx="8" ry="5" fill="#22C55E" />
      {/* Eye */}
      <Circle cx="11" cy="14" r="3" fill="white" />
      <Circle cx="21" cy="14" r="3" fill="white" />
      <Circle cx="11.3" cy="13.7" r="1.5" fill="#1a1a2e" />
      <Circle cx="21.3" cy="13.7" r="1.5" fill="#1a1a2e" />
      <Circle cx="11.8" cy="13" r="0.5" fill="white" />
      <Circle cx="21.8" cy="13" r="0.5" fill="white" />
      {/* Nostrils */}
      <Circle cx="14" cy="21" r="0.8" fill="#16A34A" />
      <Circle cx="18" cy="21" r="0.8" fill="#16A34A" />
      {/* Spots */}
      <Circle cx="7" cy="17" r="1.2" fill="#22C55E" />
      <Circle cx="25" cy="17" r="1.2" fill="#22C55E" />
      {/* Smile */}
      <Path d="M12 25q4 1.5 8 0" stroke="#16A34A" strokeWidth="1" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// ─── CAT ───
function CatIcon({ size = 32 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Ears */}
      <Path d="M5 5l1 10 5-6z" fill="#F97316" />
      <Path d="M27 5l-1 10-5-6z" fill="#F97316" />
      <Path d="M7 7l1 7 3-4z" fill="#FBBF24" />
      <Path d="M25 7l-1 7-3-4z" fill="#FBBF24" />
      {/* Face */}
      <Circle cx="16" cy="18" r="11" fill="#F97316" />
      {/* Inner face */}
      <Ellipse cx="16" cy="20" rx="8" ry="7" fill="#FBBF24" />
      {/* Eyes */}
      <Ellipse cx="11" cy="16" rx="2" ry="2.5" fill="#22C55E" />
      <Ellipse cx="21" cy="16" rx="2" ry="2.5" fill="#22C55E" />
      <Ellipse cx="11" cy="16.3" rx="1" ry="2.2" fill="#1a1a2e" />
      <Ellipse cx="21" cy="16.3" rx="1" ry="2.2" fill="#1a1a2e" />
      {/* Nose */}
      <Path d="M15 20l1 1.5 1-1.5z" fill="#E85D75" />
      {/* Whiskers */}
      <Path d="M3 17h7M3 19h6" stroke="#D97706" strokeWidth="0.6" strokeLinecap="round" />
      <Path d="M29 17h-7M29 19h-6" stroke="#D97706" strokeWidth="0.6" strokeLinecap="round" />
      {/* Mouth */}
      <Path d="M16 21.5v1.5M14.5 23q1.5 1 3 0" stroke="#D97706" strokeWidth="0.7" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// ─── DOG ───
function DogIcon({ size = 32 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Floppy ears */}
      <Ellipse cx="6" cy="16" rx="5" ry="8" fill="#92400E" transform="rotate(-15 6 16)" />
      <Ellipse cx="26" cy="16" rx="5" ry="8" fill="#92400E" transform="rotate(15 26 16)" />
      {/* Face */}
      <Circle cx="16" cy="16" r="11" fill="#D4956B" />
      {/* Forehead patch */}
      <Ellipse cx="16" cy="12" rx="5" ry="4" fill="#A16207" />
      {/* Eyes */}
      <Circle cx="12" cy="14" r="2.5" fill="white" />
      <Circle cx="20" cy="14" r="2.5" fill="white" />
      <Circle cx="12.3" cy="13.8" r="1.3" fill="#1a1a2e" />
      <Circle cx="20.3" cy="13.8" r="1.3" fill="#1a1a2e" />
      <Circle cx="12.7" cy="13.2" r="0.4" fill="white" />
      <Circle cx="20.7" cy="13.2" r="0.4" fill="white" />
      {/* Muzzle */}
      <Ellipse cx="16" cy="20" rx="5" ry="4" fill="#F5DEB3" />
      {/* Nose */}
      <Ellipse cx="16" cy="18.5" rx="2.5" ry="1.8" fill="#1a1a2e" />
      {/* Tongue */}
      <Path d="M15 22q1 3 2 0" fill="#E85D75" />
    </Svg>
  );
}

// ─── CHILD (fallback) ───
function ChildIcon({ size = 32 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Hair */}
      <Circle cx="16" cy="13" r="11" fill="#5D3A1A" />
      {/* Face */}
      <Circle cx="16" cy="16" r="10" fill="#F4C28F" />
      {/* Fringe */}
      <Path d="M6 13c2-5 6-8 10-8s8 3 10 8" fill="#5D3A1A" />
      {/* Eyes */}
      <Ellipse cx="12" cy="16" rx="1.8" ry="2" fill="#1a1a2e" />
      <Ellipse cx="20" cy="16" rx="1.8" ry="2" fill="#1a1a2e" />
      <Circle cx="12.5" cy="15.3" r="0.6" fill="white" />
      <Circle cx="20.5" cy="15.3" r="0.6" fill="white" />
      {/* Blush */}
      <Ellipse cx="9" cy="19" rx="2" ry="1" fill="#FFB5B5" opacity="0.4" />
      <Ellipse cx="23" cy="19" rx="2" ry="1" fill="#FFB5B5" opacity="0.4" />
      {/* Smile */}
      <Path d="M13 21q3 3 6 0" stroke="#C0392B" strokeWidth="1" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// ─── ICON MAP ───

const AVATAR_ICON_MAP: Record<string, React.FC<IconProps>> = {
  lion: LionIcon,
  fox: FoxIcon,
  panda: PandaIcon,
  unicorn: UnicornIcon,
  dragon: DragonIcon,
  owl: OwlIcon,
  dolphin: DolphinIcon,
  rocket: RocketIcon,
  star: StarIcon,
  dino: DinoIcon,
  cat: CatIcon,
  dog: DogIcon,
};

/**
 * Renders the SVG avatar for a given avatar ID.
 * Falls back to the child face if ID is unknown.
 */
export function AvatarIcon({ avatarId, size = 32 }: { avatarId?: string; size?: number }) {
  const Icon = avatarId ? AVATAR_ICON_MAP[avatarId] : null;
  if (Icon) return <Icon size={size} />;
  return <ChildIcon size={size} />;
}
