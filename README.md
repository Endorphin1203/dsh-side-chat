# DSH side chat

Select text in a DeepSeek Harness conversation and choose **Add to chat** or **Ask in side chat**.

> 在 DeepSeek Harness 对话中选中文字，添加到当前对话，或在只读的临时侧边聊天中追问。

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

## 中文说明

在 DeepSeek Harness 对话中选中文字，可以：

- **添加到对话**：把选中文字作为 Markdown 引用插入当前输入框。
- **在侧边提问**：在右侧栏打开一个草稿输入区。继续选中文字并再次点“在侧边提问”，会把新片段追加到同一草稿；草稿只显示“已选 n 个文本片段”，悬浮时显示片段内容和右侧叉号，点叉清除全部片段。
- 草稿输入区沿用主会话的样式，并提供与主会话一致的“模型 / 强度”两级选择；侧边聊天可以跟随主会话，也可以单独指定模型和推理等级。
- 填写问题并发送后，才会启动右侧的临时侧边聊天；所有已选片段和问题作为首条上下文。之后的追问使用 Harness 原生输入框。
- 侧边聊天是只读的：只允许 `read`、`glob`、`grep`、`read_image`；写入、编辑、shell、Web、子代理、记忆等工具都会被 guard 拒绝。
- 关闭侧边聊天标签会停止并归档临时会话；界面、会话列表和子会话目录不再显示，刷新页面也不会残留。磁盘上仍保留归档日志。
- `/sidechat` 命令仍作为 UI→Host 桥写入父会话日志，但插件隐藏了它在 Chat 中的命令行展示。

### 使用

1. 在对话消息中选中一段文字。
2. 点“添加到对话”插入引用；或点“在侧边提问”打开右侧草稿。
3. 继续选文字并点“在侧边提问”可追加多个片段；悬浮“已选 n 个文本片段”查看内容，点旁边的叉号清除。
4. 在草稿输入区选择模型/强度并填写问题，点发送。
5. 右侧侧边聊天开始回答；后续追问直接使用原生输入框。
6. 关闭侧边聊天标签即可归档临时会话。

### 已知限制

- 关闭是归档隐藏，不物理删除磁盘 session log。
- `/sidechat` 命令事件仍保存在父会话日志中，只是 Chat 行被隐藏；命令本身不记录选中文字（`recordInput: false`）。
- 临时会话是 continuable subagent，打开期间可能出现在父会话的 subagent 目录；关闭后归档。
- 侧边聊天的父对话快照固定于打开时刻，不是实时镜像。
- 选中范围仅限对话区消息，不覆盖文件预览。
- 草稿输入区是镜像主会话样式的插件组件；发送后使用 Harness 原生 composer。

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
