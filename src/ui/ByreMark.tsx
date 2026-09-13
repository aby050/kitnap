import React from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/**
 * The Byre mark, as a vector.
 *
 * Was a pair of PNGs — one per colour scheme — picked by `brandMark.ts`. A
 * raster mark has to be exported again for every size it appears at, goes
 * soft on the splash where it is drawn at 200pt, and cannot be recoloured
 * without another export. This is the same artwork as a path, so it is sharp
 * at any size and takes its colour from a prop.
 *
 * `evenOdd` matters: the counter of the loop and the eye of the spiral are
 * subpaths of the same shape, and the default nonzero rule fills them in.
 */
const MARK_PATH =
  'M 462 75 L 422 89 L 386 107 L 361 123 L 328 150 L 300 180 L 275 215 L 260 243 L 256 255 L 252 262 L 245 286 L 242 292 L 235 327 L 232 355 L 232 378 L 231 379 L 229 783 L 234 831 L 243 874 L 259 918 L 273 947 L 288 971 L 291 978 L 325 1023 L 362 1061 L 387 1082 L 423 1107 L 450 1122 L 488 1139 L 531 1153 L 573 1162 L 614 1167 L 686 1168 L 736 1162 L 781 1152 L 822 1138 L 869 1116 L 874 1112 L 893 1102 L 929 1077 L 969 1042 L 994 1016 L 1024 978 L 1048 940 L 1067 902 L 1083 859 L 1093 818 L 1098 782 L 1099 749 L 1100 748 L 1098 697 L 1093 662 L 1086 632 L 1074 597 L 1054 556 L 1029 518 L 998 483 L 967 456 L 929 431 L 890 412 L 862 402 L 843 397 L 841 395 L 841 360 L 836 311 L 832 290 L 823 260 L 818 249 L 818 246 L 803 215 L 783 183 L 768 164 L 749 144 L 720 120 L 687 99 L 659 86 L 619 73 L 578 66 L 523 65 L 496 68 Z M 698 528 L 699 529 L 699 615 L 696 625 L 690 636 L 680 645 L 672 649 L 663 651 L 648 649 L 638 643 L 632 637 L 625 623 L 624 602 L 629 583 L 642 562 L 657 548 L 680 534 Z M 499 214 L 517 210 L 540 209 L 541 208 L 570 210 L 584 213 L 607 221 L 623 229 L 638 239 L 660 259 L 672 274 L 683 292 L 691 310 L 696 326 L 700 351 L 700 382 L 698 387 L 662 393 L 629 403 L 593 420 L 572 433 L 550 450 L 523 478 L 500 511 L 490 531 L 483 549 L 476 577 L 474 591 L 475 635 L 480 659 L 489 684 L 500 705 L 520 732 L 535 747 L 564 769 L 597 785 L 609 788 L 612 790 L 634 795 L 676 796 L 696 793 L 725 784 L 752 770 L 780 748 L 800 726 L 818 698 L 828 676 L 835 652 L 840 620 L 841 546 L 842 545 L 855 551 L 880 569 L 895 583 L 910 600 L 930 631 L 942 658 L 947 673 L 953 698 L 956 722 L 955 773 L 945 820 L 932 853 L 921 874 L 906 897 L 885 923 L 861 947 L 843 962 L 817 980 L 801 989 L 769 1004 L 743 1013 L 709 1021 L 687 1024 L 676 1024 L 675 1025 L 633 1024 L 601 1019 L 574 1012 L 551 1004 L 518 988 L 497 975 L 475 958 L 446 930 L 435 917 L 419 895 L 416 888 L 408 876 L 407 872 L 403 867 L 387 827 L 379 791 L 377 760 L 376 759 L 376 487 L 377 486 L 376 484 L 377 476 L 376 392 L 377 391 L 377 359 L 379 343 L 384 323 L 390 307 L 405 280 L 417 265 L 438 245 L 454 234 L 474 223 Z';

export type MarkTone = 'brand' | 'dark';

export default function ByreMark({
  size = 64,
  tone = 'brand',
  color,
}: {
  size?: number;
  tone?: MarkTone;
  /** Overrides `tone` entirely — a flat fill, for a single-colour context. */
  color?: string;
}) {
  /* Sampled from the source vector rather than approximated: the ramp holds a
   * pale highlight for the first fifth, dives through the saturated middle,
   * then deepens at the end. Three stops lose the highlight and the mark goes
   * flat. */
  const body =
    tone === 'dark'
      ? ['#0B4A4E', '#0A3B41', '#082E35', '#06242B', '#041A20']
      : ['#B9FFF4', '#63EBDD', '#18D6CA', '#08BFC0', '#079CA8'];
  const offsets = ['0%', '22%', '52%', '78%', '100%'];

  return (
    <Svg width={size} height={size * (1239 / 1270)} viewBox="0 0 1270 1239">
      <Defs>
        <LinearGradient id="byreBody" x1="0.22" y1="0.02" x2="0.72" y2="0.98">
          {body.map((c, i) => (
            <Stop key={c} offset={offsets[i]} stopColor={c} />
          ))}
        </LinearGradient>
        {/* The specular pass that gives the mark its bevel. Dropped on a flat
            `color`, where a highlight over one tone reads as a smudge. */}
        <LinearGradient id="byreShine" x1="0.1" y1="0" x2="0.9" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.55} />
          <Stop offset="38%" stopColor="#FFFFFF" stopOpacity={0.08} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
      </Defs>

      <Path d={MARK_PATH} fillRule="evenodd" fill={color ?? 'url(#byreBody)'} />
      {!color && <Path d={MARK_PATH} fillRule="evenodd" fill="url(#byreShine)" opacity={0.72} />}
    </Svg>
  );
}
