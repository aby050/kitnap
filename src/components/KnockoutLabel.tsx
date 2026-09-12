import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { fonts, gradients } from '../design/tokens';

/**
 * Button text that reads as a hole punched through the button.
 *
 * The white CTA sits over the app's ground gradient, and the label is filled
 * with the colour the ground has *at that point on the screen* — so the
 * letters look transparent: green while the button sits low in the saturated
 * zone, near-black once it scrolls up into the black.
 *
 * Done with an SVG gradient in `userSpaceOnUse` rather than a mask, which is
 * what makes it work without @react-native-masked-view (a native dependency
 * and a rebuild). The gradient is declared in SCREEN coordinates and then the
 * text is drawn at a negative offset, so stop positions land exactly where
 * the real ground's stops land behind the button. A mask would have produced
 * the same picture; this reuses a library the app already ships.
 *
 * It is genuinely the ground's colours, not an approximation: the stops and
 * locations come from the same `gradients.ground` the background paints with,
 * so the two can never drift apart — including when the colour scheme changes.
 */
export default function KnockoutLabel({
  text,
  /** Distance from the top of the WINDOW to the top of the label box. */
  screenY,
  width,
  height,
  fontSize = 17,
}: {
  text: string;
  screenY: number;
  width: number;
  height: number;
  fontSize?: number;
}) {
  const screenH = Dimensions.get('window').height;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient
          id="knockout"
          // Screen space: y1/y2 span the whole window, shifted up by the
          // label's own offset, so a stop at 60% of the gradient sits at 60%
          // of the SCREEN rather than 60% of this little text box.
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={-screenY}
          x2="0"
          y2={screenH - screenY}
        >
          {gradients.ground.map((c, i) => (
            <Stop key={i} offset={gradients.groundLocations[i] ?? i / (gradients.ground.length - 1)} stopColor={c} />
          ))}
        </LinearGradient>
      </Defs>
      <SvgText
        x={width / 2}
        y={height / 2}
        fill="url(#knockout)"
        fontSize={fontSize}
        fontWeight="600"
        fontFamily={fonts.semibold}
        textAnchor="middle"
        alignmentBaseline="central"
      >
        {text}
      </SvgText>
    </Svg>
  );
}
