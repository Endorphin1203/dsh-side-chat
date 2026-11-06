import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_QUESTION,
  buildLabel,
  buildSideChatPrompt,
  buildSideChatSystemPrompt,
  formatTranscript,
  isSideChatId,
  newSideChatId,
  normalizeEndPayload,
  normalizeOpenPayload,
} from '../lib/pure.js'

const UUID = '123e4567-e89b-42d3-a456-426614174000'
const CHILD = `session-sidechat-${UUID}`
const LIMITS = { maxSelectionChars: 20, maxQuestionChars: 10, maxLabelChars: 20 }

test('isSideChatId accepts generated v4 ids and rejects arbitrary session ids', () => {
  assert.equal(isSideChatId(CHILD), true)
  assert.equal(isSideChatId(`session-sidechat-${UUID.toUpperCase()}`), true)
  for (const value of [
    'session-13ec3e1a-ff25-4a7c-a839-0b04fb1e39cf',
    'session-sidechat-123',
    '',
    null,
    undefined,
    42,
  ]) {
    assert.equal(isSideChatId(value), false)
  }
})

test('newSideChatId prefixes a v4 UUID', () => {
  assert.equal(newSideChatId(UUID), CHILD)
  assert.equal(isSideChatId(newSideChatId()), true)
  assert.throws(() => newSideChatId('not-a-uuid'))
})

test('buildLabel keeps one trimmed line and truncates', () => {
  assert.equal(buildLabel('  first   line\nsecond'), 'first line')
  assert.equal(buildLabel('', 10), '')
  const label = buildLabel('x'.repeat(80), 10)
  assert.equal(label.length, 10)
  assert.ok(label.endsWith('…'))
})

test('formatTranscript keeps user and assistant text only', () => {
  const messages = [
    { role: 'system', content: [{ type: 'text', text: 'SYSTEM' }] },
    { role: 'user', content: [{ type: 'text', text: 'first question' }] },
    {
      role: 'assistant',
      content: [
        { type: 'reasoning', text: 'REASONING' },
        { type: 'text', text: 'first answer' },
      ],
    },
    { role: 'tool', content: [{ type: 'text', text: 'TOOL RESULT' }] },
    { role: 'user', content: [{ type: 'text', text: 'second question' }] },
  ]
  const text = formatTranscript(messages, 40000)
  assert.match(text, /User:\nfirst question/)
  assert.match(text, /Assistant:\nfirst answer/)
  assert.match(text, /User:\nsecond question/)
  for (const excluded of ['SYSTEM', 'REASONING', 'TOOL RESULT']) {
    assert.doesNotMatch(text, new RegExp(excluded))
  }
})

test('formatTranscript truncates the oldest content and keeps the tail', () => {
  const messages = [
    { role: 'user', content: [{ type: 'text', text: 'A'.repeat(200) }] },
    { role: 'assistant', content: [{ type: 'text', text: 'LATEST' }] },
  ]
  const text = formatTranscript(messages, 80)
  assert.ok(text.startsWith('[Earlier conversation omitted]'))
  assert.match(text, /LATEST$/)
  assert.ok(text.length <= 80)
})

test('buildSideChatPrompt quotes each line and defaults an empty question', () => {
  const text = buildSideChatPrompt({ selection: 'alpha\nbeta', question: '' })
  assert.match(text, /> alpha\n> beta/)
  assert.match(text, new RegExp(`Question: ${DEFAULT_QUESTION}`))
})

test('buildSideChatSystemPrompt includes the role and transcript', () => {
  const text = buildSideChatSystemPrompt({
    parentSessionId: 'session-main',
    createdAt: Date.UTC(2026, 10, 6),
    transcript: 'User:\nhello',
  })
  assert.match(text, /temporary side-chat assistant/)
  assert.match(text, /Parent conversation snapshot/)
  assert.match(text, /User:\nhello/)
  assert.match(text, /session-main/)
})

test('normalizeOpenPayload trims, validates, and truncates', () => {
  const ok = normalizeOpenPayload(
    {
      action: 'open',
      childSessionId: CHILD,
      selection: '  hello  ',
      question: '  why?  ',
      label: '  Side   chat  ',
    },
    LIMITS,
  )
  assert.deepEqual(ok, {
    ok: true,
    value: {
      action: 'open',
      childSessionId: CHILD,
      selection: 'hello',
      question: 'why?',
      label: 'Side chat',
    },
  })
})

test('normalizeOpenPayload rejects empty, oversized, bad-id, and bad-action payloads', () => {
  const base = { action: 'open', childSessionId: CHILD, selection: 'hello', question: '' }
  assert.equal(normalizeOpenPayload({ ...base, action: 'end' }, LIMITS).ok, false)
  assert.equal(normalizeOpenPayload({ ...base, childSessionId: 'session-abc' }, LIMITS).ok, false)
  assert.equal(normalizeOpenPayload({ ...base, selection: '   ' }, LIMITS).ok, false)
  assert.equal(normalizeOpenPayload({ ...base, selection: 'x'.repeat(21) }, LIMITS).ok, false)
  assert.equal(normalizeOpenPayload({ ...base, question: 'x'.repeat(11) }, LIMITS).ok, false)
})

test('normalizeOpenPayload accepts an optional provider/model pair', () => {
  const base = { action: 'open', childSessionId: CHILD, selection: 'hello', question: '' }
  const ok = normalizeOpenPayload({ ...base, provider: 'deepseek', model: 'deepseek-chat' }, LIMITS)
  assert.equal(ok.ok, true)
  assert.equal(ok.value.provider, 'deepseek')
  assert.equal(ok.value.model, 'deepseek-chat')
  assert.equal(normalizeOpenPayload({ ...base, provider: 'deepseek' }, LIMITS).ok, false)
  assert.equal(normalizeOpenPayload({ ...base, model: 'deepseek-chat' }, LIMITS).ok, false)
  const withEffort = normalizeOpenPayload({
    ...base,
    provider: 'deepseek',
    model: 'deepseek-chat',
    reasoningEffort: 'high',
  }, LIMITS)
  assert.equal(withEffort.ok, true)
  assert.equal(withEffort.value.reasoningEffort, 'high')
  assert.equal(normalizeOpenPayload({ ...base, reasoningEffort: 'high' }, LIMITS).ok, false)
})

test('normalizeEndPayload accepts only side-chat ids and the end action', () => {
  assert.deepEqual(normalizeEndPayload({ action: 'end', childSessionId: CHILD }), {
    ok: true,
    value: { action: 'end', childSessionId: CHILD },
  })
  assert.equal(normalizeEndPayload({ action: 'end', childSessionId: 'session-abc' }).ok, false)
  assert.equal(normalizeEndPayload({ action: 'open', childSessionId: CHILD }).ok, false)
})
