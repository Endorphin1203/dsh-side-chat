# DSH side chat

Select text in a DeepSeek Harness conversation and choose **Add to chat** or **Ask in side chat**.

- **Add to chat** inserts the selection as a Markdown quote in the current composer.
- **Ask in side chat** opens a draft composer in the right sidebar. Selected excerpts accumulate there
  as a compact **n selected excerpts** chip: the chip shows no inline text, hovering reveals the
  excerpts and an X immediately beside the count, and the X clears all excerpts. Add another excerpt
  at any time by selecting more text and choosing **Ask in side chat** again.
- The draft composer follows the main conversation's styling and has a two-step model picker:
  **model** and **reasoning effort** entries, matching the main conversation's model picker. The
  side chat can follow the main session's model or use a selected model/effort.
- Sending the draft starts the side chat in the right sidebar with all excerpts and the question as
  its first context. The conversation then uses the native Harness composer, so follow-ups and the
  input area match the main conversation.
- The side chat is read-only. Its execution guard allows only `read`, `glob`, `grep`, and
  `read_image`; other tools (including shell, write, edit, web, agents, and memory) are denied even
  if they appear in the model's tool list.
- Closing the side-chat tab stops and archives the temporary session. The UI, session list, and
  subagent catalog stop showing it; DeepSeek Harness keeps an archived session log on disk.
- The internal `/sidechat` command lifecycle still exists in the parent session log (it is the
  UI-to-Host bridge), but its Chat rows are hidden by the plugin.

## Install

The plugin is installed through the Harness plugin manager from this directory.

## Configuration

`cordis.patch.yml` exposes:

| Key | Default | Meaning |
| --- | --- | --- |
| `providerName` | `spawn` | Subagent backend used for the temporary child |
| `maxTranscriptChars` | `40000` | Parent-conversation snapshot budget |
| `maxSelectionChars` | `20000` | Maximum total selected text |
| `maxQuestionChars` | `4000` | Maximum question |
| `readOnlyTools` | `read`, `glob`, `grep`, `read_image` | Allowed model tools |
| `systemPromptOrder` | `900` | Prompt section order for the side-chat context |

## Development

```bash
node --test tests/pure.test.js
node --check index.js lib/host.js lib/pure.js client.js tests/pure.test.js
```

## Known limitations

- Closing archives the temporary session log; it does not physically delete it.
- The `/sidechat` command events remain in the parent session log even though their Chat rows are
  hidden. Selected text is not recorded by the command (`recordInput: false`).
- Because the temporary session is a continuable subagent child, it may appear in the parent's
  subagent catalog while open; it is archived when the tab closes.
- The parent snapshot is fixed at open time; later parent turns are not visible to the side chat.
- Selection is limited to conversation text; file-preview selections are not covered.
- The draft composer is a plugin component that mirrors the main composer; after sending, the side
  chat uses the native Harness composer.
