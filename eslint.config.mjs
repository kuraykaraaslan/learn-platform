import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  {
    ignores: ['content/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Not on in eslint-config-next, but this repo renders build-time markdown
    // output through dangerouslySetInnerHTML in six places and each one already
    // carried a disable comment explaining why it is safe — comments that were
    // doing nothing, because the rule they suppressed was never enabled. Turning
    // it on makes those six load-bearing and makes a seventh, unannotated use
    // fail the build. Straight to `error` rather than `warn`: the repo rule is
    // that a rule graduates once the codebase is clean of it, and it is.
    rules: {
      'react/no-danger': 'error',
    },
  },
  {
    // Vendored copies of kui-react v1.0.1 — see modules/shared/ui/kui/PROVENANCE.md,
    // which states the rule these overrides exist to keep: "Do not patch copied files
    // with unrelated local changes." An upstream fix is pulled in by re-copying the
    // file, so a local lint fix here would be silently reverted by the next re-copy
    // and would make the diff against upstream unreadable in the meantime.
    //
    // Only the rules these files actually trip are relaxed, not the whole config —
    // a genuine bug introduced by an adaptation still gets caught. Drop an entry here
    // once upstream kui-react fixes it; drop the block entirely if kui-react ever
    // becomes an installed dependency instead of a copy.
    files: [
      'modules/shared/ui/kui/**',
      // PROVENANCE.md: these three are copied to the same relative path as upstream.
      'libs/utils/cn.ts',
      'libs/utils/isBrowser.ts',
      'libs/utils/polymorphic.ts',
    ],
    rules: {
      // usePortal.ts, usePresence.ts — mount/animation effects written before
      // eslint-plugin-react-hooks v6 shipped this rule.
      'react-hooks/set-state-in-effect': 'off',
      // polymorphic.ts — `OwnProps = {}` as a default type parameter.
      '@typescript-eslint/no-empty-object-type': 'off',
      // Drawer/index.tsx — an intentionally underscore-prefixed unused binding.
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];

export default eslintConfig;
