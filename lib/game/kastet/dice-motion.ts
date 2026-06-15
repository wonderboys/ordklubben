import { KASTET_ACTIVE_DICE_COUNT, KASTET_LETTERS_PER_DIE } from "@/lib/game/kastet/config";

export type DiceShakeProfile = {
  /** Stagger before this die joins the shake. */
  delay: number;
  /** Horizontal vibration amplitude (px). */
  ampX: number;
  /** Vertical vibration amplitude (px). */
  ampY: number;
  /** Max rotation during shake (degrees). */
  rotRange: number;
  /** Short hop height before landing (px). */
  hopHeight: number;
  /** Subtle squash on landing. */
  squash: number;
};

/** Per-die shake profiles — organic, never identical. */
export const DICE_SHAKE_PROFILES: DiceShakeProfile[] = [
  { delay: 0, ampX: 6, ampY: 5, rotRange: 6, hopHeight: 5, squash: 0.94 },
  { delay: 0.035, ampX: 7, ampY: 6, rotRange: 7, hopHeight: 6, squash: 0.93 },
  { delay: 0.06, ampX: 5, ampY: 7, rotRange: 5, hopHeight: 4, squash: 0.95 },
  { delay: 0.045, ampX: 8, ampY: 5, rotRange: 8, hopHeight: 5, squash: 0.92 },
];

/** Keyframe times: still → shake → hop → land */
export const DICE_SHAKE_TIMES = [
  0, 0.06, 0.14, 0.22, 0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.78, 0.86, 0.93, 1,
] as const;

export function getDiceShakeProfile(index: number): DiceShakeProfile {
  return DICE_SHAKE_PROFILES[index % DICE_SHAKE_PROFILES.length]!;
}

export function buildDiceShakeMotion(profile: DiceShakeProfile) {
  const { ampX: ax, ampY: ay, rotRange: r, hopHeight: hop } = profile;

  return {
    x: [
      0,
      0,
      ax,
      -ax * 0.95,
      ax * 0.85,
      -ax * 0.9,
      ax * 0.75,
      -ax * 0.8,
      ax * 0.65,
      -ax * 0.55,
      ax * 0.4,
      0,
      0,
      0,
    ],
    y: [
      0,
      0,
      ay * 0.45,
      -ay,
      ay * 0.9,
      -ay * 0.85,
      ay * 0.7,
      -ay * 0.75,
      ay * 0.55,
      -ay * 0.45,
      ay * 0.3,
      0,
      -hop,
      0,
    ],
    rotate: [
      0,
      0,
      r,
      -r * 0.95,
      r * 0.8,
      -r * 0.85,
      r * 0.65,
      -r * 0.7,
      r * 0.5,
      -r * 0.4,
      r * 0.25,
      0,
      0,
      0,
    ],
    scaleY: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, profile.squash, 1],
    scaleX: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.04, 1],
  };
}

export function buildDiceSettleMotion(profile: DiceShakeProfile) {
  return {
    y: [0, 2, -1, 0],
    scaleY: [1, profile.squash + 0.02, 1.02, 1],
    scaleX: [1, 1.03, 0.99, 1],
    rotate: 0,
  };
}

export function getDiceShakeProfiles(count: number = KASTET_ACTIVE_DICE_COUNT) {
  return Array.from({ length: count }, (_, index) => getDiceShakeProfile(index));
}

export function getDiceShakeDurationMs(lettersPerDie: number = KASTET_LETTERS_PER_DIE) {
  // Room for future tuning by letters-per-die.
  void lettersPerDie;
  return 1800;
}
