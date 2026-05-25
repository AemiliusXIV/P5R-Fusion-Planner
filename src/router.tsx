import { createHashRouter } from 'react-router-dom';
import { PersonaList } from './pages/PersonaList';
import { PersonaDetail } from './pages/PersonaDetail';
import { SkillList } from './pages/SkillList';
import { FusionPlan } from './pages/FusionPlan';
import { Settings } from './pages/Settings';
import { Import } from './pages/Import';
import { StrengthConfidant } from './pages/StrengthConfidant';
import { Layout } from './Layout';

export const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <PersonaList /> },
      { path: 'list', element: <PersonaList /> },
      { path: 'skills', element: <SkillList /> },
      { path: 'persona/:name', element: <PersonaDetail /> },
      { path: 'fusion-tree/:name', element: <FusionPlan /> },
      { path: 'strength', element: <StrengthConfidant /> },
      { path: 'settings', element: <Settings /> },
      { path: 'import', element: <Import /> },
    ],
  },
]);
