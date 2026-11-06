window.__ModuleLoader__.load({
  id: '@local/dsh-side-chat',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'sideChat'
    const COMMAND = 'sidechat'
    const STORAGE_KEY = 'dsh.side-chat.tabs.v1'
    const ADDRESS_PREFIX = 'dsh-resource://subagentchat/session/'
    const START_GRACE_MS = 2000
    const OPEN_GRACE_MS = 2000
    const RECONCILE_DELAY_MS = 2500
    const MAX_SELECTION_CHARS = 20000

    const zh = {
      'action.groupAria': '选中文字操作',
      'action.quote': '添加到对话',
      'action.ask': '在侧边提问',
      'action.quoteAria': '把选中文字添加到当前对话',
      'action.askAria': '在侧边聊天中追问选中文字',
      'modal.title': '在侧边聊天中提问',
      'modal.selected': '选中片段',
      'modal.note': '只读侧边聊天。它会看到当前对话的快照，但不能修改文件。',
      'modal.question': '问题',
      'modal.placeholder': '关于这段文字，你想问什么？',
      'modal.submit': '提问',
      'modal.cancel': '取消',
      'modal.busy': '正在打开…',
      'modal.emptySelection': '请先选中一段文字。',
      'modal.openFailed': '无法打开侧边聊天。',
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
      'modal.title': 'Ask in side chat',
      'modal.selected': 'Selected excerpt',
      'modal.note': 'Read-only side chat. It sees a snapshot of this conversation and cannot change files.',
      'modal.question': 'Question',
      'modal.placeholder': 'Ask about this excerpt…',
      'modal.submit': 'Ask',
      'modal.cancel': 'Cancel',
      'modal.busy': 'Opening…',
      'modal.emptySelection': 'Select some text first.',
      'modal.openFailed': 'Could not open the side chat.',
      'error.tooLong': 'The selection is too long.',
      'error.command': 'The side-chat command failed.',
      'error.unavailable': 'Side chat is unavailable in this build.',
      'tab.label': 'Side chat',
    }

    const CSS = `
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
      .dsh-side-chat-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent);
      }
      .dsh-side-chat-dialog {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 1001;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: min(440px, calc(100vw - 32px));
        max-height: min(720px, calc(100vh - 32px));
        overflow: auto;
        padding: 16px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 12px;
        background: var(--dsw-alias-bg-overlay);
        color: var(--dsw-alias-label-primary);
        box-shadow: var(--dsw-elevation-prominent, 0 16px 48px rgba(0, 0, 0, 0.24));
      }
      .dsh-side-chat-title {
        font-size: 15px;
        font-weight: 600;
        line-height: 20px;
      }
      .dsh-side-chat-note {
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        line-height: 18px;
      }
      .dsh-side-chat-label {
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        line-height: 16px;
      }
      .dsh-side-chat-quote {
        margin: 0;
        max-height: 120px;
        overflow: auto;
        padding: 8px 10px;
        border-left: 2px solid var(--dsw-alias-border-l2);
        border-radius: 6px;
        background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-secondary);
        font-size: 12px;
        line-height: 18px;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .dsh-side-chat-input {
        box-sizing: border-box;
        width: 100%;
        min-height: 76px;
        resize: vertical;
        padding: 8px 10px;
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 8px;
        background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-primary);
        font: inherit;
        font-size: 13px;
        line-height: 20px;
      }
      .dsh-side-chat-input:focus {
        outline: none;
        border-color: var(--dsw-alias-brand-primary);
      }
      .dsh-side-chat-input:disabled {
        opacity: 0.6;
      }
      .dsh-side-chat-error {
        color: var(--dsw-alias-state-error-primary);
        font-size: 12px;
        line-height: 18px;
        overflow-wrap: anywhere;
      }
      .dsh-side-chat-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
      .dsh-side-chat-button {
        border: 1px solid var(--dsw-alias-border-l1);
        border-radius: 8px;
        padding: 6px 12px;
        background: var(--dsw-alias-bg-layer-1);
        color: var(--dsw-alias-label-primary);
        font: inherit;
        font-size: 13px;
        line-height: 18px;
        cursor: pointer;
      }
      .dsh-side-chat-button:focus-visible {
        outline: 2px solid var(--dsw-alias-brand-primary);
        outline-offset: 1px;
      }
      .dsh-side-chat-button:disabled {
        opacity: 0.5;
        cursor: default;
      }
      .dsh-side-chat-primary {
        border-color: var(--dsw-alias-brand-primary);
        color: var(--dsw-alias-brand-primary);
        background: transparent;
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

    function createQuestionStore() {
      let current = null
      const listeners = new Set()
      return {
        getSnapshot: () => current,
        subscribe(listener) {
          listeners.add(listener)
          return () => { listeners.delete(listener) }
        },
        set(next) {
          if (current === next) return
          current = next
          for (const listener of [...listeners]) {
            try {
              listener()
            } catch {
              // A listener must not break the dialog state.
            }
          }
        },
      }
    }

    const questionStore = createQuestionStore()

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

    function buildAddress(childSessionId, parentSessionId) {
      const query = new URLSearchParams({ parent: parentSessionId, mode: 'continuable' })
      return `${ADDRESS_PREFIX}${encodeURIComponent(childSessionId)}?${query.toString()}`
    }

    function apply(ctx) {
      const t = ctx.locale.bind(NS)
      const records = new Map()
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

      const openSideChat = async (sessionId, selection, question) => {
        const text = String(selection ?? '').trim()
        if (text === '') return { ok: false, error: t('modal.emptySelection') }
        if (text.length > MAX_SELECTION_CHARS) return { ok: false, error: t('error.tooLong') }

        let childSessionId
        try {
          childSessionId = newChildSessionId()
        } catch (error) {
          return { ok: false, error: `${t('modal.openFailed')} ${messageOf(error)}` }
        }

        const excerpt = excerptLabel(text)
        const label = excerpt === '' ? t('tab.label') : `${t('tab.label')} · ${excerpt}`
        const payload = {
          action: 'open',
          childSessionId,
          selection: text,
          question: String(question ?? '').trim(),
          label,
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

      function SideChatSelectionAction(props) {
        const { dismiss, readText, clearSelection, inputActions, useSession, sessionId } = props
        const [text] = React.useState(() => readText())
        const enabled = useSession(s => !s.removed && (s.subagent == null || (s.subagent.address.mode === 'continuable' && s.subagent.parentAvailable === true)))
        const isSubagent = useSession(s => s.subagent != null)

        React.useEffect(() => {
          if (!enabled) dismiss()
        }, [enabled, dismiss])

        if (!enabled || text === null || text === undefined || String(text).trim() === '') return null

        return h('div', {
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
            questionStore.set({ sessionId, text: readText() ?? text })
            clearSelection()
            dismiss()
          },
        }, t('action.ask')))
      }

      function SideChatQuestionOverlay() {
        const pending = React.useSyncExternalStore(questionStore.subscribe, questionStore.getSnapshot)
        const [question, setQuestion] = React.useState('')
        const [busy, setBusy] = React.useState(false)
        const [error, setError] = React.useState(null)
        const inputRef = React.useRef(null)

        React.useEffect(() => {
          if (pending === null) {
            setQuestion('')
            setBusy(false)
            setError(null)
            return undefined
          }
          const timer = window.setTimeout(() => inputRef.current?.focus(), 0)
          return () => window.clearTimeout(timer)
        }, [pending])

        React.useEffect(() => {
          if (pending === null) return undefined
          const onKeyDown = (event) => {
            if (event.key === 'Escape' && !busy) questionStore.set(null)
          }
          document.addEventListener('keydown', onKeyDown)
          return () => document.removeEventListener('keydown', onKeyDown)
        }, [pending, busy])

        if (pending === null) return null

        const submit = async () => {
          if (busy) return
          setBusy(true)
          setError(null)
          const result = await openSideChat(pending.sessionId, pending.text, question)
          if (result.ok) {
            questionStore.set(null)
            return
          }
          setBusy(false)
          setError(result.error)
        }

        const preview = pending.text.length > 500 ? `${pending.text.slice(0, 500)}…` : pending.text

        return h(React.Fragment, null,
          h('div', {
            className: 'dsh-side-chat-backdrop',
            onClick: () => { if (!busy) questionStore.set(null) },
          }),
          h('div', {
            className: 'dsh-side-chat-dialog',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-labelledby': 'dsh-side-chat-title',
            onClick: event => event.stopPropagation(),
          },
          h('div', { id: 'dsh-side-chat-title', className: 'dsh-side-chat-title' }, t('modal.title')),
          h('div', { className: 'dsh-side-chat-note' }, t('modal.note')),
          h('div', { className: 'dsh-side-chat-label' }, t('modal.selected')),
          h('blockquote', { className: 'dsh-side-chat-quote' }, preview),
          h('label', { className: 'dsh-side-chat-label', htmlFor: 'dsh-side-chat-question' }, t('modal.question')),
          h('textarea', {
            id: 'dsh-side-chat-question',
            ref: inputRef,
            className: 'dsh-side-chat-input',
            value: question,
            placeholder: t('modal.placeholder'),
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
          h('div', { className: 'dsh-side-chat-footer' },
            h('button', {
              type: 'button',
              className: 'dsh-side-chat-button',
              disabled: busy,
              onClick: () => questionStore.set(null),
            }, t('modal.cancel')),
            h('button', {
              type: 'button',
              className: 'dsh-side-chat-button dsh-side-chat-primary',
              disabled: busy,
              onClick: () => void submit(),
            }, busy ? t('modal.busy') : t('modal.submit'))))
        )
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
          questionStore.set(null)
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

      ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'side-chat-question',
        order: 50,
        locale: NS,
      }, SideChatQuestionOverlay))
    }

    return {
      name: 'side-chat',
      inject: ['slots', 'locale', 'sessions', 'remote', 'remote.commands', 'uiConversation', 'sidebarRight'],
      apply,
    }
  },
})
