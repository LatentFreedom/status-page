import { defineConfig, globalIgnores } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    extends: [...nextCoreWebVitals],
    rules: {
      // eslint-plugin-react-hooks v7 (bundled by eslint-config-next 16) flags existing
      // mount-time setState effects; keep them visible without rewriting components in the upgrade.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
