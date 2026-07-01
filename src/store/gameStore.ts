import { create } from 'zustand';

export const SKILLS = [
  'athletics',
  'acrobatics',
  'sleightOfHand',
  'stealth',
  'arcana',
  'history',
  'investigation',
  'nature',
  'religion',
  'animalHandling',
  'insight',
  'medicine',
  'perception',
  'survival',
  'deception',
  'intimidation',
  'performance',
  'persuasion',
] as const;

export type Skill = (typeof SKILLS)[number];
export type Ability = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

export interface PlayerStats {
  abilities: Record<Ability, number>;
  proficiencyBonus: number;
  proficientSkills: Skill[];
}

export interface SkillCheckResult {
  roll: number;
  modifier: number;
  total: number;
  dc: number;
  success: boolean;
  critical: 'success' | 'failure' | null;
}

export interface GameState {
  activeDialogueNodeId: string | null;
  playerStats: PlayerStats;
  factionReputation: Record<string, number>;
  setActiveDialogueNode: (nodeId: string | null) => void;
  updateAbilityScore: (ability: Ability, score: number) => void;
  setSkillProficiency: (skill: Skill, proficient: boolean) => void;
  adjustFactionReputation: (factionId: string, amount: number) => void;
  rollSkillCheck: (skill: Skill, dc: number, random?: () => number) => SkillCheckResult;
  resetGame: () => void;
}

const SKILL_ABILITIES: Record<Skill, Ability> = {
  athletics: 'strength',
  acrobatics: 'dexterity',
  sleightOfHand: 'dexterity',
  stealth: 'dexterity',
  arcana: 'intelligence',
  history: 'intelligence',
  investigation: 'intelligence',
  nature: 'intelligence',
  religion: 'intelligence',
  animalHandling: 'wisdom',
  insight: 'wisdom',
  medicine: 'wisdom',
  perception: 'wisdom',
  survival: 'wisdom',
  deception: 'charisma',
  intimidation: 'charisma',
  performance: 'charisma',
  persuasion: 'charisma',
};

const INITIAL_PLAYER_STATS: PlayerStats = {
  abilities: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  proficiencyBonus: 2,
  proficientSkills: [],
};

const clampAbilityScore = (score: number): number => Math.min(30, Math.max(1, Math.trunc(score)));
const getAbilityModifier = (score: number): number => Math.floor((score - 10) / 2);

export const useGameStore = create<GameState>((set, get) => ({
  activeDialogueNodeId: null,
  playerStats: INITIAL_PLAYER_STATS,
  factionReputation: {},

  setActiveDialogueNode: (nodeId: string | null): void => set({ activeDialogueNodeId: nodeId }),

  updateAbilityScore: (ability: Ability, score: number): void => set((state) => ({
    playerStats: {
      ...state.playerStats,
      abilities: { ...state.playerStats.abilities, [ability]: clampAbilityScore(score) },
    },
  })),

  setSkillProficiency: (skill: Skill, proficient: boolean): void => set((state) => {
    const withoutSkill = state.playerStats.proficientSkills.filter((entry) => entry !== skill);
    return {
      playerStats: {
        ...state.playerStats,
        proficientSkills: proficient ? [...withoutSkill, skill] : withoutSkill,
      },
    };
  }),

  adjustFactionReputation: (factionId: string, amount: number): void => {
    const normalizedId = factionId.trim();
    if (!normalizedId || !Number.isFinite(amount)) return;

    set((state) => ({
      factionReputation: {
        ...state.factionReputation,
        // A bounded scale makes reputation thresholds predictable for dialogue authors.
        [normalizedId]: Math.min(100, Math.max(-100, (state.factionReputation[normalizedId] ?? 0) + amount)),
      },
    }));
  },

  rollSkillCheck: (skill: Skill, dc: number, random: () => number = Math.random): SkillCheckResult => {
    const { playerStats } = get();
    const safeDc = Math.max(0, Math.trunc(dc));
    const roll = Math.min(20, Math.max(1, Math.floor(random() * 20) + 1));
    const abilityModifier = getAbilityModifier(playerStats.abilities[SKILL_ABILITIES[skill]]);
    const proficiency = playerStats.proficientSkills.includes(skill) ? playerStats.proficiencyBonus : 0;
    const modifier = abilityModifier + proficiency;
    const total = roll + modifier;

    return {
      roll,
      modifier,
      total,
      dc: safeDc,
      success: total >= safeDc,
      critical: roll === 20 ? 'success' : roll === 1 ? 'failure' : null,
    };
  },

  resetGame: (): void => set({
    activeDialogueNodeId: null,
    playerStats: INITIAL_PLAYER_STATS,
    factionReputation: {},
  }),
}));
