window.__ModuleLoader__.load({
  id: '@local/dsh-side-chat',
  factory(require) {
    const React = require('react')
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

    const zh = {
      'action.groupAria': '选中文字操作',
      'action.quote': '添加到对话',
      'action.ask': '在侧边提问',
      'action.quoteAria': '把选中文字添加到当前对话',
      'action.askAria': '在侧边聊天中追问选中文字',
      'draft.tab': '侧边聊天',
      'draft.title': '在侧边聊天中提问',
      'draft.note': '只读侧边聊天。它会看到当前对话的快照，但不能修改文件。',
      'draft.selected': '选中片段',
      'draft.question': '问题',
      'draft.placeholder': '关于这段文字，你想问什么？',
      'draft.submit': '提问',
      'draft.cancel': '取消',
      'draft.busy': '正在打开…',
      'draft.emptySelection': '请先选中一段文字。',
      'draft.openFailed': '无法打开侧边聊天。',
      'draft.expired': '这个草稿已失效',
      'draft.expiredNote': '请重新在对话中选中文字。',
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
      'draft.selected': 'Selected excerpt',
      'draft.question': 'Question',
      'draft.placeholder': 'Ask about this excerpt…',
      'draft.submit': 'Ask',
      'draft.cancel': 'Cancel',
      'draft.busy': 'Opening…',
      'draft.emptySelection': 'Select some text first.',
      'draft.openFailed': 'Could not open the side chat.',
      'draft.expired': 'This draft expired',
      'draft.expiredNote': 'Select text in the conversation to start again.',
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
        gap: 10px;
        height: 100%;
        padding: 16px;
        overflow: auto;
        background: var(--dsw-alias-bg-base);
        color: var(--dsw-alias-label-primary);
      }
      .dsh-side-chat-draft-title {
        font-size: 15px;
        font-weight: 600;
        line-height: 20px;
      }
      .dsh-side-chat-draft-note {
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
        max-height: 160px;
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
        min-height: 96px;
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
        const draftId = newDraftId()
        drafts.set(draftId, { sessionId, text })
        const address = `${DRAFT_PREFIX}${encodeURIComponent(draftId)}`
        try {
          ctx.sidebarRight.openResource(address, { kind: 'sidechatdraft', preferNewPane: true })
        } catch (error) {
          drafts.delete(draftId)
          throw error
        }
      }

      const openSideChat = async (sessionId, selection, question) => {
        const text = String(selection ?? '').trim()
        if (text === '') return { ok: false, error: t('draft.emptySelection') }
        if (text.length > MAX_SELECTION_CHARS) return { ok: false, error: t('error.tooLong') }

        let childSessionId
        try {
          childSessionId = newChildSessionId()
        } catch (error) {
          return { ok: false, error: `${t('draft.openFailed')} ${messageOf(error)}` }
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
        const draft = draftId === undefined ? undefined : drafts.get(draftId)
        const [question, setQuestion] = React.useState('')
        const [busy, setBusy] = React.useState(false)
        const [error, setError] = React.useState(null)
        const inputRef = React.useRef(null)
        const inputId = `dsh-side-chat-question-${draftId ?? 'expired'}`

        React.useEffect(() => {
          inputRef.current?.focus()
        }, [])

        React.useEffect(() => () => {
          if (draftId !== undefined) drafts.delete(draftId)
        }, [draftId])

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

        if (draft === undefined) {
          return h('div', { className: 'dsh-side-chat-draft' },
            h('div', { className: 'dsh-side-chat-draft-title' }, t('draft.expired')),
            h('div', { className: 'dsh-side-chat-draft-note' }, t('draft.expiredNote')))
        }

        const close = () => {
          if (draftId !== undefined) drafts.delete(draftId)
          try {
            ctx.sidebarRight.close(tab.id)
          } catch (closeError) {
            console.error('[side-chat] cannot close draft:', closeError)
          }
        }

        const submit = async () => {
          if (busy) return
          setBusy(true)
          setError(null)
          const result = await openSideChat(draft.sessionId, draft.text, question)
          if (result.ok) {
            if (draftId !== undefined) drafts.delete(draftId)
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

        const preview = draft.text.length > 500 ? `${draft.text.slice(0, 500)}…` : draft.text

        return h('div', { className: 'dsh-side-chat-draft' },
          h('div', { className: 'dsh-side-chat-draft-title' }, t('draft.title')),
          h('div', { className: 'dsh-side-chat-draft-note' }, t('draft.note')),
          h('div', { className: 'dsh-side-chat-label' }, t('draft.selected')),
          h('blockquote', { className: 'dsh-side-chat-quote' }, preview),
          h('label', { className: 'dsh-side-chat-label', htmlFor: inputId }, t('draft.question')),
          h('textarea', {
            id: inputId,
            ref: inputRef,
            className: 'dsh-side-chat-input',
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
          h('div', { className: 'dsh-side-chat-footer' },
            h('button', {
              type: 'button',
              className: 'dsh-side-chat-button',
              disabled: busy,
              onClick: close,
            }, t('draft.cancel')),
            h('button', {
              type: 'button',
              className: 'dsh-side-chat-button dsh-side-chat-primary',
              disabled: busy,
              onClick: () => void submit(),
            }, busy ? t('draft.busy') : t('draft.submit'))))
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

      ctx.inject(['sidebarRightTabs'], (scope) => {
        scope.effect(() => scope.sidebarRightTabs.register({
          id: '@local/dsh-side-chat/draft',
          kind: 'sidechatdraft',
          patterns: ['dsh-resource://sidechatdraft/**'],
          priority: 'extension',
          multiple: true,
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
      inject: ['slots', 'locale', 'sessions', 'remote', 'remote.commands', 'uiConversation', 'sidebarRight'],
      apply,
    }
  },
})
