import Svg, { Defs, LinearGradient, Stop, Path } from "react-native-svg";

function StudentIcon() {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="studentGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#A78BFA" />
          <Stop offset="1" stopColor="#7C3AED" />
        </LinearGradient>
      </Defs>
      {/* Academy Hat / Crown Base */}
      <Path d="M2 9l10-5 10 5-10 5-10-5z" fill="url(#studentGrad)" />
      <Path
        d="M6 12v4c0 1.5 2.5 3 6 3s6-1.5 6-3v-4"
        stroke="url(#studentGrad)"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* Golden Star Sparkle */}
      <Path
        d="M12 14l1.2 2.4 2.6.4-1.9 1.8.4 2.6-2.3-1.2-2.3 1.2.4-2.6-1.9-1.8 2.6-.4L12 14z"
        fill="#FFD93D"
      />
    </Svg>
  );
}

export default StudentIcon;
