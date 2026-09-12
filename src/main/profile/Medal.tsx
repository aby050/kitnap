import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { AchievementDef } from '../../data/progress';

let medalIdCounter = 0;

/**
 * 3D Enameled Pin & Award Medal Component
 *
 * Implements the Apple Fitness & Cal AI award aesthetic:
 * 1. Front-facing orthographic camera angle.
 * 2. Multi-layered metallic bevels (Chrome, Gold, Copper, Titanium).
 * 3. Glossy enamel surfaces with vibrant segmented cloisonné palettes.
 * 4. Zero clipping or edge-cropping: padded canvas geometry (100x100 viewBox).
 */
export default function Medal({
  def,
  id,
  size = 64,
  locked = false,
}: {
  def?: AchievementDef;
  id?: string;
  size?: number;
  locked?: boolean;
  medal?: AchievementDef['medal'];
}) {
  const rawId = def?.id ?? id ?? 'first-light';
  const badgeId = rawId.replace(/^tier-/, '');
  const gid = React.useMemo(() => `medal-${badgeId}-${++medalIdCounter}`, [badgeId]);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: locked ? 0.28 : 1,
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          {/* Metallic Gradients */}
          <SvgGradient id={`${gid}-gold`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFF2B2" />
            <Stop offset="25%" stopColor="#E5B338" />
            <Stop offset="60%" stopColor="#8C5C0F" />
            <Stop offset="85%" stopColor="#F9D768" />
            <Stop offset="100%" stopColor="#825208" />
          </SvgGradient>

          <SvgGradient id={`${gid}-chrome`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="30%" stopColor="#B0B5BA" />
            <Stop offset="55%" stopColor="#6C737B" />
            <Stop offset="85%" stopColor="#E8ECF0" />
            <Stop offset="100%" stopColor="#525860" />
          </SvgGradient>

          <SvgGradient id={`${gid}-copper`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFC8A8" />
            <Stop offset="30%" stopColor="#D97746" />
            <Stop offset="60%" stopColor="#7E3312" />
            <Stop offset="85%" stopColor="#FFA677" />
            <Stop offset="100%" stopColor="#5E2209" />
          </SvgGradient>

          <SvgGradient id={`${gid}-amber`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFEAA7" />
            <Stop offset="40%" stopColor="#E67E22" />
            <Stop offset="100%" stopColor="#964000" />
          </SvgGradient>

          <SvgGradient id={`${gid}-violet`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#E2B6FF" />
            <Stop offset="40%" stopColor="#8E44AD" />
            <Stop offset="100%" stopColor="#4A154B" />
          </SvgGradient>

          {/* Enamel Fill Gradients */}
          <SvgGradient id={`${gid}-lime`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#E8FF38" />
            <Stop offset="100%" stopColor="#88DE00" />
          </SvgGradient>

          <SvgGradient id={`${gid}-pink`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FF4181" />
            <Stop offset="100%" stopColor="#D81B60" />
          </SvgGradient>

          <SvgGradient id={`${gid}-mint`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#6E8CF5" />
            <Stop offset="100%" stopColor="#0F3B73" />
          </SvgGradient>

          <SvgGradient id={`${gid}-teal`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#5FE0D6" />
            <Stop offset="100%" stopColor="#0E6251" />
          </SvgGradient>

          <RadialGradient id={`${gid}-cyan-sphere`} cx="38%" cy="38%" r="62%">
            <Stop offset="0%" stopColor="#9CFFF4" />
            <Stop offset="45%" stopColor="#00C9FF" />
            <Stop offset="80%" stopColor="#0964A8" />
            <Stop offset="100%" stopColor="#042C4C" />
          </RadialGradient>

          <RadialGradient id={`${gid}-sun`} cx="40%" cy="40%" r="60%">
            <Stop offset="0%" stopColor="#FFF785" />
            <Stop offset="55%" stopColor="#FFB300" />
            <Stop offset="100%" stopColor="#F57C00" />
          </RadialGradient>

          {/* Drop shadow filter simulation */}
          <RadialGradient id={`${gid}-shadow`} cx="50%" cy="50%" r="50%">
            <Stop offset="60%" stopColor="#000000" stopOpacity={0.65} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Global ambient shadow */}
        <Circle cx="50" cy="52" r="44" fill={`url(#${gid}-shadow)`} opacity={0.4} />

        {renderBadgeGraphic(badgeId, gid)}
      </Svg>
    </View>
  );
}

function renderBadgeGraphic(badgeId: string, gid: string): React.ReactNode {
  switch (badgeId) {
    // ── 1. Reference 3: Concentric Octagonal Target (First Light / Target) ──
    case 'focus-first':
    case 'first-light':
      return (
        <G>
          {/* Octagonal Outer Chrome Bezel */}
          <Polygon
            points="32,8 68,8 92,32 92,68 68,92 32,92 8,68 8,32"
            fill={`url(#${gid}-chrome)`}
          />
          {/* Inner Inset Bezel */}
          <Polygon
            points="33.5,11.5 66.5,11.5 88.5,33.5 88.5,66.5 66.5,88.5 33.5,88.5 11.5,66.5 11.5,33.5"
            fill="#032017"
          />
          {/* Mint Enamel Field */}
          <Polygon
            points="34.5,14 65.5,14 86,34.5 86,65.5 65.5,86 34.5,86 14,65.5 14,34.5"
            fill={`url(#${gid}-mint)`}
          />
          {/* Concentric Silver Rings & Enamel Tracks */}
          <Circle cx="50" cy="50" r="26" fill="#0C4834" stroke={`url(#${gid}-chrome)`} strokeWidth="1.8" />
          <Circle cx="50" cy="50" r="20" fill={`url(#${gid}-teal)`} stroke={`url(#${gid}-chrome)`} strokeWidth="1.5" />
          <Circle cx="50" cy="50" r="13" fill="#0C4834" stroke={`url(#${gid}-chrome)`} strokeWidth="1.5" />
          <Circle cx="50" cy="50" r="6" fill={`url(#${gid}-chrome)`} />
        </G>
      );

    // ── 2. Reference 2: Apple Fitness Neon-Lime & Hot-Pink Heart (Soft Exit / Minute Thief) ──
    case 'hard-1':
    case 'soft-exit':
    case 'saved-1h':
    case 'minute-thief':
      return (
        <G>
          {/* Outer Chrome Metallic Heart Bevel */}
          <Path
            d="M50 88 C20 68 10 46 10 28 C10 14 22 8 34 8 C42 8 47 13 50 18 C53 13 58 8 66 8 C78 8 90 14 90 28 C90 46 80 68 50 88 Z"
            fill={`url(#${gid}-chrome)`}
          />
          {/* Outer Lime Enamel Heart */}
          <Path
            d="M50 84 C23 65 14 44 14 29 C14 17 24 12 34 12 C41 12 46 16 50 21 C54 16 59 12 66 12 C76 12 86 17 86 29 C86 44 77 65 50 84 Z"
            fill={`url(#${gid}-lime)`}
          />
          {/* Inner Chrome Heart Border */}
          <Path
            d="M50 72 C32 56 24 40 24 28 C24 18 31 16 38 16 C43 16 47 19 50 24 C53 19 57 16 62 16 C69 16 76 18 76 28 C76 40 68 56 50 72 Z"
            fill={`url(#${gid}-chrome)`}
          />
          {/* Inner Hot-Pink Enamel Heart */}
          <Path
            d="M50 68 C34 53 27 38 27 28 C27 20 33 18 38 18 C43 18 47 21 50 26 C53 21 57 18 62 18 C67 18 73 20 73 28 C73 38 66 53 50 68 Z"
            fill={`url(#${gid}-pink)`}
          />
          {/* Top Glass Highlight */}
          <Path
            d="M32 20 C28 20 26 23 26 28 C26 31 28 36 32 36 C34 31 36 24 38 20 Z"
            fill="#FFFFFF"
            opacity={0.45}
          />
        </G>
      );

    // ── 3. Reference 4: Apple Fitness Golden Mountain & Sun Shield (Quiet Century / 100h) ──
    case 'focus-100h':
    case 'quiet-century':
    case 'blocked-100':
    case 'shield-wall':
      return (
        <G>
          {/* Outer Gold Shield Frame */}
          <Path
            d="M50 92 C24 74 14 52 14 24 L50 10 L86 24 C86 52 76 74 50 92 Z"
            fill={`url(#${gid}-gold)`}
          />
          {/* Inner Shield Cavity */}
          <Path
            d="M50 87 C27 70 18 49 18 26 L50 14 L82 26 C82 49 73 70 50 87 Z"
            fill="#06120F"
          />
          {/* Cloisonné Segment 1: Sun Sphere */}
          <Circle cx="50" cy="34" r="18" fill={`url(#${gid}-sun)`} stroke={`url(#${gid}-gold)`} strokeWidth="2" />
          {/* Cloisonné Segment 2: Sky Blue Section */}
          <Path d="M18 34 L36 34 L32 46 L18 44 Z" fill="#4FC3F7" stroke={`url(#${gid}-gold)`} strokeWidth="1.5" />
          <Path d="M64 34 L82 34 L82 44 L68 46 Z" fill="#29B6F6" stroke={`url(#${gid}-gold)`} strokeWidth="1.5" />
          {/* Cloisonné Segment 3: Mountain Pines (Green) */}
          <Polygon points="64,22 72,48 56,48" fill="#2E7D32" stroke={`url(#${gid}-gold)`} strokeWidth="1.5" />
          <Polygon points="54,28 62,48 46,48" fill="#388E3C" stroke={`url(#${gid}-gold)`} strokeWidth="1.5" />
          {/* Cloisonné Segment 4: Alpine Snow / Slope */}
          <Polygon points="18 44 42 48 24 64 18 58" fill="#ECEFF1" stroke={`url(#${gid}-gold)`} strokeWidth="1.5" />
          {/* Cloisonné Segment 5: Emerald Green Field */}
          <Path d="M24 64 L82 44 L78 68 L50 78 Z" fill="#43A047" stroke={`url(#${gid}-gold)`} strokeWidth="1.8" />
          {/* Cloisonné Segment 6: Deep Azure Blue Water Base */}
          <Path d="M24 64 L50 78 L78 68 C73 78 62 84 50 87 C38 84 27 78 24 64 Z" fill="#1976D2" stroke={`url(#${gid}-gold)`} strokeWidth="1.8" />
        </G>
      );

    // ── 4. Reference 5: Apple Fitness Golden Rosette Enamel Pin (Time Architect / First Month) ──
    case 'focus-500h':
    case 'time-architect':
    case 'month-1':
    case 'first-month':
      return (
        <G>
          {/* Outer Gold Rosette Ring */}
          <Circle cx="50" cy="50" r="42" fill={`url(#${gid}-gold)`} />
          {/* Overlapping Curved Petals (8 Cloisonné Enamel Petals) */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => (
            <G key={angle} transform={`rotate(${angle} 50 50)`}>
              <Path
                d="M50 12 C62 12 70 24 68 38 C60 44 50 48 50 48 C50 48 40 44 32 38 C30 24 38 12 50 12 Z"
                fill={idx % 2 === 0 ? '#4CAF50' : '#2E7D32'}
                stroke={`url(#${gid}-gold)`}
                strokeWidth="2"
              />
            </G>
          ))}
          {/* Inner Gold Circular Bezel */}
          <Circle cx="50" cy="50" r="23" fill={`url(#${gid}-gold)`} />
          {/* Center Glowing Turquoise Cyan Sphere */}
          <Circle cx="50" cy="50" r="20" fill={`url(#${gid}-cyan-sphere)`} />
          <Circle cx="44" cy="44" r="5" fill="#FFFFFF" opacity={0.5} />
        </G>
      );

    // ── 5. Reference 1: Copper 3-Streak Hexagon (Spark Starter) ──
    case 'streak-3':
    case 'spark-starter':
      return (
        <G>
          <Polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill={`url(#${gid}-copper)`} />
          <Polygon points="50,11 83,30 83,70 50,89 17,70 17,30" fill="#2E1307" />
          <Polygon points="50,14 80,32 80,68 50,86 20,68 20,32" fill={`url(#${gid}-copper)`} />
          {/* 3D Flame Emblem */}
          <Path
            d="M50 20 C54 26 58 28 58 34 C58 39 54 42 50 42 C46 42 42 39 42 34 C42 30 45 28 47 25 C48 27 50 28 50 30 C50 26 49 23 50 20 Z"
            fill="#FFF3D6"
            stroke="#C05A20"
            strokeWidth="1.2"
          />
          <SvgText x="50" y="66" fill="#FFF2E8" fontSize="24" fontWeight="900" textAnchor="middle">
            3
          </SvgText>
          <SvgText x="50" y="78" fill="#FFD1B8" fontSize="7.5" fontWeight="800" textAnchor="middle" letterSpacing="1.5">
            STREAK
          </SvgText>
        </G>
      );

    // ── 6. 7-Streak Amber Gold Hexagon (The Comeback) ──
    case 'streak-7':
    case 'the-comeback':
      return (
        <G>
          <Polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill={`url(#${gid}-amber)`} />
          <Polygon points="50,11 83,30 83,70 50,89 17,70 17,30" fill="#3D1A02" />
          <Polygon points="50,14 80,32 80,68 50,86 20,68 20,32" fill={`url(#${gid}-amber)`} />
          <Path
            d="M50 18 C55 25 60 28 60 34 C60 40 55 43 50 43 C45 43 40 40 40 34 C40 30 44 28 46 24 C47 27 50 28 50 31 C50 26 49 22 50 18 Z"
            fill="#FFFBE8"
            stroke="#9E4600"
            strokeWidth="1.2"
          />
          <SvgText x="50" y="66" fill="#FFFFFF" fontSize="24" fontWeight="900" textAnchor="middle">
            7
          </SvgText>
          <SvgText x="50" y="78" fill="#FFEAA7" fontSize="7.5" fontWeight="800" textAnchor="middle" letterSpacing="1.5">
            STREAK
          </SvgText>
        </G>
      );

    // ── 7. 14-Streak 24k Gold Hexagon (Fortnight Flame) ──
    case 'streak-14':
    case 'fortnight-flame':
      return (
        <G>
          <Polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill={`url(#${gid}-gold)`} />
          <Polygon points="50,11 83,30 83,70 50,89 17,70 17,30" fill="#2E1C02" />
          <Polygon points="50,14 80,32 80,68 50,86 20,68 20,32" fill={`url(#${gid}-gold)`} />
          {/* Dual Flames */}
          <Path d="M42 22 C46 27 48 30 48 34 C48 38 45 40 42 40 C39 40 36 38 36 34 C36 30 39 28 40 25 Z" fill="#FFFCE6" />
          <Path d="M58 22 C62 27 64 30 64 34 C64 38 61 40 58 40 C55 40 52 38 52 34 C52 30 55 28 56 25 Z" fill="#FFFCE6" />
          <SvgText x="50" y="66" fill="#FFFFFF" fontSize="22" fontWeight="900" textAnchor="middle">
            14
          </SvgText>
          <SvgText x="50" y="78" fill="#FFF5C2" fontSize="7.5" fontWeight="800" textAnchor="middle" letterSpacing="1.5">
            STREAK
          </SvgText>
        </G>
      );

    // ── 8. 30-Day Quiet Month Emerald & Gold Shield (Quiet Month) ──
    case 'streak-30':
    case 'quiet-month':
      return (
        <G>
          <Circle cx="50" cy="50" r="42" fill={`url(#${gid}-gold)`} />
          <Circle cx="50" cy="50" r="37" fill="#042318" />
          <Circle cx="50" cy="50" r="34" fill={`url(#${gid}-mint)`} />
          <Circle cx="50" cy="50" r="28" stroke={`url(#${gid}-gold)`} strokeWidth="1.5" fill="none" strokeDasharray="3,3" />
          {/* Crescent Moon & Star */}
          <Path d="M46 22 C56 26 58 40 48 48 C42 52 34 50 30 46 C34 54 48 56 56 46 C62 38 58 24 46 22 Z" fill={`url(#${gid}-gold)`} />
          <Polygon points="64,28 66,32 70,32 67,34 68,38 64,35 60,38 61,34 58,32 62,32" fill={`url(#${gid}-gold)`} />
          <SvgText x="50" y="72" fill="#FFFFFF" fontSize="20" fontWeight="900" textAnchor="middle">
            30
          </SvgText>
          <SvgText x="50" y="81" fill="#D4FCE6" fontSize="6.5" fontWeight="800" textAnchor="middle" letterSpacing="1.5">
            DAYS
          </SvgText>
        </G>
      );

    // ── 9. 60-Day Titanium Diamond Shield (Unbreakable) ──
    case 'streak-60':
    case 'unbreakable':
      return (
        <G>
          <Path d="M50 6 L86 20 L86 64 L50 94 L14 64 L14 20 Z" fill={`url(#${gid}-chrome)`} />
          <Path d="M50 11 L81 23 L81 61 L50 88 L19 61 L19 23 Z" fill="#14181B" />
          <Path d="M50 14 L78 25 L78 59 L50 84 L22 59 L22 25 Z" fill={`url(#${gid}-chrome)`} />
          {/* Faceted 60 Emblem */}
          <SvgText x="50" y="58" fill="#FFFFFF" fontSize="26" fontWeight="900" textAnchor="middle">
            60
          </SvgText>
          <SvgText x="50" y="72" fill="#DDE4EA" fontSize="7" fontWeight="800" textAnchor="middle" letterSpacing="1.5">
            STREAK
          </SvgText>
        </G>
      );

    // ── 10. 100-Day Royal Violet Amethyst Crown (Century Club) ──
    case 'streak-100':
    case 'century-club':
      return (
        <G>
          {/* Royal Crown Shape */}
          <Path d="M50 8 L66 22 L86 16 L78 74 L50 92 L22 74 L14 16 L34 22 Z" fill={`url(#${gid}-gold)`} />
          <Path d="M50 13 L64 25 L81 20 L74 70 L50 86 L26 70 L19 20 L36 25 Z" fill="#240726" />
          <Path d="M50 16 L62 27 L77 22 L71 67 L50 82 L29 67 L23 22 L38 27 Z" fill={`url(#${gid}-violet)`} />
          <Circle cx="50" cy="28" r="4" fill="#FFE57F" />
          <Circle cx="28" cy="26" r="3" fill="#FFE57F" />
          <Circle cx="72" cy="26" r="3" fill="#FFE57F" />
          <SvgText x="50" y="58" fill="#FFFFFF" fontSize="22" fontWeight="900" textAnchor="middle">
            100
          </SvgText>
          <SvgText x="50" y="72" fill="#FFD54F" fontSize="7" fontWeight="800" textAnchor="middle" letterSpacing="1.5">
            STREAK
          </SvgText>
        </G>
      );

    // ── 11. Oceanic Wave Rosette (Deep Current / 10h) ──
    case 'focus-10h':
    case 'deep-current':
      return (
        <G>
          <Circle cx="50" cy="50" r="42" fill={`url(#${gid}-gold)`} />
          <Circle cx="50" cy="50" r="38" fill="#041824" />
          <Circle cx="50" cy="50" r="35" fill="#082A3E" />
          {/* Waves */}
          <Path
            d="M18 56 C26 40 40 34 54 44 C66 52 74 38 82 32 C82 56 74 74 50 84 C34 78 22 68 18 56 Z"
            fill={`url(#${gid}-teal)`}
            stroke={`url(#${gid}-gold)`}
            strokeWidth="1.8"
          />
          <Path
            d="M24 64 C36 50 48 48 60 56 C68 62 76 56 80 50 C76 68 64 78 50 84 C38 82 28 74 24 64 Z"
            fill="#0288D1"
            stroke={`url(#${gid}-gold)`}
            strokeWidth="1.5"
          />
          <Circle cx="50" cy="50" r="42" stroke={`url(#${gid}-gold)`} strokeWidth="3" fill="none" />
        </G>
      );

    // ── 12. Steel & Emerald Hourglass (Iron Hours / 50h) ──
    case 'focus-50h':
    case 'iron-hours':
      return (
        <G>
          <Polygon points="50,8 84,26 84,74 50,92 16,74 16,26" fill={`url(#${gid}-chrome)`} />
          <Polygon points="50,13 79,29 79,71 50,87 21,71 21,29" fill="#0D1F17" />
          {/* Hourglass */}
          <Polygon points="32,24 68,24 50,48" fill={`url(#${gid}-mint)`} stroke={`url(#${gid}-chrome)`} strokeWidth="1.5" />
          <Polygon points="50,52 68,76 32,76" fill={`url(#${gid}-teal)`} stroke={`url(#${gid}-chrome)`} strokeWidth="1.5" />
          <Circle cx="50" cy="50" r="3" fill="#FFFFFF" />
        </G>
      );

    // ── 13. Golden Target & Crosshair (Time Thief Hunter / 10h Saved) ──
    case 'saved-10h':
    case 'time-thief-hunter':
      return (
        <G>
          <Circle cx="50" cy="50" r="42" fill={`url(#${gid}-gold)`} />
          <Circle cx="50" cy="50" r="37" fill="#261A05" />
          <Circle cx="50" cy="50" r="34" fill={`url(#${gid}-amber)`} />
          {/* Crosshair target */}
          <Circle cx="50" cy="50" r="22" stroke={`url(#${gid}-gold)`} strokeWidth="2" fill="none" />
          <Circle cx="50" cy="50" r="12" stroke={`url(#${gid}-gold)`} strokeWidth="2" fill="#D35400" />
          <Circle cx="50" cy="50" r="4" fill="#FFFFFF" />
          <Rect x="48" y="16" width="4" height="68" fill={`url(#${gid}-gold)`} rx="2" />
          <Rect x="16" y="48" width="68" height="4" fill={`url(#${gid}-gold)`} rx="2" />
        </G>
      );

    // ── 14. Golden Sunburst (Hours Reclaimed / 50h Saved) ──
    case 'saved-50h':
    case 'hours-reclaimed':
      return (
        <G>
          {/* Radiating Sun Rays */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
            <G key={angle} transform={`rotate(${angle} 50 50)`}>
              <Polygon points="50,6 54,20 46,20" fill={`url(#${gid}-gold)`} />
            </G>
          ))}
          <Circle cx="50" cy="50" r="32" fill={`url(#${gid}-gold)`} />
          <Circle cx="50" cy="50" r="28" fill="#1C1004" />
          <Circle cx="50" cy="50" r="25" fill={`url(#${gid}-sun)`} />
          <Circle cx="42" cy="42" r="6" fill="#FFFFFF" opacity={0.4} />
        </G>
      );

    // ── 15. Prismatic Stained Glass Sun (Daylight Keeper / 100h Saved) ──
    case 'saved-100h':
    case 'daylight-keeper':
      return (
        <G>
          <Circle cx="50" cy="50" r="42" fill={`url(#${gid}-gold)`} />
          <Circle cx="50" cy="50" r="37" fill="#05141F" />
          {/* Prismatic Segments */}
          <Path d="M50 14 L50 50 L20 32 Z" fill="#E91E63" stroke={`url(#${gid}-gold)`} strokeWidth="1.5" />
          <Path d="M50 14 L80 32 L50 50 Z" fill="#FF9800" stroke={`url(#${gid}-gold)`} strokeWidth="1.5" />
          <Path d="M80 32 L84 64 L50 50 Z" fill="#FFEB3B" stroke={`url(#${gid}-gold)`} strokeWidth="1.5" />
          <Path d="M84 64 L50 86 L50 50 Z" fill="#4CAF50" stroke={`url(#${gid}-gold)`} strokeWidth="1.5" />
          <Path d="M50 86 L16 64 L50 50 Z" fill="#00BCD4" stroke={`url(#${gid}-gold)`} strokeWidth="1.5" />
          <Path d="M16 64 L20 32 L50 50 Z" fill="#9C27B0" stroke={`url(#${gid}-gold)`} strokeWidth="1.5" />
          <Circle cx="50" cy="50" r="10" fill="#FFFFFF" stroke={`url(#${gid}-gold)`} strokeWidth="2" />
        </G>
      );

    // ── 16. Gold & Ruby Anvil Shield (Iron Focus / 10 Hard Unlocks) ──
    case 'hard-10':
    case 'iron-focus':
      return (
        <G>
          <Path d="M50 8 L86 22 L86 64 L50 92 L14 64 L14 22 Z" fill={`url(#${gid}-gold)`} />
          <Path d="M50 13 L81 25 L81 61 L50 86 L19 25 L19 25 Z" fill="#2E0404" />
          <Path d="M50 16 L78 27 L78 58 L50 82 L22 58 L22 27 Z" fill="#C0392B" />
          <Polygon points="30,36 70,36 62,56 38,56" fill={`url(#${gid}-gold)`} />
          <Polygon points="42,56 58,56 50,72" fill={`url(#${gid}-gold)`} />
          <Circle cx="50" cy="46" r="4" fill="#FFFFFF" />
        </G>
      );

    // ── 17. Mint 7-Petal Rosette (First Week / 7 Days in App) ──
    case 'week-1':
    case 'first-week':
      return (
        <G>
          <Circle cx="50" cy="50" r="42" fill={`url(#${gid}-chrome)`} />
          {[0, 51.4, 102.8, 154.2, 205.6, 257, 308.4].map((angle, i) => (
            <G key={angle} transform={`rotate(${angle} 50 50)`}>
              <Path
                d="M50 14 C58 14 64 24 62 36 C56 42 50 46 50 46 C50 46 44 42 38 36 C36 24 42 14 50 14 Z"
                fill={i % 2 === 0 ? `url(#${gid}-mint)` : `url(#${gid}-teal)`}
                stroke={`url(#${gid}-chrome)`}
                strokeWidth="1.5"
              />
            </G>
          ))}
          <Circle cx="50" cy="50" r="14" fill={`url(#${gid}-chrome)`} />
          <Circle cx="50" cy="50" r="10" fill="#00E676" />
        </G>
      );

    // ── Fallback: Golden Enamel Shield ──
    default:
      return (
        <G>
          <Path d="M50 8 C26 24 16 46 16 68 C16 78 50 92 50 92 C50 92 84 78 84 68 C84 46 74 24 50 8 Z" fill={`url(#${gid}-gold)`} />
          <Path d="M50 14 C30 28 22 48 22 66 C22 74 50 86 50 86 C50 86 78 74 78 66 C78 48 70 28 50 14 Z" fill={`url(#${gid}-mint)`} />
          <Circle cx="50" cy="48" r="16" fill={`url(#${gid}-gold)`} />
          <Circle cx="50" cy="48" r="12" fill="#FFFFFF" opacity={0.8} />
        </G>
      );
  }
}
