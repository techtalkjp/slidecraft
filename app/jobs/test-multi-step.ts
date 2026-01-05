/**
 * テスト用マルチステップジョブ
 */
import { defineJob } from '@coji/durably'
import { z } from 'zod'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const testMultiStepJob = defineJob({
  name: 'test-multi-step',
  input: z.object({ count: z.number() }),
  output: z.object({
    steps: z.array(z.string()),
    total: z.number(),
  }),
  run: async (step, payload) => {
    const steps: string[] = []

    const initResult = await step.run('initialize', async () => {
      await sleep(1000)
      return `Initialized with count: ${payload.count}`
    })
    steps.push(initResult)

    for (let i = 1; i <= payload.count; i++) {
      const result = await step.run(`count-${i}`, async () => {
        await sleep(500)
        return `Step ${i} completed`
      })
      steps.push(result)
    }

    const finalResult = await step.run('finalize', async () => {
      await sleep(500)
      return `Finalized at ${new Date().toISOString()}`
    })
    steps.push(finalResult)

    return { steps, total: steps.length }
  },
})
