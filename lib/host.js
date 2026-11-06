import {
  buildSideChatPrompt,
  buildSideChatSystemPrompt,
  formatTranscript,
  isSideChatId,
  normalizeEndPayload,
  normalizeOpenPayload,
} from './pure.js'

const DEFAULT_SETTINGS = {
  providerName: 'spawn',
  maxTranscriptChars: 40000,
  maxSelectionChars: 20000,
  maxQuestionChars: 4000,
  readOnlyTools: ['read', 'glob', 'grep', 'read_image'],
  systemPromptOrder: 900,
  maxLabelChars: 80,
}

function positiveInteger(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback
}

function normalizeSettings(config = {}) {
  const tools = Array.isArray(config.readOnlyTools)
    ? config.readOnlyTools.filter(name => typeof name === 'string' && name.trim() !== '')
    : []
  return {
    providerName: typeof config.providerName === 'string' && config.providerName.trim() !== ''
      ? config.providerName.trim()
      : DEFAULT_SETTINGS.providerName,
    maxTranscriptChars: positiveInteger(config.maxTranscriptChars, DEFAULT_SETTINGS.maxTranscriptChars),
    maxSelectionChars: positiveInteger(config.maxSelectionChars, DEFAULT_SETTINGS.maxSelectionChars),
    maxQuestionChars: positiveInteger(config.maxQuestionChars, DEFAULT_SETTINGS.maxQuestionChars),
    readOnlyTools: tools.length > 0 ? [...new Set(tools)] : [...DEFAULT_SETTINGS.readOnlyTools],
    systemPromptOrder: Number.isFinite(config.systemPromptOrder)
      ? Number(config.systemPromptOrder)
      : DEFAULT_SETTINGS.systemPromptOrder,
    maxLabelChars: positiveInteger(config.maxLabelChars, DEFAULT_SETTINGS.maxLabelChars),
  }
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Own the side-chat command, temporary child sessions, and their cleanup.
 * @param {object} ctx - Host context carrying commands/subagents/tools/systemPrompt.
 * @param {object} [config] - plugin configuration from cordis.patch.yml.
 * @returns {{command: Function, onAgentCreated: Function, disposeAll: Function, settings: object}} host.
 */
export function createSideChatHost(ctx, config = {}) {
  const settings = normalizeSettings(config)
  const records = new Map()

  const warn = (message) => {
    try {
      ctx.logger?.warn?.(message)
    } catch {
      // Logging must never break the side-chat lifecycle.
    }
  }

  const command = async (invocation) => {
    const rawInput = String(invocation?.rawInput ?? '').trim()
    let payload
    try {
      payload = JSON.parse(rawInput)
    } catch {
      return { kind: 'error', text: 'Invalid side-chat payload.' }
    }
    if (payload?.action === 'open') return open(invocation.agent, payload)
    if (payload?.action === 'end') return end(invocation.agent, payload)
    return { kind: 'error', text: 'Invalid side-chat action.' }
  }

  const open = async (agent, payload) => {
    const normalized = normalizeOpenPayload(payload, {
      maxSelectionChars: settings.maxSelectionChars,
      maxQuestionChars: settings.maxQuestionChars,
      maxLabelChars: settings.maxLabelChars,
    })
    if (!normalized.ok) return { kind: 'error', text: normalized.error }
    const value = normalized.value

    if (agent?.session?.header?.origin === 'subagent') {
      return { kind: 'error', text: 'A side chat cannot start from another subagent.' }
    }
    if (records.has(value.childSessionId)) {
      return { kind: 'error', text: 'This side-chat session is already open.' }
    }

    let systemText
    let promptText
    try {
      const transcript = formatTranscript(agent.session.deriveMessages(), settings.maxTranscriptChars)
      systemText = buildSideChatSystemPrompt({
        parentSessionId: agent.id,
        createdAt: Date.now(),
        transcript,
      })
      promptText = buildSideChatPrompt({ selection: value.selection, question: value.question })
    } catch (error) {
      return { kind: 'error', text: `Could not read the parent conversation: ${messageOf(error)}` }
    }

    const agentOptions = value.provider !== undefined && value.model !== undefined
      ? {
          provider: value.provider,
          model: value.model,
          ...(value.reasoningEffort === undefined ? {} : { reasoningEffort: value.reasoningEffort }),
        }
      : undefined

    const controller = new AbortController()
    const record = {
      parentSessionId: agent.id,
      childSessionId: value.childSessionId,
      label: value.label || 'Side chat',
      systemText,
      controller,
      activation: undefined,
    }
    records.set(value.childSessionId, record)

    try {
      const activation = await ctx.subagents.startActivation({
        provider: settings.providerName,
        label: record.label,
        childId: value.childSessionId,
        request: {
          parent: agent,
          prompt: [{ type: 'text', text: promptText }],
          ...(agentOptions === undefined ? {} : { agentOptions }),
        },
        signal: controller.signal,
        delivery: 'caller',
      })
      record.activation = activation
      void activation.result.catch((error) => {
        warn(`side-chat child ${value.childSessionId} failed: ${messageOf(error)}`)
      })
      return { kind: 'success' }
    } catch (error) {
      records.delete(value.childSessionId)
      try {
        controller.abort()
      } catch {
        // The controller is only used to cancel creation.
      }
      return { kind: 'error', text: `Could not open the side chat: ${messageOf(error)}` }
    }
  }

  const onAgentCreated = (agent) => {
    const record = records.get(agent.id)
    if (record === undefined) return

    const allow = settings.readOnlyTools.filter(name => ctx.tools.get(name) !== undefined)
    if (allow.length === 0) {
      throw new Error('Side chat requires at least one read-only tool, but none are registered.')
    }

    agent.ctx.tools.restrict({ allow })
    agent.ctx.tools.guard(exec => (
      allow.includes(exec.name) ? undefined : 'Side chat is read-only; that tool is unavailable.'
    ))
    agent.ctx.systemPrompt.section({
      name: 'side-chat:context',
      order: settings.systemPromptOrder,
      text: record.systemText,
      interpolate: false,
    })
  }

  const end = async (agent, payload) => {
    const normalized = normalizeEndPayload(payload)
    if (!normalized.ok) return { kind: 'error', text: normalized.error }
    const childId = normalized.value.childSessionId
    const record = records.get(childId)

    if (record !== undefined) {
      if (record.parentSessionId !== agent.id) {
        return { kind: 'error', text: 'This side chat belongs to another session.' }
      }
      records.delete(childId)
      try {
        await record.activation?.dispose?.()
      } catch (error) {
        warn(`side-chat dispose failed for ${childId}: ${messageOf(error)}`)
      }
      try {
        record.controller.abort()
      } catch {
        // Already aborted or settled.
      }
      await interrupt(agent, childId)
      await archive(childId)
      return { kind: 'success' }
    }

    if (!(await canCleanupOrphan(agent, childId))) {
      return { kind: 'error', text: 'Unknown side-chat session.' }
    }
    await interrupt(agent, childId)
    await archive(childId)
    return { kind: 'success' }
  }

  const canCleanupOrphan = async (agent, childId) => {
    if (!isSideChatId(childId)) return false
    const sessions = ctx.get?.('sessions')
    const live = sessions?.get?.(childId)
    const header = live?.header ?? (await readHeader(childId))
    return header !== undefined
      && header.origin === 'subagent'
      && header.parentSession === agent.id
  }

  const readHeader = async (childId) => {
    const persistence = ctx.get?.('sessionPersistence')
    if (persistence === undefined) return undefined
    try {
      const snapshot = await persistence.stat(childId)
      return snapshot?.header
    } catch {
      return undefined
    }
  }

  const interrupt = async (agent, childId) => {
    try {
      ctx.subagents.interrupt(childId, { kind: 'user', parentSessionId: agent.id })
    } catch (error) {
      warn(`side-chat interrupt failed for ${childId}: ${messageOf(error)}`)
    }
  }

  const archive = async (childId) => {
    const registry = ctx.get?.('workspaceRegistry')
    if (registry === undefined) return
    try {
      await registry.archiveSession(childId, { stopActivity: true })
    } catch (error) {
      warn(`side-chat archive failed for ${childId}: ${messageOf(error)}`)
    }
  }

  const disposeAll = () => {
    for (const record of records.values()) {
      try {
        record.controller.abort()
      } catch {
        // Already aborted.
      }
      try {
        void record.activation?.dispose?.()
      } catch {
        // Disposal is best effort during plugin unload.
      }
    }
    records.clear()
  }

  return { command, onAgentCreated, disposeAll, settings }
}
