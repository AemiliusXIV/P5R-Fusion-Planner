// The 10 Caroline & Justine (Strength Confidant) fusion requests.
// Each rank requires bringing a specific persona that has learned a specific skill.
// Skills may be learned naturally, inherited via fusion, or obtained via skill card.

export interface StrengthRequest {
  rank: number;
  persona: string;
  skill: string;
}

export const strengthRequests: StrengthRequest[] = [
  { rank: 1,  persona: 'Jack Frost',       skill: 'Mabufu'      },
  { rank: 2,  persona: 'Ame-no-Uzume',     skill: 'Frei'        },
  { rank: 3,  persona: 'Flauros',          skill: 'Tarukaja'    },
  { rank: 4,  persona: 'Phoenix',          skill: 'Counter'     },
  { rank: 5,  persona: 'Setanta',          skill: 'Rakukaja'    },
  { rank: 6,  persona: 'Neko Shogun',      skill: 'Dekaja'      },
  { rank: 7,  persona: 'Lachesis',         skill: 'Tetraja'     },
  { rank: 8,  persona: 'Hecatoncheires',   skill: 'Masukunda'   },
  { rank: 9,  persona: 'Bugs',             skill: 'Samarecarm'  },
  { rank: 10, persona: 'Seth',             skill: 'High Counter'},
];
