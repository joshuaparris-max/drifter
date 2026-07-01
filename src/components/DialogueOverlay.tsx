import { useEffect, useState } from 'react';
import { LEFT_EYE_FACTION, leftEyeOracleDialogue, type DialogueChoice } from '../narrative/leftEyeOracleDialogue';
import { type SkillCheckResult, useGameStore } from '../store/gameStore';

const formatModifier = (modifier: number): string => (modifier >= 0 ? `+${modifier}` : `${modifier}`);

export const DialogueOverlay = (): JSX.Element | null => {
  const activeNodeId = useGameStore((state) => state.activeDialogueNodeId);
  const setActiveDialogueNode = useGameStore((state) => state.setActiveDialogueNode);
  const rollSkillCheck = useGameStore((state) => state.rollSkillCheck);
  const adjustFactionReputation = useGameStore((state) => state.adjustFactionReputation);
  const reputation = useGameStore((state) => state.factionReputation[LEFT_EYE_FACTION] ?? 0);
  const [checkResult, setCheckResult] = useState<SkillCheckResult | null>(null);

  const closeDialogue = (): void => {
    setCheckResult(null);
    setActiveDialogueNode(null);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.code === 'Escape') closeDialogue();
    };
    window.addEventListener('keydown', handleKeyDown);
    return (): void => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!activeNodeId) return null;
  const node = leftEyeOracleDialogue[activeNodeId];
  if (!node) return null;

  const chooseResponse = (choice: DialogueChoice): void => {
    if (choice.check) {
      const forcedRoll = new URLSearchParams(window.location.search).get('testRoll');
      const testRandom = forcedRoll === '20' ? (): number => 0.999
        : forcedRoll === '1' ? (): number => 0 : undefined;
      const result = rollSkillCheck(choice.check.skill, choice.check.dc, testRandom);
      setCheckResult(result);
      adjustFactionReputation(LEFT_EYE_FACTION, result.success
        ? choice.check.successReputation : choice.check.failureReputation);
      setActiveDialogueNode(result.success ? choice.check.successNodeId : choice.check.failureNodeId);
      return;
    }
    setCheckResult(null);
    if (choice.nextNodeId) setActiveDialogueNode(choice.nextNodeId);
    else closeDialogue();
  };

  return (
    <div className="dialogue-backdrop" role="presentation" data-testid="dialogue-overlay">
      <section className="dialogue-panel" role="dialog" aria-modal="true" aria-labelledby="dialogue-speaker">
        <button className="dialogue-close" data-testid="dialogue-close" type="button" onClick={closeDialogue} aria-label="Close dialogue">×</button>
        <p className="dialogue-kicker">Communion established</p>
        <h1 id="dialogue-speaker">{node.speaker}</h1>
        <p className="dialogue-text">{node.text}</p>
        {checkResult && (
          <div className={`check-result ${checkResult.success ? 'success' : 'failure'}`} aria-live="polite" data-testid="skill-check-result">
            <strong>{checkResult.success ? 'Check succeeded' : 'Check failed'}</strong>
            <span>Natural {checkResult.roll} {formatModifier(checkResult.modifier)} = {checkResult.total} vs DC {checkResult.dc}</span>
          </div>
        )}
        <div className="dialogue-choices">
          {node.choices.map((choice) => (
            <button key={choice.id} data-testid={`dialogue-choice-${choice.id}`} type="button" onClick={(): void => chooseResponse(choice)}>{choice.text}</button>
          ))}
        </div>
        <p className="reputation-readout" data-testid="faction-reputation">Cult of the Left Eye reputation: {reputation}</p>
      </section>
    </div>
  );
};
