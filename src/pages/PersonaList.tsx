import { useMemo, useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { PersonaCard } from '../components/PersonaCard';

const ALL_ARCANA = [
  'Fool','Magician','Priestess','Empress','Emperor','Hierophant','Lovers','Chariot',
  'Justice','Hermit','Fortune','Strength','Hanged','Death','Temperance','Devil',
  'Tower','Star','Moon','Sun','Judgement','Faith','Councillor','World',
];

export function PersonaList() {
  const {
    personaList, calculator,
    nameFilter, setNameFilter,
    ingredientFilter, setIngredientFilter,
    arcanaFilter, setArcanaFilter,
    showOwnedOnly, setShowOwnedOnly,
    showWishlistOnly, setShowWishlistOnly,
    ownedMap, displaySize,
  } = useStore();

  const [sortBy, setSortBy] = useState<'level' | 'name' | 'arcana'>('level');
  const [visibleCount, setVisibleCount] = useState(60);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Returns null when no filter is active, or { matched, results } when active.
  // matched is the persona name found; null when no persona matches the query.
  const ingredientData = useMemo<{ matched: string | null; results: Set<string> } | null>(() => {
    const q = ingredientFilter.trim().toLowerCase();
    if (!q) return null;
    const p = personaList.find(x => x.name.toLowerCase().includes(q));
    if (!p) return { matched: null, results: new Set() };
    const recipes = calculator.getAllResultingRecipesFrom(p);
    return { matched: p.name, results: new Set(recipes.map(r => r.result.name)) };
  }, [ingredientFilter, personaList, calculator]);

  const filtered = useMemo(() => {
    let list = [...personaList];

    if (nameFilter.trim()) {
      const q = nameFilter.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }

    if (ingredientData !== null) {
      list = list.filter(p => ingredientData.results.has(p.name));
    }

    if (arcanaFilter) {
      list = list.filter(p => p.arcana === arcanaFilter);
    }

    if (showOwnedOnly) {
      list = list.filter(p => ownedMap[p.name]?.owned);
    }

    if (showWishlistOnly) {
      list = list.filter(p => ownedMap[p.name]?.wishlist);
    }

    list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'arcana') return a.arcana.localeCompare(b.arcana) || a.level - b.level;
      return a.level - b.level;
    });

    return list;
  }, [personaList, nameFilter, ingredientData, arcanaFilter, showOwnedOnly, showWishlistOnly, sortBy, ownedMap]);

  // Reset to first page whenever the filtered set changes
  useEffect(() => { setVisibleCount(60); }, [filtered]);

  // Load more when the sentinel scrolls into view
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setVisibleCount(n => n + 40); },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const hasFilters = !!(nameFilter.trim() || ingredientFilter.trim() || arcanaFilter || showOwnedOnly || showWishlistOnly);

  return (
    <div className="flex flex-col gap-4 p-4 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-p5border pb-4">
        <div className="w-1 h-8 bg-p5red" />
        <h1 className="font-display font-bold text-2xl text-p5white tracking-widest uppercase">Personas</h1>
        <span className="text-gray-500 text-sm font-display ml-auto">{filtered.length} shown</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search by name..."
            value={nameFilter}
            onChange={e => setNameFilter(e.target.value)}
            className="input-p5 max-w-xs"
          />
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <input
              type="text"
              placeholder="Fusion ingredient (e.g. Jack Frost)..."
              value={ingredientFilter}
              onChange={e => setIngredientFilter(e.target.value)}
              className="input-p5 w-full"
            />
            {ingredientData !== null && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-display">
                {ingredientData.results.size} results
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <select
            value={arcanaFilter}
            onChange={e => setArcanaFilter(e.target.value)}
            className="input-p5 w-auto"
          >
            <option value="">All Arcana</option>
            {ALL_ARCANA.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="input-p5 w-auto"
          >
            <option value="level">Sort: Level</option>
            <option value="name">Sort: Name</option>
            <option value="arcana">Sort: Arcana</option>
          </select>

          <button
            onClick={() => setShowOwnedOnly(!showOwnedOnly)}
            className={`px-3 py-2 text-xs font-display font-bold tracking-wider uppercase border transition-colors ${showOwnedOnly ? 'border-green-500 text-green-400 bg-green-950' : 'border-p5border text-gray-500 hover:border-green-500'}`}
          >
            Owned only
          </button>

          <button
            onClick={() => setShowWishlistOnly(!showWishlistOnly)}
            className={`px-3 py-2 text-xs font-display font-bold tracking-wider uppercase border transition-colors ${showWishlistOnly ? 'border-p5gold text-p5gold bg-yellow-950' : 'border-p5border text-gray-500 hover:border-p5gold'}`}
          >
            Wishlist only
          </button>
          {hasFilters && (
            <button
              onClick={() => {
                setNameFilter('');
                setIngredientFilter('');
                setArcanaFilter('');
                setShowOwnedOnly(false);
                setShowWishlistOnly(false);
              }}
              className="px-3 py-2 text-xs font-display font-bold tracking-wider uppercase border border-p5border text-gray-600 hover:border-p5red hover:text-p5red transition-colors ml-auto"
            >
              Clear filters
            </button>
          )}
        </div>

        {ingredientData !== null && (
          <div className="flex items-center gap-2">
            {ingredientData.matched ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 border border-p5border text-xs font-display text-gray-400 bg-p5gray/20">
                Fusions using:
                <span className="text-p5white font-bold">{ingredientData.matched}</span>
                <button
                  onClick={() => setIngredientFilter('')}
                  className="text-gray-600 hover:text-p5red transition-colors ml-0.5"
                  aria-label="Clear ingredient filter"
                >
                  ×
                </button>
              </span>
            ) : (
              <span className="text-xs text-gray-600 font-display">
                No persona matching &ldquo;{ingredientFilter.trim()}&rdquo;
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-16 font-display text-lg">No personas found.</div>
      ) : (
        <>
          <div className={`grid gap-3 ${
            displaySize === 'compact'     ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' :
            displaySize === 'comfortable' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' :
                                            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {visible.map(p => (
              <PersonaCard key={p.name} persona={p} />
            ))}
          </div>
          <div ref={sentinelRef} className="h-1" />
          {hasMore && (
            <div className="text-center text-gray-600 text-xs font-display py-2 tracking-wider">
              {visible.length} / {filtered.length}
            </div>
          )}
        </>
      )}
    </div>
  );
}
