import { theme } from "../design-system/tokens";
import Svg, { Circle, Line, Rect, Text as SvgText } from "react-native-svg";
import { View } from "react-native";
import type { RouteMapProps } from "./RouteMap";
export default function RouteMap({
  destination,
  height = theme.layout.map,
}: RouteMapProps) {
  return (
    <View
      accessibilityLabel={`Esquema de ruta demo a ${destination.addressFull}`}
      style={{
        height,
        backgroundColor: theme.colors.soft,
        borderRadius: theme.radius.lg,
        overflow: "hidden",
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 400 260">
        <Rect width="400" height="260" fill="#F1F5F9" />
        {[50, 110, 170, 230, 290, 350].map((x) => (
          <Line
            key={x}
            x1={x}
            y1={0}
            x2={x}
            y2={260}
            stroke="#FFF"
            strokeWidth={18}
          />
        ))}
        {[50, 110, 170, 230].map((y) => (
          <Line
            key={y}
            x1={0}
            y1={y}
            x2={400}
            y2={y}
            stroke="#FFF"
            strokeWidth={18}
          />
        ))}
        <Line
          x1={80}
          y1={190}
          x2={320}
          y2={65}
          stroke={theme.colors.primary}
          strokeWidth={5}
          strokeDasharray="8 5"
        />
        <Circle cx={80} cy={190} r={13} fill={theme.colors.primary} />
        <Circle cx={320} cy={65} r={13} fill="#7CA024" />
        <SvgText x={50} y={224} fontSize={14} fill={theme.colors.primary}>
          Chofer
        </SvgText>
        <SvgText x={288} y={40} fontSize={14} fill={theme.colors.primary}>
          Destino
        </SvgText>
      </Svg>
    </View>
  );
}
