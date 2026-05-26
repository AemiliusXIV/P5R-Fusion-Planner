// Copyright (c) AemiliusXIV
// SPDX-License-Identifier: Apache-2.0
import { lazy } from 'react';
import { createHashRouter } from 'react-router-dom';
import { PersonaList } from './pages/PersonaList';
import { Layout } from './Layout';

// PersonaList is the landing page — load it eagerly so first paint has no extra
// round-trip. Everything else is lazy; Rolldown splits each into its own chunk.
const PersonaDetail     = lazy(() => import('./pages/PersonaDetail').then(m => ({ default: m.PersonaDetail })));
const SkillList         = lazy(() => import('./pages/SkillList').then(m => ({ default: m.SkillList })));
const FusionPlan        = lazy(() => import('./pages/FusionPlan').then(m => ({ default: m.FusionPlan })));
const Settings          = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Import            = lazy(() => import('./pages/Import').then(m => ({ default: m.Import })));
const StrengthConfidant = lazy(() => import('./pages/StrengthConfidant').then(m => ({ default: m.StrengthConfidant })));

export const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true,              element: <PersonaList />      },
      { path: 'list',             element: <PersonaList />      },
      { path: 'skills',           element: <SkillList />        },
      { path: 'persona/:name',    element: <PersonaDetail />    },
      { path: 'fusion-tree/:name',element: <FusionPlan />       },
      { path: 'strength',         element: <StrengthConfidant />},
      { path: 'settings',         element: <Settings />         },
      { path: 'import',           element: <Import />           },
    ],
  },
]);
