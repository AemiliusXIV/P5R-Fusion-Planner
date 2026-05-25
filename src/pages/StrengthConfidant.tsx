import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { skillMapRoyal } from '../engine/initData';
import { strengthRequests } from '../data/strengthRequests';
import { elemColor, getSkillCost } from '../utils/skillUtils';

// How many skill-source personas to show per request before collapsing.
const MAX_SOURCES = 6;

// Parse the raw card string into a human-readable label.
// "CJ BBB" -> "CJ Outing: BBB", "Jazz 8/28 CJ Aquarium" -> "Jazz Club: 8/28 CJ Outing: Aquarium"
function formatCardSource(card: string): string {
  return card
    .replace(/CJ\s+/g, 'CJ Outing: ')
    .replace(/Jazz\s+/g, 'Jazz Club: ');
}

export function StrengthConfidant() {
  const { personaMap, ownedMap, completedStrengthRequests, setStrengthComplete } = useStore();

  const completedCount = Object.values(completedStrengthRequests).filter(Boolean).length;

  // Pre-enrich all requests once rather than re-computing per render.
  const enriched = useMemo(() => {
    return strengthRequests.map(req => {
      const personaData = personaMap[req.persona];
      const skillData = skillMapRoyal[req.skill];

      // Check if the target persona naturally learns the required skill.
      const naturalLevel = personaData?.skills?.[req.skill] ?? null;

      // All personas that naturally learn the skill, sorted by level.
      const sources = skillData?.personas
        ? Object.entries(skillData.personas)
            .map(([pName, lv]) => ({ name: pName, level: lv as number }))
            .sort((a, b) => a.level - b.level)
        : [];

      const cardInfo = skillData?.card ? formatCardSource(skillData.card as string) : null;
      const skillElement = skillData?.element ?? 'passive';
      const skillCost = getSkillCost(skillElement, skillData?.cost);

      return { ...req, personaData, skillData, naturalLevel, sources, cardInfo, skillElement, skillCost };
    });
  }, [personaMap]);

  return (
    <div className="flex flex-col gap-4 p-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-p5border pb-4">
        <div className="w-1 h-8 bg-p5red" />
        <div>
          <h1 className="font-display font-bold text-2xl text-p5white tracking-widest uppercase">
            Strength Confidant
          </h1>
          <p className="text-xs text-gray-500 font-display mt-0.5">Caroline &amp; Justine: 10 fusion requests</p>
        </div>
        <div className="ml-auto text-right">
          <div className="font-display font-bold text-p5white text-lg">{completedCount}/10</div>
          <div className="text-xs text-gray-500 font-display">complete</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-p5border">
        <div
          className="h-1 bg-p5red transition-all duration-300"
          style={{ width: `${(completedCount / 10) * 100}%` }}
        />
      </div>

      {/* Request cards */}
      <div className="flex flex-col gap-3">
        {enriched.map(req => {
          const isComplete = !!completedStrengthRequests[req.rank];
          const skillColor = elemColor[req.skillElement] ?? 'text-gray-400';

          // Check if user owns any persona that naturally has the skill.
          const ownedSource = req.sources.find(s => ownedMap[s.name]?.owned);

          return (
            <div
              key={req.rank}
              className={`card-p5 p-4 flex flex-col gap-3 transition-colors ${
                isComplete ? '!border-green-500 opacity-60' : ''
              }`}
            >
              {/* Top row: rank + persona + skill + complete button */}
              <div className="flex items-start gap-3 flex-wrap">
                {/* Rank badge */}
                <div className="shrink-0 w-10 h-10 border border-p5border flex items-center justify-center">
                  <span className="font-display font-bold text-p5red text-sm">{req.rank}</span>
                </div>

                {/* Persona + skill */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/persona/${encodeURIComponent(req.persona)}`}
                      className="font-display font-bold text-p5white hover:text-p5red transition-colors text-base"
                    >
                      {req.persona}
                    </Link>
                    {req.persona && (
                      <span className="text-xs text-gray-500 font-display">
                        Lv {req.persona ? personaMap[req.persona]?.level ?? '?' : '?'} · {personaMap[req.persona]?.arcana ?? ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500 font-display">with skill:</span>
                    <span className={`font-display font-bold text-sm ${skillColor}`}>{req.skill}</span>
                    <span className="text-xs text-gray-400 font-display tabular-nums">{req.skillCost}</span>
                  </div>
                  {req.skill && skillMapRoyal[req.skill]?.effect && (
                    <p className="text-[11px] text-gray-400 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{skillMapRoyal[req.skill].effect}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <button
                    onClick={() => setStrengthComplete(req.rank, !isComplete)}
                    aria-pressed={isComplete}
                    className={`px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider border transition-colors ${
                      isComplete
                        ? 'border-green-500 text-green-400 bg-green-950/30 hover:border-p5red hover:text-p5red hover:bg-transparent'
                        : 'border-p5border text-gray-500 hover:border-green-500 hover:text-green-400'
                    }`}
                  >
                    {isComplete ? '✓ Done' : 'Mark done'}
                  </button>
                  <Link
                    to={`/fusion-tree/${encodeURIComponent(req.persona)}?skill=${encodeURIComponent(req.skill)}`}
                    className="px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider border border-p5border text-gray-500 hover:border-p5red hover:text-p5red transition-colors text-center"
                  >
                    Fusion chain →
                  </Link>
                </div>
              </div>

              {/* Skill acquisition info */}
              <div className="flex flex-col gap-1.5 text-xs font-display">
                {req.naturalLevel !== null ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">✓ Naturally learned</span>
                    <span className="text-gray-400">
                      {req.naturalLevel === 0
                        ? 'at base level; no inheritance needed'
                        : `at Lv ${req.naturalLevel}; level up before presenting`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-yellow-400 font-bold">Needs inheritance</span>
                    <span className="text-gray-400">
                      {req.persona
                        ? `${req.persona} inherits ${personaMap[req.persona]?.inherits ?? 'Unknown'} skills`
                        : ''}
                    </span>
                  </div>
                )}

                {req.cardInfo && (
                  <div className="flex items-center gap-2">
                    <span className="text-p5gold font-bold">♦ Skill card:</span>
                    <span className="text-gray-400">{req.cardInfo}</span>
                  </div>
                )}

                {!req.cardInfo && req.naturalLevel === null && (
                  <div className="text-gray-500">No skill card available for {req.skill}.</div>
                )}
              </div>

              {/* Skill sources */}
              {req.naturalLevel === null && req.sources.length > 0 && (
                <div className="border-t border-p5border pt-3">
                  <div className="text-[10px] text-gray-500 font-display uppercase tracking-wider mb-2">
                    Personas that naturally learn {req.skill}
                    {ownedSource && (
                      <span className="text-green-400 ml-2 normal-case tracking-normal">
                        (you own {ownedSource.name})
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {req.sources.slice(0, MAX_SOURCES).map(s => {
                      const isOwned = !!ownedMap[s.name]?.owned;
                      return (
                        <Link
                          key={s.name}
                          to={`/persona/${encodeURIComponent(s.name)}`}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[11px] font-display transition-colors hover:border-p5red ${
                            isOwned
                              ? 'border-green-600 text-green-400 bg-green-950/20'
                              : 'border-p5border text-gray-400'
                          }`}
                        >
                          {isOwned && <span>✓</span>}
                          {s.name}
                          {s.level > 0 && (
                            <span className="text-gray-500 text-[10px] tabular-nums">Lv {s.level}</span>
                          )}
                        </Link>
                      );
                    })}
                    {req.sources.length > MAX_SOURCES && (
                      <span className="text-[11px] text-gray-500 font-display self-center">
                        +{req.sources.length - MAX_SOURCES} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
