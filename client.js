window.__ModuleLoader__.load({
  id: '@local/dsh-side-chat',
  factory(require) {
    const React = require('react')
    const ReactDOM = require('react-dom')
    const h = React.createElement

    const NS = 'sideChat'
    const COMMAND = 'sidechat'
    const STORAGE_KEY = 'dsh.side-chat.tabs.v1'
    const ADDRESS_PREFIX = 'dsh-resource://subagentchat/session/'
    const DRAFT_PREFIX = 'dsh-resource://sidechatdraft/'
    const START_GRACE_MS = 2000
    const OPEN_GRACE_MS = 2000
    const RECONCILE_DELAY_MS = 2500
    const MAX_SELECTION_CHARS = 20000
    const MODEL_SEPARATOR = '\u0000'

    const zh = {
      'action.groupAria': '选中文字操作',
      'action.quote': '添加到对话',
      'action.ask': '在侧边提问',
      'action.quoteAria': '把选中文字添加到当前对话',
      'action.askAria': '在侧边聊天中追问选中文字',
      'draft.tab': '侧边聊天',
      'draft.title': '在侧边聊天中提问',
      'draft.note': '只读侧边聊天。它会看到当前对话的快照，但不能修改文件。',
      'draft.placeholder': '关于这段文字，你想问什么？',
      'draft.submit': '提问',
      'draft.busy': '正在打开…',
      'draft.selectedCount': '已选 {count} 个文本片段',
      'draft.clearQuotes': '清除引用',
      'draft.summaryTitle': '已选文本片段',
      'draft.emptySelection': '请先选中一段文字。',
      'draft.openFailed': '无法打开侧边聊天。',
      'draft.expired': '这个草稿已失效',
      'draft.expiredNote': '请重新在对话中选中文字。',
      'draft.model': '模型',
      'draft.modelInherit': '跟随主会话',
      'draft.modelEmpty': '没有可用模型',
      'draft.effort': '推理等级',
      'draft.effortDefault': '默认',
      'draft.effortInherit': '跟随主会话',
      'draft.effortNone': '该模型没有可选的推理等级',
      'draft.effortUnavailable': '先选择模型',
      'draft.back': '返回',
      'error.tooLong': '选中文字过长。',
      'error.command': '侧边聊天命令执行失败。',
      'error.unavailable': '当前版本没有可用的侧边聊天。',
      'tab.label': '侧边聊天',
    }

    const en = {
      'action.groupAria': 'Selection actions',
      'action.quote': 'Add to chat',
      'action.ask': 'Ask in side chat',
      'action.quoteAria': 'Add the selected text to the conversation',
      'action.askAria': 'Ask about the selected text in a side chat',
      'draft.tab': 'Side chat',
      'draft.title': 'Ask in side chat',
      'draft.note': 'Read-only side chat. It sees a snapshot of this conversation and cannot change files.',
      'draft.placeholder': 'Ask about this excerpt…',
      'draft.submit': 'Ask',
      'draft.busy': 'Opening…',
      'draft.selectedCount': '{count} selected excerpt(s)',
      'draft.clearQuotes': 'Clear quotes',
      'draft.summaryTitle': 'Selected excerpts',
      'draft.emptySelection': 'Select some text first.',
      'draft.openFailed': 'Could not open the side chat.',
      'draft.expired': 'This draft expired',
      'draft.expiredNote': 'Select text in the conversation to start again.',
      'draft.model': 'Model',
      'draft.modelInherit': 'Follow main session',
      'draft.modelEmpty': 'No models available',
      'draft.effort': 'Reasoning effort',
      'draft.effortDefault': 'Default',
      'draft.effortInherit': 'Follow main session',
      'draft.effortNone': 'This model has no reasoning levels',
      'draft.effortUnavailable': 'Select a model first',
      'draft.back': 'Back',
      'error.tooLong': 'The selection is too long.',
      'error.command': 'The side-chat command failed.',
      'error.unavailable': 'Side chat is unavailable in this build.',
      'tab.label': 'Side chat',
    }

    const CSS = `
      .dsh-side-chat-selection {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
      .dsh-side-chat-actions {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 3px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 999px;
        background: var(--dsw-alias-bg-overlay);
        box-shadow: var(--dsw-elevation-panel, 0 4px 16px rgba(0, 0, 0, 0.14));
      }
      .dsh-side-chat-action {
        border: 0;
        border-radius: 999px;
        padding: 5px 10px;
        background: transparent;
        color: var(--dsw-alias-label-primary);
        font: inherit;
        font-size: 13px;
        line-height: 18px;
        white-space: nowrap;
        cursor: pointer;
      }
      .dsh-side-chat-action:focus-visible {
        outline: 2px solid var(--dsw-alias-brand-primary);
        outline-offset: 1px;
      }
      @media (hover: hover) {
        .dsh-side-chat-action:hover {
          background: var(--dsw-alias-bg-layer-2);
        }
      }
      .dsh-side-chat-action-error {
        max-width: 280px;
        padding: 4px 8px;
        border: 1px solid var(--dsw-alias-state-error-primary);
        border-radius: 6px;
        background: var(--dsw-alias-bg-overlay);
        color: var(--dsw-alias-state-error-primary);
        font-size: 12px;
        line-height: 16px;
      }
      .dsh-side-chat-draft {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        background: var(--dsw-alias-bg-base);
        color: var(--dsw-alias-label-primary);
      }
      .dsh-side-chat-draft-empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 0;
        padding: 24px;
        text-align: center;
      }
      .dsh-side-chat-draft-title {
        font-size: 15px;
        font-weight: 600;
        line-height: 20px;
      }
      .dsh-side-chat-draft-note {
        max-width: 320px;
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        line-height: 18px;
      }
      .dsh-side-chat-composer {
        flex: none;
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 0 12px 28px;
        padding: 10px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 12px;
        background: var(--dsw-alias-bg-layer-1);
        box-shadow: var(--dsw-elevation-panel, 0 4px 16px rgba(0, 0, 0, 0.14));
      }
      .dsh-side-chat-selection-summary {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        width: fit-content;
        max-width: 100%;
        padding: 3px 6px;
        border-radius: 6px;
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        line-height: 18px;
        cursor: default;
      }
      .dsh-side-chat-selection-summary-label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dsh-side-chat-selection-clear {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        width: 16px;
        height: 16px;
        padding: 0;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: var(--dsw-alias-label-secondary);
        opacity: 0;
        cursor: pointer;
      }
      .dsh-side-chat-selection-summary:hover .dsh-side-chat-selection-clear,
      .dsh-side-chat-selection-summary:focus-within .dsh-side-chat-selection-clear {
        opacity: 1;
      }
      .dsh-side-chat-selection-clear:hover {
        background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-primary);
      }
      .dsh-side-chat-selection-clear:focus-visible {
        outline: 2px solid var(--dsw-alias-brand-primary);
        outline-offset: 1px;
      }
      .dsh-side-chat-summary-popover {
        position: fixed;
        z-index: 1003;
        width: min(360px, calc(100vw - 24px));
        max-height: min(320px, 60vh);
        overflow: auto;
        padding: 10px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 10px;
        background: var(--dsw-alias-bg-overlay);
        color: var(--dsw-alias-label-primary);
        box-shadow: var(--dsw-elevation-prominent, 0 16px 48px rgba(0, 0, 0, 0.24));
      }
      .dsh-side-chat-summary-title {
        margin-bottom: 6px;
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        line-height: 18px;
      }
      .dsh-side-chat-summary-popover .dsh-side-chat-quote {
        margin-bottom: 6px;
      }
      .dsh-side-chat-summary-popover .dsh-side-chat-quote:last-child {
        margin-bottom: 0;
      }
      .dsh-side-chat-quote {
        margin: 0;
        max-height: 120px;
        overflow: auto;
        padding: 6px 8px;
        border-left: 2px solid var(--dsw-alias-border-l2);
        border-radius: 6px;
        background: var(--dsw-alias-bg-layer-2);
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        line-height: 18px;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .dsh-side-chat-composer-input {
        box-sizing: border-box;
        width: 100%;
        min-height: 60px;
        max-height: 200px;
        resize: none;
        padding: 2px;
        border: 0;
        outline: none;
        background: transparent;
        color: var(--dsw-alias-label-primary);
        font: inherit;
        font-size: 13px;
        line-height: 20px;
      }
      .dsh-side-chat-composer-input::placeholder {
        color: var(--dsw-alias-label-secondary);
      }
      .dsh-side-chat-composer-input:disabled {
        opacity: 0.6;
      }
      .dsh-side-chat-composer-toolbar {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
      }
      .dsh-side-chat-composer-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .dsh-side-chat-model-trigger {
        display: flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
        max-width: 360px;
        height: 28px;
        padding: 0 4px 0 8px;
        border: 0;
        border-radius: var(--dsw-radius-sm, 6px);
        background: transparent;
        color: var(--dsw-alias-label-secondary);
        font: inherit;
        font-size: 13px;
        line-height: 20px;
        font-weight: 400;
        cursor: pointer;
      }
      .dsh-side-chat-model-trigger:hover:not(:disabled) {
        background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));
      }
      .dsh-side-chat-model-trigger:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
      }
      .dsh-side-chat-model-trigger:disabled {
        color: var(--dsw-alias-label-dimmed, var(--dsw-alias-label-secondary));
        cursor: default;
      }
      .dsh-side-chat-model-icon,
      .dsh-side-chat-model-chevron {
        flex: none;
      }
      .dsh-side-chat-model-label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
        line-height: 20px;
      }
      .dsh-side-chat-model-chevron {
        color: var(--dsw-alias-label-caption, var(--dsw-alias-label-secondary));
        transition: transform 120ms ease;
      }
      .dsh-side-chat-model-trigger[aria-expanded="true"] .dsh-side-chat-model-chevron {
        transform: rotate(180deg);
      }
      .dsh-side-chat-model-effort {
        flex-shrink: 1000;
        min-width: 0;
        overflow: hidden;
        color: var(--dsw-alias-label-caption, var(--dsw-alias-label-secondary));
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dsh-side-chat-model-menu {
        box-sizing: border-box;
        position: fixed;
        z-index: 1100;
        display: flex;
        flex-direction: column;
        width: max-content;
        min-width: min(240px, calc(100vw - 32px));
        max-width: min(420px, calc(100vw - 32px));
        max-height: min(360px, calc(100vh - 96px));
        overflow: auto;
        padding: 4px;
        border: 0;
        border-radius: var(--dsw-radius-lg, 10px);
        background: var(--dsw-alias-bg-overlay);
        --dsw-elevation-stroke-color: var(--dsw-alias-border-l1);
        box-shadow: var(--dsw-elevation-prominent, 0 16px 48px rgba(0, 0, 0, 0.24));
        color: var(--dsw-alias-label-primary);
      }
      .dsh-side-chat-model-group {
        padding: 8px 8px 4px;
        color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));
        font-size: 12px;
        line-height: 18px;
      }
      .dsh-side-chat-model-option {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 6px;
        width: auto;
        min-width: 100%;
        min-height: 34px;
        padding: 5px 7px;
        border: 0;
        border-radius: var(--dsw-radius-md, 8px);
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: 13px;
        line-height: 18px;
        text-align: left;
        cursor: pointer;
      }
      .dsh-side-chat-model-option:hover:not(:disabled),
      .dsh-side-chat-model-option:focus-visible {
        background: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));
      }
      .dsh-side-chat-model-option:disabled {
        color: var(--dsw-alias-label-dimmed, var(--dsw-alias-label-secondary));
        cursor: default;
      }
      .dsh-side-chat-model-option:disabled:hover {
        background: transparent;
      }
      .dsh-side-chat-model-option-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
        line-height: 18px;
      }
      .dsh-side-chat-model-effort-section {
        position: sticky;
        top: 0;
        z-index: 1;
        margin: 0 -4px 4px;
        padding: 4px;
        border-bottom: 1px solid var(--dsw-alias-border-l1);
        background: var(--dsw-alias-bg-overlay);
      }
      .dsh-side-chat-model-check {
        display: grid;
        place-items: center;
        flex: 0 0 14px;
        color: var(--dsw-alias-label-primary);
      }
      .dsh-side-chat-model-check svg {
        width: 14px;
        height: 14px;
      }
      .dsh-side-chat-model-empty {
        padding: 8px;
        color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));
        font-size: 12px;
        line-height: 18px;
      }
      .dsh-side-chat-send {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        width: 30px;
        height: 30px;
        padding: 0;
        border: 0;
        border-radius: 50%;
        background: var(--dsw-alias-brand-primary);
        color: #fff;
        cursor: pointer;
      }
      .dsh-side-chat-send:disabled {
        opacity: 0.4;
        cursor: default;
      }
      .dsh-side-chat-send:focus-visible {
        outline: 2px solid var(--dsw-alias-brand-primary);
        outline-offset: 2px;
      }
      .dsh-side-chat-error {
        color: var(--dsw-alias-state-error-primary);
        font-size: 12px;
        line-height: 18px;
        overflow-wrap: anywhere;
      }
    `

    const dictionaries = {
      zh,
      en,
      ja: en,
      es: en,
      fr: en,
      de: en,
      ru: en,
      pt: en,
    }

    function messageOf(error) {
      return error instanceof Error ? error.message : String(error)
    }

    function sideChatId(value) {
      return typeof value === 'string'
        && value.startsWith('session-sidechat-')
        && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value.slice('session-sidechat-'.length))
    }

    function validRecord(value) {
      return value !== null
        && typeof value === 'object'
        && typeof value.address === 'string'
        && value.address.startsWith(ADDRESS_PREFIX)
        && sideChatId(value.childSessionId)
        && typeof value.parentSessionId === 'string'
        && value.parentSessionId.length > 0
        && typeof value.openedAt === 'number'
        && Number.isFinite(value.openedAt)
    }

    function excerptLabel(text, maxLength = 40) {
      const firstLine = String(text ?? '')
        .split(/\r?\n/u)
        .map(line => line.trim())
        .find(line => line.length > 0) ?? ''
      const collapsed = firstLine.replace(/\s+/gu, ' ').trim()
      if (collapsed.length <= maxLength) return collapsed
      return `${collapsed.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
    }

    function newChildSessionId() {
      const uuid = globalThis.crypto?.randomUUID?.()
      if (typeof uuid !== 'string') throw new Error('crypto.randomUUID is unavailable')
      return `session-sidechat-${uuid}`
    }

    function newDraftId() {
      const uuid = globalThis.crypto?.randomUUID?.()
      if (typeof uuid === 'string') return uuid
      return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    }

    function parseDraftAddress(address) {
      try {
        const url = new URL(address)
        if (url.protocol !== 'dsh-resource:' || url.hostname !== 'sidechatdraft') return undefined
        const parts = url.pathname.split('/').filter(Boolean)
        if (parts.length !== 1) return undefined
        return decodeURIComponent(parts[0])
      } catch {
        return undefined
      }
    }

    function buildAddress(childSessionId, parentSessionId) {
      const query = new URLSearchParams({ parent: parentSessionId, mode: 'continuable' })
      return `${ADDRESS_PREFIX}${encodeURIComponent(childSessionId)}?${query.toString()}`
    }

    function apply(ctx) {
      const t = ctx.locale.bind(NS)
      const records = new Map()
      const drafts = new Map()
      const draftListeners = new Set()
      const notifyDrafts = () => {
        for (const listener of [...draftListeners]) {
          try {
            listener()
          } catch {
            // A draft listener must not break selection handling.
          }
        }
      }
      const subscribeDrafts = (listener) => {
        draftListeners.add(listener)
        return () => { draftListeners.delete(listener) }
      }
      const startedAt = Date.now()
      let reconcileTimer

      ctx.effect(() => ctx.locale.register(NS, dictionaries), 'side-chat: dictionaries')

      ctx.effect(() => {
        const style = document.createElement('style')
        style.dataset.plugin = '@local/dsh-side-chat'
        style.dataset.pluginCss = '@local/dsh-side-chat/styles'
        style.textContent = CSS
        document.head.appendChild(style)
        return () => style.remove()
      }, 'side-chat: styles')

      const persist = () => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify([...records.values()]))
        } catch {
          // Storage is optional; tracking still works for this page.
        }
      }

      const load = () => {
        try {
          const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
          if (!Array.isArray(raw)) return
          for (const value of raw) {
            if (validRecord(value)) records.set(value.address, value)
          }
        } catch {
          // Ignore corrupt tracking state.
        }
      }

      const track = (record) => {
        records.set(record.address, record)
        persist()
      }

      const untrack = (address) => {
        records.delete(address)
        persist()
      }

      const endSideChat = async (record) => {
        try {
          await ctx.remote.commands.execute(
            record.parentSessionId,
            `/${COMMAND} ${JSON.stringify({ action: 'end', childSessionId: record.childSessionId })}`,
            [],
          )
        } catch (error) {
          console.error('[side-chat] cleanup failed:', error)
        }
      }

      const reconcile = () => {
        if (Date.now() - startedAt < START_GRACE_MS) return
        let open
        try {
          open = new Set(ctx.sidebarRight.openTabs.getSnapshot().map(tab => tab.contentId))
        } catch (error) {
          console.error('[side-chat] cannot read open tabs:', error)
          return
        }
        const now = Date.now()
        for (const [address, record] of records) {
          if (open.has(address)) continue
          if (now - record.openedAt < OPEN_GRACE_MS) continue
          untrack(address)
          void endSideChat(record)
        }
      }

      const scheduleReconcile = () => {
        if (reconcileTimer !== undefined) window.clearTimeout(reconcileTimer)
        reconcileTimer = window.setTimeout(() => {
          reconcileTimer = undefined
          reconcile()
        }, RECONCILE_DELAY_MS)
      }

      const openDraft = (sessionId, selection) => {
        const text = String(selection ?? '')
        if (text.trim() === '') throw new Error(t('draft.emptySelection'))

        let existingId
        let existing
        for (const [id, draft] of drafts) {
          if (draft.sessionId === sessionId) {
            existingId = id
            existing = draft
            break
          }
        }

        const added = { id: newDraftId(), text }
        if (existingId !== undefined && existing !== undefined) {
          drafts.set(existingId, {
            ...existing,
            selections: [...(existing.selections ?? []), added],
          })
          notifyDrafts()
          const address = `${DRAFT_PREFIX}${encodeURIComponent(existingId)}`
          try {
            ctx.sidebarRight.openResource(address, { kind: 'sidechatdraft' })
          } catch (error) {
            console.error('[side-chat] cannot focus draft:', error)
          }
          return
        }

        const draftId = newDraftId()
        drafts.set(draftId, { sessionId, selections: [added] })
        notifyDrafts()
        const address = `${DRAFT_PREFIX}${encodeURIComponent(draftId)}`
        try {
          ctx.sidebarRight.openResource(address, { kind: 'sidechatdraft', preferNewPane: true })
        } catch (error) {
          drafts.delete(draftId)
          notifyDrafts()
          throw error
        }
      }

      const openSideChat = async (sessionId, selections, question, selectionModel = {}) => {
        const texts = Array.isArray(selections)
          ? selections.map(item => String(item ?? '').trim()).filter(Boolean)
          : String(selections ?? '').trim() !== ''
            ? [String(selections).trim()]
            : []
        if (texts.length === 0) return { ok: false, error: t('draft.emptySelection') }
        const selectedChars = texts.reduce((total, text) => total + text.length, 0)
        if (selectedChars > MAX_SELECTION_CHARS) return { ok: false, error: t('error.tooLong') }

        let childSessionId
        try {
          childSessionId = newChildSessionId()
        } catch (error) {
          return { ok: false, error: `${t('draft.openFailed')} ${messageOf(error)}` }
        }

        const excerpt = excerptLabel(texts[0])
        const label = excerpt === '' ? t('tab.label') : `${t('tab.label')} · ${excerpt}`
        const payload = {
          action: 'open',
          childSessionId,
          selections: texts,
          question: String(question ?? '').trim(),
          label,
        }
        if (typeof selectionModel?.provider === 'string' && typeof selectionModel?.model === 'string') {
          payload.provider = selectionModel.provider
          payload.model = selectionModel.model
        }
        if (typeof selectionModel?.reasoningEffort === 'string' && selectionModel.reasoningEffort !== '') {
          payload.reasoningEffort = selectionModel.reasoningEffort
        }

        let outcome
        try {
          outcome = await ctx.remote.commands.execute(
            sessionId,
            `/${COMMAND} ${JSON.stringify(payload)}`,
            [],
          )
        } catch (error) {
          return { ok: false, error: `${t('error.command')} ${messageOf(error)}` }
        }
        if (outcome?.ok !== true) {
          return { ok: false, error: `${t('error.command')} ${outcome?.error?.message ?? ''}`.trim() }
        }
        if (outcome.value === undefined) {
          return { ok: false, error: t('error.command') }
        }
        if (outcome.value.result?.kind !== 'success') {
          return { ok: false, error: outcome.value.result?.text ?? t('error.command') }
        }

        const address = buildAddress(childSessionId, sessionId)
        try {
          ctx.sidebarRight.openResource(address, { kind: 'subagentchat', preferNewPane: true })
        } catch (error) {
          await endSideChat({ childSessionId, parentSessionId: sessionId })
          return { ok: false, error: `${t('error.unavailable')} ${messageOf(error)}` }
        }

        track({ address, childSessionId, parentSessionId: sessionId, label, openedAt: Date.now() })
        scheduleReconcile()
        return { ok: true }
      }

      const findOpenSideChat = (sessionId) => {
        let open
        try {
          open = new Set(ctx.sidebarRight.openTabs.getSnapshot().map(tab => tab.contentId))
        } catch {
          return undefined
        }
        let found
        for (const record of records.values()) {
          if (record.parentSessionId === sessionId && open.has(record.address)) found = record
        }
        return found
      }

      const appendSideChat = async (record, selection) => {
        const text = String(selection ?? '').trim()
        if (text === '') return { ok: false, error: t('draft.emptySelection') }
        try {
          const outcome = await ctx.remote.commands.execute(
            record.parentSessionId,
            `/${COMMAND} ${JSON.stringify({
              action: 'append',
              childSessionId: record.childSessionId,
              selections: [text],
            })}`,
            [],
          )
          if (outcome?.ok !== true) {
            return { ok: false, error: `${t('error.command')} ${outcome?.error?.message ?? ''}`.trim() }
          }
          if (outcome.value === undefined) return { ok: false, error: t('error.command') }
          if (outcome.value.result?.kind !== 'success') {
            return { ok: false, error: outcome.value.result?.text ?? t('error.command') }
          }
          ctx.sidebarRight.openResource(record.address, { kind: 'subagentchat' })
          return { ok: true }
        } catch (error) {
          return { ok: false, error: `${t('error.command')} ${messageOf(error)}` }
        }
      }

      function SideChatSelectionAction(props) {
        const { dismiss, readText, clearSelection, inputActions, useSession, sessionId } = props
        const [text] = React.useState(() => readText())
        const [error, setError] = React.useState(null)
        const enabled = useSession(s => !s.removed && (s.subagent == null || (s.subagent.address.mode === 'continuable' && s.subagent.parentAvailable === true)))
        const isSubagent = useSession(s => s.subagent != null)

        React.useEffect(() => {
          if (!enabled) dismiss()
        }, [enabled, dismiss])

        if (!enabled || text === null || text === undefined || String(text).trim() === '') return null

        return h('div', { className: 'dsh-side-chat-selection' },
          h('div', {
            className: 'dsh-side-chat-actions',
            role: 'group',
            'aria-label': t('action.groupAria'),
          },
          h('button', {
            type: 'button',
            className: 'dsh-side-chat-action',
            'aria-label': t('action.quoteAria'),
            onPointerDown: (event) => { event.preventDefault() },
            onClick: () => {
              const current = readText() ?? text
              if (typeof inputActions?.insertQuote !== 'function') return
              if (!inputActions.insertQuote(current)) return
              clearSelection()
              dismiss()
            },
          }, t('action.quote')),
          isSubagent ? null : h('button', {
            type: 'button',
            className: 'dsh-side-chat-action',
            'aria-label': t('action.askAria'),
            onPointerDown: (event) => { event.preventDefault() },
            onClick: () => {
              try {
                openDraft(sessionId, readText() ?? text)
              } catch (caught) {
                setError(`${t('error.unavailable')} ${messageOf(caught)}`)
                return
              }
              clearSelection()
              dismiss()
            },
          }, t('action.ask'))),
          error === null ? null : h('div', { className: 'dsh-side-chat-action-error', role: 'alert' }, error))
      }

      function SideChatDraftTab(props) {
        const { tab } = props.useTabInfo()
        const draftId = parseDraftAddress(tab.contentId)
        const [draft, setDraft] = React.useState(() => draftId === undefined ? undefined : drafts.get(draftId))
        const [question, setQuestion] = React.useState('')
        const [busy, setBusy] = React.useState(false)
        const [error, setError] = React.useState(null)
        const [catalog, setCatalog] = React.useState(null)
        const [parentSelection, setParentSelection] = React.useState(null)
        const [modelValue, setModelValue] = React.useState('')
        const [effortValue, setEffortValue] = React.useState('')
        const inputRef = React.useRef(null)
        const triggerRef = React.useRef(null)
        const menuRef = React.useRef(null)
        const [menuOpen, setMenuOpen] = React.useState(false)
        const [menuPosition, setMenuPosition] = React.useState({ left: 8, bottom: 8 })
        const [summaryOpen, setSummaryOpen] = React.useState(false)
        const [summaryPosition, setSummaryPosition] = React.useState({ left: 8, bottom: 8 })
        const summaryRef = React.useRef(null)
        const summaryTimer = React.useRef(undefined)
        const inputId = `dsh-side-chat-question-${draftId ?? 'expired'}`

        React.useEffect(() => {
          inputRef.current?.focus()
        }, [])

        React.useEffect(() => {
          if (draftId === undefined) return undefined
          const update = () => setDraft(drafts.get(draftId))
          const unsubscribe = subscribeDrafts(update)
          update()
          return unsubscribe
        }, [draftId])

        React.useEffect(() => () => {
          if (draftId !== undefined) drafts.delete(draftId)
        }, [draftId])

        React.useEffect(() => () => {
          if (summaryTimer.current !== undefined) window.clearTimeout(summaryTimer.current)
        }, [])

        React.useEffect(() => {
          let cancelled = false
          void (async () => {
            try {
              const result = await ctx.remote.session.modelCatalog()
              const value = result?.ok === true ? result.value : result
              if (!cancelled && value !== null && typeof value === 'object' && Array.isArray(value.groups)) {
                setCatalog(value)
              }
            } catch (catalogError) {
              console.error('[side-chat] model catalog failed:', catalogError)
            }
          })()
          return () => { cancelled = true }
        }, [])

        React.useEffect(() => {
          if (draft === undefined) return undefined
          const service = ctx.get?.('modelDirectories')
          if (service === undefined) return undefined
          let directory
          try {
            directory = service.directoryFor(draft.sessionId)
          } catch {
            return undefined
          }
          if (directory === undefined) return undefined
          const update = () => {
            const state = directory.store.getSnapshot()
            setParentSelection(state?.current ?? null)
          }
          const unsubscribe = directory.store.subscribe(update)
          update()
          void directory.load().catch(() => {})
          return unsubscribe
        }, [draft?.sessionId])

        React.useEffect(() => {
          if (draft !== undefined) return undefined
          const timer = window.setTimeout(() => {
            try {
              ctx.sidebarRight.close(tab.id)
            } catch (closeError) {
              console.error('[side-chat] cannot close expired draft:', closeError)
            }
          }, 0)
          return () => window.clearTimeout(timer)
        }, [draft, tab.id])

        React.useEffect(() => {
          if (!menuOpen) return undefined
          const onPointerDown = (event) => {
            const target = event.target
            if (!(target instanceof Node)) return
            if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return
            setMenuOpen(false)
          }
          const onKeyDown = (event) => {
            if (event.key !== 'Escape') return
            setMenuOpen(false)
            triggerRef.current?.focus()
          }
          const onResize = () => setMenuOpen(false)
          document.addEventListener('pointerdown', onPointerDown)
          document.addEventListener('keydown', onKeyDown)
          window.addEventListener('resize', onResize)
          const timer = window.setTimeout(() => menuRef.current?.focus(), 0)
          return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('resize', onResize)
            window.clearTimeout(timer)
          }
        }, [menuOpen])

        if (draft === undefined) {
          return h('div', { className: 'dsh-side-chat-draft' },
            h('div', { className: 'dsh-side-chat-draft-empty' },
              h('div', { className: 'dsh-side-chat-draft-title' }, t('draft.expired')),
              h('div', { className: 'dsh-side-chat-draft-note' }, t('draft.expiredNote'))))
        }

        const submit = async () => {
          if (busy || question.trim() === '' || draft.selections.length === 0) return
          setBusy(true)
          setError(null)
          const selected = modelValue === ''
            ? (effortValue === '' ? {} : { reasoningEffort: effortValue })
            : (() => {
                const [provider, model] = modelValue.split(MODEL_SEPARATOR)
                return provider && model
                  ? { provider, model, ...(effortValue === '' ? {} : { reasoningEffort: effortValue }) }
                  : {}
              })()
          const selections = draft.selections.map(item => item.text)
          const result = await openSideChat(draft.sessionId, selections, question, selected)
          if (result.ok) {
            if (draftId !== undefined) {
              drafts.delete(draftId)
              notifyDrafts()
            }
            try {
              ctx.sidebarRight.close(tab.id)
            } catch (closeError) {
              console.error('[side-chat] cannot close draft:', closeError)
            }
            return
          }
          setBusy(false)
          setError(result.error)
        }

        const clearSelections = () => {
          if (draftId === undefined) return
          const current = drafts.get(draftId)
          if (current === undefined) return
          drafts.set(draftId, { ...current, selections: [] })
          notifyDrafts()
          setSummaryOpen(false)
        }

        const openSummary = () => {
          if (summaryTimer.current !== undefined) window.clearTimeout(summaryTimer.current)
          const rect = summaryRef.current?.getBoundingClientRect()
          if (rect !== undefined && rect !== null) {
            const width = 360
            const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8))
            const bottom = Math.max(8, window.innerHeight - rect.top + 6)
            setSummaryPosition({ left, bottom })
          }
          setSummaryOpen(true)
        }

        const closeSummarySoon = () => {
          if (summaryTimer.current !== undefined) window.clearTimeout(summaryTimer.current)
          summaryTimer.current = window.setTimeout(() => { setSummaryOpen(false) }, 120)
        }

        const keepSummary = () => {
          if (summaryTimer.current !== undefined) window.clearTimeout(summaryTimer.current)
        }

        const options = []
        for (const group of catalog?.groups ?? []) {
          for (const model of group.models ?? []) {
            options.push({
              value: `${group.id}${MODEL_SEPARATOR}${model.id}`,
              name: model.name,
              groupName: group.name,
              label: `${group.name} · ${model.name}`,
              efforts: Array.isArray(model.reasoning?.efforts)
                ? model.reasoning.efforts.map(effort => ({ id: effort.id, name: effort.name }))
                : [],
              defaultEffort: model.reasoning?.defaultEffort,
            })
          }
        }

        const selectedModel = options.find(option => option.value === modelValue)
        const parentModel = parentSelection === null
          ? undefined
          : options.find(option => option.value === `${parentSelection.provider}${MODEL_SEPARATOR}${parentSelection.model}`)
        const effectiveModel = modelValue === '' ? parentModel : selectedModel
        const effortOptions = effectiveModel?.efforts ?? []
        const selectedEffort = effortOptions.find(effort => effort.id === effortValue)
        const inheritEffort = modelValue === ''
        const modelLabel = selectedModel === undefined ? t('draft.modelInherit') : selectedModel.name
        const modelIcon = h('svg', {
          viewBox: '0 0 16 16',
          width: 16,
          height: 16,
          className: 'dsh-side-chat-model-icon',
          'aria-hidden': true,
        },
        h('rect', {
          x: 2.5,
          y: 4,
          width: 11,
          height: 8,
          rx: 2,
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 1.3,
        }),
        h('path', {
          d: 'M5.5 8h5',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 1.3,
          'stroke-linecap': 'round',
        }))
        const chevronIcon = h('svg', {
          viewBox: '0 0 16 16',
          width: 12,
          height: 12,
          className: 'dsh-side-chat-model-chevron',
          'aria-hidden': true,
        }, h('path', {
          d: 'M4 6l4 4 4-4',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 1.6,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        }))
        const openMenu = () => {
          const rect = triggerRef.current?.getBoundingClientRect()
          if (rect === undefined || rect === null) return
          const width = 300
          const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8))
          const bottom = Math.max(8, window.innerHeight - rect.top + 6)
          setMenuPosition({ left, bottom })
          setMenuOpen(true)
        }
        const closeMenu = () => {
          setMenuOpen(false)
        }
        const groups = []
        for (const option of options) {
          let group = groups.find(item => item.name === option.groupName)
          if (group === undefined) {
            group = { name: option.groupName, options: [] }
            groups.push(group)
          }
          group.options.push(option)
        }
        const checkIcon = h('svg', {
          viewBox: '0 0 16 16',
          width: 14,
          height: 14,
          className: 'dsh-side-chat-model-check',
          'aria-hidden': true,
        }, h('path', {
          d: 'M3.5 8.5l3 3 6-7',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 1.7,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        }))
        const inheritRow = h('button', {
          type: 'button',
          role: 'menuitemradio',
          'aria-checked': modelValue === '',
          className: 'dsh-side-chat-model-option dsh-side-chat-model-inherit',
          onClick: () => {
            setModelValue('')
            setEffortValue('')
          },
        },
        h('span', { className: 'dsh-side-chat-model-option-label' }, t('draft.modelInherit')),
        modelValue === '' ? checkIcon : null)
        const effortSection = effectiveModel === undefined || (inheritEffort && effortOptions.length === 0)
          ? null
          : h('div', { className: 'dsh-side-chat-model-effort-section' },
            h('div', { className: 'dsh-side-chat-model-group', role: 'presentation' }, t('draft.effort')),
            effortOptions.length === 0
              ? h('div', { className: 'dsh-side-chat-model-empty' }, t('draft.effortNone'))
              : h(React.Fragment, null,
                inheritEffort
                  ? h('button', {
                      type: 'button',
                      role: 'menuitemradio',
                      'aria-checked': effortValue === '',
                      className: 'dsh-side-chat-model-option',
                      onClick: () => {
                        setEffortValue('')
                        closeMenu()
                      },
                    },
                    h('span', { className: 'dsh-side-chat-model-option-label' }, t('draft.effortInherit')),
                    effortValue === '' ? checkIcon : null)
                  : null,
                ...effortOptions.map(effort => h('button', {
                  key: effort.id,
                  type: 'button',
                  role: 'menuitemradio',
                  'aria-checked': effortValue === effort.id,
                  className: 'dsh-side-chat-model-option',
                  onClick: () => {
                    setEffortValue(effort.id)
                    closeMenu()
                  },
                },
                h('span', { className: 'dsh-side-chat-model-option-label' }, effort.name),
                effortValue === effort.id ? checkIcon : null))))
        const modelList = options.length === 0
          ? h('div', { className: 'dsh-side-chat-model-empty' }, t('draft.modelEmpty'))
          : h(React.Fragment, null,
            h('div', { className: 'dsh-side-chat-model-group', role: 'presentation' }, t('draft.model')),
            ...groups.map(group => h(React.Fragment, { key: `group-${group.name}` },
              h('div', { className: 'dsh-side-chat-model-group', role: 'presentation' }, group.name),
              ...group.options.map(option => h('button', {
                key: option.value,
                type: 'button',
                role: 'menuitemradio',
                'aria-checked': modelValue === option.value,
                className: 'dsh-side-chat-model-option',
                onClick: () => {
                  setModelValue(option.value)
                  setEffortValue(option.defaultEffort ?? '')
                },
              },
              h('span', { className: 'dsh-side-chat-model-option-label' }, option.name),
              modelValue === option.value ? checkIcon : null)))))
        const menuContent = h(React.Fragment, null, inheritRow, effortSection, modelList)
        const modelMenu = menuOpen ? ReactDOM.createPortal(
          h('div', {
            className: 'dsh-side-chat-model-menu',
            role: 'menu',
            ref: menuRef,
            tabIndex: -1,
            style: { left: menuPosition.left, bottom: menuPosition.bottom },
          }, menuContent),
          document.body) : null
        const removeIcon = h('svg', {
          viewBox: '0 0 16 16',
          width: 12,
          height: 12,
          'aria-hidden': true,
        }, h('path', {
          d: 'M4 4l8 8M12 4l-8 8',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 1.6,
          'stroke-linecap': 'round',
        }))
        const selectionCount = draft.selections.length
        const summary = selectionCount === 0 ? null : h('div', {
          className: 'dsh-side-chat-selection-summary',
          ref: summaryRef,
          onMouseEnter: openSummary,
          onMouseLeave: closeSummarySoon,
        },
        h('span', { className: 'dsh-side-chat-selection-summary-label' }, t('draft.selectedCount', { count: selectionCount })),
        h('button', {
          type: 'button',
          className: 'dsh-side-chat-selection-clear',
          'aria-label': t('draft.clearQuotes'),
          title: t('draft.clearQuotes'),
          onClick: clearSelections,
        }, removeIcon))
        const summaryPopover = summaryOpen && selectionCount > 0 ? ReactDOM.createPortal(
          h('div', {
            className: 'dsh-side-chat-summary-popover',
            role: 'tooltip',
            style: { left: summaryPosition.left, bottom: summaryPosition.bottom },
            onMouseEnter: keepSummary,
            onMouseLeave: closeSummarySoon,
          },
          h('div', { className: 'dsh-side-chat-summary-title' }, t('draft.summaryTitle')),
          ...draft.selections.map(selection => h('blockquote', {
            className: 'dsh-side-chat-quote',
            key: selection.id,
          }, selection.text))),
          document.body) : null
        const sendIcon = h('svg', {
          viewBox: '0 0 16 16',
          width: 16,
          height: 16,
          'aria-hidden': true,
        }, h('path', {
          d: 'M8 13V3M3.5 7.5 8 3l4.5 4.5',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 1.7,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        }))

        return h('div', { className: 'dsh-side-chat-draft' },
          h('div', { className: 'dsh-side-chat-draft-empty' },
            h('div', { className: 'dsh-side-chat-draft-title' }, t('draft.title')),
            h('div', { className: 'dsh-side-chat-draft-note' }, t('draft.note'))),
          h('div', { className: 'dsh-side-chat-composer' },
            summary,
            h('textarea', {
              id: inputId,
              ref: inputRef,
              rows: 2,
              className: 'dsh-side-chat-composer-input',
              value: question,
              placeholder: t('draft.placeholder'),
              disabled: busy,
              onChange: event => setQuestion(event.target.value),
              onKeyDown: (event) => {
                if (event.nativeEvent?.isComposing || event.isComposing) return
                if (event.key !== 'Enter') return
                if (event.shiftKey && !event.metaKey && !event.ctrlKey) return
                event.preventDefault()
                void submit()
              },
            }),
            error === null ? null : h('div', { className: 'dsh-side-chat-error', role: 'alert' }, error),
            h('div', { className: 'dsh-side-chat-composer-toolbar' },
              h('div', { className: 'dsh-side-chat-composer-actions' },
                h('button', {
                  ref: triggerRef,
                  type: 'button',
                  className: 'dsh-side-chat-model-trigger',
                  disabled: busy,
                  'aria-haspopup': 'menu',
                  'aria-expanded': menuOpen,
                  'aria-label': t('draft.model'),
                  title: t('draft.model'),
                  onClick: () => {
                    if (menuOpen) closeMenu()
                    else openMenu()
                  },
                },
                modelIcon,
                h('span', { className: 'dsh-side-chat-model-label' }, modelLabel),
                selectedEffort === undefined
                  ? null
                  : h('span', { className: 'dsh-side-chat-model-effort' }, selectedEffort.name),
                chevronIcon),
                h('button', {
                  type: 'button',
                  className: 'dsh-side-chat-send',
                  disabled: busy || question.trim() === '' || draft.selections.length === 0,
                  'aria-label': busy ? t('draft.busy') : t('draft.submit'),
                  title: busy ? t('draft.busy') : t('draft.submit'),
                  onClick: () => void submit(),
                }, sendIcon)))), summaryPopover, modelMenu)
      }

      ctx.effect(() => {
        load()
        let unsubscribe
        try {
          unsubscribe = ctx.sidebarRight.openTabs.subscribe(() => reconcile())
        } catch (error) {
          console.error('[side-chat] cannot subscribe to open tabs:', error)
        }
        const bootTimer = window.setTimeout(() => reconcile(), START_GRACE_MS)
        return () => {
          window.clearTimeout(bootTimer)
          if (reconcileTimer !== undefined) window.clearTimeout(reconcileTimer)
          if (typeof unsubscribe === 'function') unsubscribe()
        }
      }, 'side-chat: tab tracking')

      ctx.effect(() => ctx.uiConversation.interactions.register({
        id: 'side-chat',
        onInteraction(request) {
          if (request.trigger !== 'selection') return
          if (request.readText() === null) return
          const binding = ctx.sessions.binding(request.sessionId)
          if (binding === undefined) return
          const session = binding.session.getSnapshot()
          if (session.removed) return
          if (session.subagent != null) return
          request.open()
        },
      }), 'side-chat: selection interaction')

      for (const key of ['quote', 'side-chat']) {
        ctx.slots.inject('conversation.chat.text-interaction', () => ctx.slots.register({
          name: 'conversation.chat.text-interaction',
          key,
          priority: -100,
          locale: NS,
        }, SideChatSelectionAction))
      }

      // The Host command bridge logs `/sidechat` lifecycle events in the parent
      // conversation; keep those internal rows out of the visible Chat flow.
      ctx.slots.inject('conversation.chat.commandview', () => ctx.slots.register({
        name: 'conversation.chat.commandview',
        key: 'sidechat',
      }, () => null))

      ctx.inject(['sidebarRightTabs'], (scope) => {
        scope.effect(() => scope.sidebarRightTabs.register({
          id: '@local/dsh-side-chat/draft',
          kind: 'sidechatdraft',
          patterns: ['dsh-resource://sidechatdraft/**'],
          priority: 'extension',
          keepMounted: true,
          canOpen: address => parseDraftAddress(address) !== undefined,
          title: () => t('draft.tab'),
        }), 'side-chat: draft tab type')

        scope.effect(() => scope.slots.inject('sidebar.right.pane.tab', () => scope.slots.register({
          name: 'sidebar.right.pane.tab',
          key: '@local/dsh-side-chat/draft',
          locale: NS,
        }, SideChatDraftTab)), 'side-chat: draft tab body')
      })
    }

    return {
      name: 'side-chat',
      inject: ['slots', 'locale', 'sessions', 'remote', 'remote.commands', 'remote.session', 'uiConversation', 'sidebarRight'],
      apply,
    }
  },
})
