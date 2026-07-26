import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';

export interface ChartDataPoint {
  label: string;
  value: number;
}

interface MiniChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  type?: 'line' | 'bar';
  title: string;
  unit?: string;
}

const SVG_W = 320;

export function MiniChart({
  data,
  height = 130,
  color,
  type = 'line',
  title,
  unit = '',
}: MiniChartProps) {
  const colors = useColors();
  const chartColor = color ?? colors.primary;

  const padL = 4;
  const padR = 4;
  const padT = 12;
  const padB = 22;
  const chartH = height - padT - padB;

  if (data.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.card, borderColor: colors.border, height: height + 32 },
        ]}
      >
        <Text style={[styles.title, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text>
        <View style={styles.emptyInner}>
          <Feather name="bar-chart-2" size={18} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>NESSUN DATO</Text>
        </View>
      </View>
    );
  }

  const values = data.map(d => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const toX = (i: number) =>
    data.length > 1
      ? padL + (i / (data.length - 1)) * (SVG_W - padL - padR)
      : SVG_W / 2;

  const toY = (v: number) => padT + (1 - (v - minV) / range) * chartH;

  // X-axis label indices: first, middle, last (up to 3)
  const labelIdxs =
    data.length >= 3
      ? [0, Math.floor((data.length - 1) / 2), data.length - 1]
      : data.length === 2
      ? [0, 1]
      : [0];

  const lastX = toX(data.length - 1);
  const lastY = toY(data[data.length - 1].value);
  const lastVal = `${data[data.length - 1].value}${unit}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text>
      <Svg width="100%" height={height} viewBox={`0 0 ${SVG_W} ${height}`}>
        {type === 'line' ? (
          <>
            <Polyline
              points={data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ')}
              fill="none"
              stroke={chartColor}
              strokeWidth="1.8"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <Circle cx={lastX} cy={lastY} r={3.5} fill={chartColor} />
          </>
        ) : (
          data.map((d, i) => {
            const barW = Math.max(2, ((SVG_W - padL - padR) / data.length) * 0.6);
            const bh = Math.max(1, toY(minV) - toY(d.value));
            return (
              <Rect
                key={i}
                x={toX(i) - barW / 2}
                y={toY(d.value)}
                width={barW}
                height={bh}
                fill={chartColor}
              />
            );
          })
        )}

        {/* X-axis labels */}
        {labelIdxs.map(i => (
          <SvgText
            key={i}
            x={Math.max(20, Math.min(SVG_W - 20, toX(i)))}
            y={height - 5}
            fontSize={9}
            fill={colors.mutedForeground}
            textAnchor="middle"
            fontFamily="Inter_400Regular"
          >
            {data[i].label}
          </SvgText>
        ))}

        {/* Last value label */}
        <SvgText
          x={Math.min(lastX, SVG_W - 32)}
          y={Math.max(lastY - 5, padT + 10)}
          fontSize={11}
          fill={chartColor}
          textAnchor={lastX > SVG_W - 40 ? 'end' : 'start'}
          fontFamily="BebasNeue_400Regular"
        >
          {lastVal}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: {
    fontSize: 9,
    letterSpacing: 2.5,
    fontFamily: 'Inter_400Regular',
    marginBottom: 0,
  },
  emptyInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: 'Inter_400Regular',
  },
});
