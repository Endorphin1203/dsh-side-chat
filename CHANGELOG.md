# 更新日志

## [0.1.0] - 2026-11-09

首个公开版本。

### 功能

- 在 DSH 对话中选中文字后，可**添加到对话**或**在侧边提问**。
- 侧边提问先打开右侧草稿输入区，不自动启动会话；可多次追加选中片段。
- 草稿以“已选 n 个文本片段”摘要展示，悬浮查看片段内容，悬浮时右侧显示叉号，点叉清除全部片段。
- 草稿输入区沿用主会话样式，提供与主会话一致的“模型 / 强度”两级选择；可跟随主会话，也可单独指定模型和推理等级。
- 发送后以全部片段和问题作为首条上下文启动临时侧边聊天；后续追问使用 Harness 原生 composer。
- 侧边聊天只读：执行 guard 仅允许 `read`、`glob`、`grep`、`read_image`；写入、编辑、shell、Web、子代理、记忆等工具会被拒绝。
- 关闭侧边聊天标签会停止并归档临时会话；界面、会话列表和子代理目录不再显示，刷新不残留。
- `/sidechat` 命令作为 UI→Host 桥写入父会话日志，但其 Chat 命令行展示已隐藏。

### 验证

- `node --test tests/pure.test.js`：16 个测试全部通过。
- 子会话日志验证：首条消息包含选中片段和问题；`bash` 被只读 guard 拒绝，`read`/`glob` 成功；模型/推理等级按草稿选择生效。
- 用户验收：两级模型/强度菜单、样式、关闭标签和刷新均正常。

### 已知限制

- 关闭是归档，不物理删除磁盘上的 session log。
- `/sidechat` 命令事件仍保存在父会话日志中，只是 Chat 行被隐藏；命令本身不记录选中文字（`recordInput: false`）。
- 临时会话是 continuable subagent 子会话，打开期间可能出现在父会话的子代理目录；关闭后归档。
- 父会话快照固定于打开时刻，后续父会话轮次不可见。
- 选中范围仅限对话文本，不覆盖文件预览。
- 草稿输入区是镜像主会话样式的插件组件；发送后使用 Harness 原生 composer。

### 安装

通过 Harness 插件管理器安装本仓库，或从本目录安装：

- 仓库：https://github.com/Endorphin1203/dsh-side-chat
- [中文 README](https://github.com/Endorphin1203/dsh-side-chat/blob/v0.1.0/README.md)
- [English README](https://github.com/Endorphin1203/dsh-side-chat/blob/v0.1.0/README.en.md)
