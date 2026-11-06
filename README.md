# DSH side chat

Select text in a DeepSeek Harness conversation and choose **Add to chat** or **Ask in side chat**.

- **Add to chat** inserts the selection as a Markdown quote in the current composer.
- **Ask in side chat** opens a temporary chat in the right sidebar. The side chat receives a fixed
  snapshot of the parent conversation, so follow-up questions are answered in context.
- The side chat is read-only: it can use `read`, `glob`, `grep`, and `read_image`, but it cannot
  write, edit, run shell commands, use the web, or spawn agents.
- Closing the side-chat tab stops and archives the temporary session. The UI, session list, and
  subagent catalog stop showing it; DeepSeek Harness keeps an archived session log on disk.

## Install

The plugin is installed through the Harness plugin manager from this directory.

## Configuration

`cordis.patch.yml` exposes:

| Key | Default | Meaning |
| --- | --- | --- |
| `providerName` | `spawn` | Subagent backend used for the temporary child |
| `maxTranscriptChars` | `40000` | Parent-conversation snapshot budget |
| `maxSelectionChars` | `20000` | Maximum selected text |
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
- Opening and closing a side chat each leave a compact `/sidechat` command row in the parent
  conversation. The selected text is not recorded by the command (`recordInput: false`).
- Because the temporary session is a continuable subagent child, it may appear in the parent's
  subagent catalog while open; it is archived when the tab closes.
- The parent snapshot is fixed at open time; later parent turns are not visible to the side chat.
- Selection is limited to conversation text; file-preview selections are not covered.
