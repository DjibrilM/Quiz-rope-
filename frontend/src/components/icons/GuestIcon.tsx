import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Path,
} from "react-native-svg";
import { AvatarIcon } from "../common";

function GuestIcon({ avatarId }: { avatarId?: string }) {
  if (avatarId) return <AvatarIcon avatarId={avatarId} size={48} />;

  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="guestGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#6EE7B7" />
          <Stop offset="1" stopColor="#059669" />
        </LinearGradient>
      </Defs>
      {/* Cloaked/Mystery Shape */}
      <Circle
        cx="12"
        cy="8"
        r="4.5"
        stroke="url(#guestGrad)"
        strokeWidth={2.5}
      />
      <Path
        d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"
        stroke="url(#guestGrad)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* Question Mark Accent */}
      <Path
        d="M11 7h1v1h-1zM11 9h1v3h-1z"
        fill="#FFFFFF"
        transform="translate(0, -1)"
      />
    </Svg>
  );
}

export default GuestIcon;
