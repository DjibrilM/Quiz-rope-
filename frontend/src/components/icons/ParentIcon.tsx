import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Circle,
} from "react-native-svg";

function ParentIcon() {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="parentGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FF85B3" />
          <Stop offset="1" stopColor="#E85D75" />
        </LinearGradient>
      </Defs>
      {/* Background Glow/Shield Shape */}
      <Path
        d="M12 2L4 5v6c0 5.5 3.5 10.5 8 12 4.5-1.5 8-6.5 8-12V5l-8-3z"
        fill="#E85D75"
        fillOpacity={0.15}
      />
      {/* Main Figure */}
      <Circle cx="12" cy="8" r="4" fill="url(#parentGrad)" />
      <Path
        d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"
        stroke="url(#parentGrad)"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* Heart Accent */}
      <Path
        d="M12 13.5c-1 0-1.5.5-1.5 1s.5 1.5 1.5 2.5c1-1 1.5-2 1.5-2.5s-.5-1-1.5-1z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

export default ParentIcon;
