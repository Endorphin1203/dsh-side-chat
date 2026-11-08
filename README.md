# DSH 侧边聊天

在 DeepSeek Harness 对话中选中文字，选择 **添加到对话** 或 **在侧边提问**。

**语言 / Language：** [中文](README.md) | [English](README.en.md)

## 功能

- **添加到对话**：把选中文字作为 Markdown 引用插入当前输入框。
- **在侧边提问**：在右侧栏打开一个草稿输入区。继续选中文字并再次点“在侧边提问”，会把新片段追加到同一草稿；草稿只显示“已选 n 个文本片段”，悬浮时显示片段内容和右侧叉号，点叉清除全部片段。
- 草稿输入区沿用主会话的样式，并提供与主会话一致的“模型 / 强度”两级选择；侧边聊天可以跟随主会话，也可以单独指定模型和推理等级。
- 填写问题并发送后，才会启动右侧的临时侧边聊天；所有已选片段和问题作为首条上下文。之后的追问使用 Harness 原生 composer（输入框）。
- 侧边聊天是只读的：只允许 `read`、`glob`、`grep`、`read_image`；写入、编辑、shell、Web、子代理、记忆等工具都会被 guard 拒绝，即使它们出现在模型的工具列表中。
- 关闭侧边聊天标签会停止并归档临时会话；界面、会话列表和子代理（subagent）目录不再显示，刷新页面也不会残留。磁盘上仍保留归档日志。
- `/sidechat` 命令仍作为 UI→Host 桥写入父会话日志，但插件隐藏了它在 Chat 中的命令行展示。

## 安装

插件通过 Harness 插件管理器从本目录安装。

## 配置

`cordis.patch.yml` 暴露以下配置：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `providerName` | `spawn` | 临时子会话使用的 subagent 后端 |
| `maxTranscriptChars` | `40000` | 父会话快照的字符预算 |
| `maxSelectionChars` | `20000` | 选中文本总长度上限 |
| `maxQuestionChars` | `4000` | 问题长度上限 |
| `readOnlyTools` | `read`, `glob`, `grep`, `read_image` | 允许模型使用的工具 |
| `systemPromptOrder` | `900` | 侧边聊天上下文的提示词段落顺序 |

## 开发

```bash
node --test tests/pure.test.js
node --check index.js lib/host.js lib/pure.js client.js tests/pure.test.js
```

## 已知限制

- 关闭是归档，不是物理删除磁盘上的 session log。
- `/sidechat` 命令事件仍保存在父会话日志中，只是 Chat 行被隐藏；命令本身不记录选中文字（`recordInput: false`）。
- 临时会话是 continuable subagent 子会话，打开期间可能出现在父会话的子代理目录；关闭后归档。
- 父会话快照固定于打开时刻，后续父会话轮次不可见。
- 选中范围仅限对话文本，不覆盖文件预览。
- 草稿输入区是镜像主会话样式的插件组件；发送后使用 Harness 原生 composer。
