import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { skillMapRoyal } from '../engine/initData';
import { getSkillCost, elemColor } from '../utils/skillUtils';

const ALL_ELEMENTS = ['phys','gun','fire','ice','elec','wind','psy','nuke','bless','curse','almighty','ailment','support','passive','healing','trait'];

export function SkillList() {
  const [nameFilter, setNameFilter] = useState('');
  const [elemFilter, setElemFilter] = useState('');

  const skills = useMemo(() => {
    return Object.entries(skillMapRoyal).map(([name, s]) => ({
      name,
      effect: s.effect,
      element: s.element,
      cost: s.cost,
      personas: s.personas,
      unique: s.unique,
      costDisplay: getSkillCost(s.element, s.cost),
    }));
  }, []);

  const filtered = useMemo(() => {
    return skills.filter(s => {
      if (nameFilter && !s.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      if (elemFilter && s.element !== elemFilter) return false;
      return true;
    });
  }, [skills, nameFilter, elemFilter]);

  return (
    <div className="flex flex-col gap-4 p-4 pb-20 md:pb-4">
      <div className="flex items-center gap-3 border-b border-p5border pb-4">
        <div className="w-1 h-8 bg-p5red" />
        <h1 className="font-display font-bold text-2xl text-p5white tracking-widest uppercase">Skills</h1>
        <span className="text-gray-500 text-sm font-display ml-auto">{filtered.length} shown</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search skills..."
          value={nameFilter}
          onChange={e => setNameFilter(e.target.value)}
          className="input-p5 max-w-xs"
        />
        <select
          value={elemFilter}
          onChange={e => setElemFilter(e.target.value)}
          className="input-p5 w-auto"
        >
          <option value="">All Elements</option>
          {ALL_ELEMENTS.map(e => (
            <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-px">
        {filtered.map(skill => (
          <div key={skill.name} className="card-p5 flex items-start gap-3 px-3 py-2">
            <span className={`font-display text-[10px] uppercase w-14 shrink-0 pt-0.5 ${elemColor[skill.element] ?? 'text-gray-400'}`}>
              {skill.element}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-sm text-p5white">{skill.name}</div>
              {/* Effect: Inter for legibility; Rajdhani at this size is hard to parse */}
              <div className="text-[11px] text-gray-400 mt-0.5 truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                {skill.effect}
              </div>
              {skill.personas && Object.keys(skill.personas).length > 0 && (
                <div className="text-[10px] text-gray-500 mt-1 flex flex-wrap gap-1">
                  {Object.entries(skill.personas).slice(0, 5).map(([pName]) => (
                    <Link key={pName} to={`/persona/${encodeURIComponent(pName)}`} className="hover:text-p5red transition-colors">
                      {pName}
                    </Link>
                  ))}
                  {Object.keys(skill.personas).length > 5 && (
                    <span className="text-gray-500">+{Object.keys(skill.personas).length - 5} more</span>
                  )}
                </div>
              )}
            </div>
            <span className="text-[11px] text-gray-400 font-display shrink-0 tabular-nums pt-0.5">{skill.costDisplay}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
