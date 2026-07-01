import type { Skill } from '../store/gameStore';

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId?: string;
  check?: {
    skill: Skill;
    dc: number;
    successNodeId: string;
    failureNodeId: string;
    successReputation: number;
    failureReputation: number;
  };
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  choices: DialogueChoice[];
}

export const LEFT_EYE_ORACLE_START = 'left-eye-oracle-greeting';
export const LEFT_EYE_FACTION = 'cult-of-the-left-eye';

export const leftEyeOracleDialogue: Record<string, DialogueNode> = {
  'left-eye-oracle-greeting': {
    id: 'left-eye-oracle-greeting',
    speaker: 'The Left Eye Nerve Oracle',
    text: 'A damp iris swivels toward you. “HALT. State your business, preferred pronouns, and whether you have recently been a right eye in disguise.”',
    choices: [
      {
        id: 'honest-answer',
        text: '“Just exploring. Very impressive optic nerve, by the way.”',
        nextNodeId: 'left-eye-oracle-polite',
      },
      {
        id: 'persuade-oracle',
        text: '[Persuasion DC 11] “The left eye is unquestionably the more mysterious and employable eye.”',
        check: {
          skill: 'persuasion', dc: 11,
          successNodeId: 'left-eye-oracle-success', failureNodeId: 'left-eye-oracle-failure',
          successReputation: 10, failureReputation: -5,
        },
      },
    ],
  },
  'left-eye-oracle-polite': {
    id: 'left-eye-oracle-polite',
    speaker: 'The Left Eye Nerve Oracle',
    text: 'The iris blushes, which is medically alarming. “Flattery logged. Please refrain from licking any load-bearing neurons.”',
    choices: [{ id: 'leave-politely', text: 'Promise nothing, but leave politely.' }],
  },
  'left-eye-oracle-success': {
    id: 'left-eye-oracle-success',
    speaker: 'The Left Eye Nerve Oracle',
    text: '“At last! Someone with binocular prejudice of the correct variety.” The nerve hums approvingly. The Cult of the Left Eye will hear of this.',
    choices: [{ id: 'accept-favour', text: 'Accept this deeply specific honour.' }],
  },
  'left-eye-oracle-failure': {
    id: 'left-eye-oracle-failure',
    speaker: 'The Left Eye Nerve Oracle',
    text: 'The iris narrows. “That sounded rehearsed. Worse: it sounded symmetrical.” Somewhere nearby, a tiny ceremonial gong marks your disgrace.',
    choices: [{ id: 'retreat-in-shame', text: 'Back away without making eye contact.' }],
  },
};
