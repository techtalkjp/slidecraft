import { defineHook, runHook } from 'cc-hooks-ts'
import { execSync } from 'node:child_process'
import { match, P } from 'ts-pattern'

// cc-hooks-ts の型定義に MultiEdit がないため、string リテラルで対応
const EDIT_TOOLS = P.union(
  'Write' as const,
  'Edit' as const,
  'MultiEdit' as string,
)

const formatOnEditHook = defineHook({
  trigger: {
    PostToolUse: true,
  },
  run: (context) =>
    match(context.input)
      .with(
        {
          tool_name: EDIT_TOOLS,
          tool_input: { file_path: P.string.endsWith('.ts') },
        },
        {
          tool_name: EDIT_TOOLS,
          tool_input: { file_path: P.string.endsWith('.tsx') },
        },
        {
          tool_name: EDIT_TOOLS,
          tool_input: { file_path: P.string.endsWith('.js') },
        },
        {
          tool_name: EDIT_TOOLS,
          tool_input: { file_path: P.string.endsWith('.jsx') },
        },
        {
          tool_name: EDIT_TOOLS,
          tool_input: { file_path: P.string.endsWith('.json') },
        },
        {
          tool_name: EDIT_TOOLS,
          tool_input: { file_path: P.string.endsWith('.md') },
        },
        {
          tool_name: EDIT_TOOLS,
          tool_input: { file_path: P.string.endsWith('.css') },
        },
        ({ tool_input }) => {
          try {
            execSync(`pnpm exec prettier --write "${tool_input.file_path}"`, {
              stdio: 'inherit',
            })
          } catch {
            // prettier failed, but don't block the workflow
          }
          return context.success()
        },
      )
      .otherwise(() => context.success()),
})

await runHook(formatOnEditHook)
