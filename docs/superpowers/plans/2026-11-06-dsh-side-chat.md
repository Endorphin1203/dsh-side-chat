# DSH 侧边临时会话追问插件实现计划

**Goal:** 在主对话中选中文字后，提供“添加到当前对话 / 在侧边聊天中提问”两个动作；侧边打开一个只读、带主对话快照上下文的临时会话，关闭标签后从界面和会话列表中消失。

**Architecture:** 本地 DSH bundle（Host + Client 双半，无构建步骤）。Host 注册 `sidechat` 会话命令，用 `ctx.subagents.startActivation` 创建 `spawn` 子会话，并在 `agent/created` 中把它限制为只读工具、注入主对话快照系统提示。Client 替换/扩展 `conversation.chat.text-interaction` 的 `quote` 表面，增加两个动作和问题弹窗；通过 `ctx.remote.commands.execute` 调 Host，再通过 `ctx.sidebarRight.openResource` 打开 Harness 自带的 `subagentchat` 右侧聊天标签；关闭标签时用 `openTabs` 观察器调 `/sidechat {action:"end"}` 清理并归档。

**Tech Stack:** DSH Cordis bundle（ESM Host + 浏览器 module loader Client）、React 18、Node `node:test`、git、GitHub CLI。

**Spec:** 本次会话用户需求（2026-11-06）；已确认：只选对话区消息文字；添加到对话 = 插入引用块；关闭 = 归档隐藏（磁盘日志保留）；GitHub 仓库 = public `dsh-side-chat`（账号 Endorphin1203）。

## 已确认的产品决策

- 选中范围：只限对话区消息文本，不做文件预览/其他工作区文本。
- “添加到当前对话”：插入为引用块到输入框，由用户确认后发送；沿用现有 `inputActions.insertQuote`。
- 关闭后清理：归档隐藏即可；界面、会话列表、子会话目录中消失，但受 DSH 追加式日志限制，磁盘上保留归档记录（不物理删除）。
- 远端仓库：public，名称 `dsh-side-chat`，owner `Endorphin1203`，默认分支 `main`，远端名 `origin`。

## 目标与成功标准

1. 工作区完成 `git init`、初始 commit，并成功创建/推送公开 GitHub 仓库；最终报告仓库 URL。
2. 在主对话消息中选中文字，出现 `添加到对话`、`在侧边提问` 两个动作；原有引用能力不被破坏。
3. 点“添加到对话”后文字以 Markdown 引用块进入输入框，可编辑后发送。
4. 点“在侧边提问”后出现小弹窗，展示选中片段和问题输入框；提交后右侧打开临时聊天标签。
5. 侧边聊天首条消息包含选中片段和问题；回答能引用主对话上下文，不被当成全新问题。
6. 侧边聊天拥有自己的后续上下文；主会话可同时运行，互不覆盖。
7. 侧边聊天只有 `read` / `glob` / `grep` / `read_image` 四个只读工具；没有写入、shell、Web、子代理、记忆等能力。
8. 关闭侧边聊天标签后，Host 停止子会话并归档；标签、会话列表、主会话子会话目录中不再出现（磁盘归档记录保留）。
9. 浏览器刷新后已打开的侧边聊天仍可继续；关闭时仍能清理。
10. 不新增服务器；安装后刷新现有 `http://127.0.0.1:60552` 页面验证。

## 数据流

1. 用户选中消息文字；`message-quotes` 的 `quote` interaction 调用 `request.open()`，渲染 `conversation.chat.text-interaction` 的 `quote` key。
2. Client 组件替换 `quote` key 的渲染，保留原引用按钮并增加“在侧边提问”；另注册 `side-chat` key 作为后备。
3. 点“在侧边提问”：把 `{sessionId, text}` 写入插件内问题 store，清空选区并关闭表面；`shell.overlay` 中的问题弹窗出现。
4. 弹窗提交：Client 生成 `childSessionId = session-sidechat-<uuid>` 和 label，调用 `ctx.remote.commands.execute(sessionId, '/sidechat <json>', [])`。
5. Host 命令校验 payload，取 `invocation.agent` 为主会话，`agent.session.deriveMessages()` 生成主对话快照文本；用 `ctx.subagents.startActivation` 创建 `spawn` 子会话（预先指定 childId）。
6. `agent/created` 串行监听器在子会话第一次请求前：`tools.restrict({allow})`、`tools.guard` 拒绝所有非白名单工具、`systemPrompt.section({interpolate:false})` 注入只读角色 + 主对话快照；子会话收到首条 user prompt（选中片段 + 问题）并开始回答。
7. Client 收到成功结果后拼 `dsh-resource://subagentchat/session/<child>?parent=<parent>&mode=continuable`，`ctx.sidebarRight.openResource(address, {kind:'subagentchat', preferNewPane:true})` 打开右侧聊天标签；`ui-subagent` 提供该标签类型和 `sidebar.chat.conversation` 对话面板。
8. 后续追问由右侧聊天标签的标准 composer 直接发给子会话；子会话自己的 session log 提供上下文。主会话日志不写入侧边内容。
9. 关闭标签：`ctx.sidebarRight.openTabs` 中该地址消失；Client 调 `/sidechat {action:"end", childSessionId}`；Host `activation.dispose()` + `subagents.interrupt` + `workspaceRegistry.archiveSession(childId,{stopActivity:true})`，删除 Host 记录；Client 删除 localStorage 跟踪记录。

## 公共契约

### Host 命令

```js
{
  name: 'sidechat',
  description: 'Open or close a temporary read-only side chat',
  recordInput: false,
  handler: async ({ agent, rawInput, signal }) => CommandResult
}
```

打开 payload：

```json
{"action":"open","childSessionId":"session-sidechat-<uuid>","selection":"...","question":"...","label":"侧边聊天 · ..."}
```

结束 payload：

```json
{"action":"end","childSessionId":"session-sidechat-<uuid>"}
```

命令名 `sidechat` 会出现在 `/` 菜单中；这是已知 UI 副作用。

### 子会话 ID 与地址

- `childSessionId`：`session-sidechat-` + `crypto.randomUUID()`；Host 用严格 v4 UUID 正则校验。
- 右侧标签地址：`dsh-resource://subagentchat/session/<encodeURIComponent(childSessionId)>?parent=<encodeURIComponent(parentSessionId)>&mode=continuable`。
- 使用 Harness 自带 `@deepseek-ai/dsh-client-ui-subagent` 的 `subagentchat` tab 类型及其 `sidebar.chat.conversation` 面板。

### Client 注册面

- `conversation.chat.text-interaction`：key `quote` priority 100 locale `sideChat`（替换 `message-quotes` 的 action，保留引用行为）；key `side-chat` priority 100。
- `ctx.uiConversation.interactions.register({ id:'side-chat', ... })` 后备。
- `shell.overlay`：`{ id:'side-chat-question', order:50 }`。
- 选中表面沿用原引用组件的 enabled 判断；当前会话是 subagent 时只显示“添加到对话”。

### Host 只读限制

- 白名单：`read`、`glob`、`grep`、`read_image`。
- `agent/created` 中：过滤实际注册的全局工具；`tools.restrict({ allow })`；`tools.guard` 拒绝所有非白名单工具（含 scoped 工具）；`systemPrompt.section({name:'side-chat:context',order:900,text,interpolate:false})`。
- 子会话继承主会话的 provider/model/cwd；不新增 session event 类型。

### 系统提示与首条消息

系统提示含只读角色、主对话快照、数据非指令声明；快照用 `agent.session.deriveMessages()` 只保留 user/assistant 的 text blocks，默认最多 40000 字符，超出从最旧丢弃并加 `[Earlier conversation omitted]`。

首条 user prompt：

```text
I selected this excerpt from the parent conversation:

> {selection 每一行加 "> " 前缀}

Question: {question}
```

问题为空时默认 `Explain this excerpt in the context of the conversation.`。

### 结束与归档

- 有记录：`activation.dispose()` → `subagents.interrupt(childId,{kind:'user',parentSessionId:agent.id})` → `workspaceRegistry.archiveSession(childId,{stopActivity:true})` → 删除记录。
- 无记录：读 header，只有 `origin:'subagent'`、`parentSession: agent.id`、childId 前缀匹配时才允许清理；否则拒绝。
- 归档失败只记日志，返回 success。

### Client 跟踪

- localStorage key `dsh.side-chat.tabs.v1`；记录 `{address, childSessionId, parentSessionId, label, openedAt}`。
- 启动恢复；`openTabs` 订阅；地址不在 open 中且超过 2 秒宽限 → end；打开后 2.5 秒 reconcile 定时器。
- 关闭后删除记录；只存 IDs，不存内容。

## 文件结构

```text
dsh-side-chat/
  .gitignore
  package.json
  cordis.patch.yml
  index.js
  lib/pure.js
  lib/host.js
  client.js
  locale/en.json
  locale/zh.json
  icon.svg
  tests/pure.test.js
  README.md
  docs/superpowers/plans/2026-11-06-dsh-side-chat.md
```

## 实施任务

### Task 0: git + GitHub + 计划落盘

- [ ] `.gitignore`、本计划落盘。
- [ ] `git init -b main`；`git add . && git commit -m "chore: initialize dsh-side-chat plugin workspace"`。
- [ ] `gh repo create dsh-side-chat --public --source=. --remote=origin --push`。
- [ ] `gh repo view Endorphin1203/dsh-side-chat --json name,visibility,defaultBranchRef,url`；`git remote -v`；`git status --short` 干净。
- [ ] 失败时保留本地 commit，报告，不破坏性重试。

### Task 1: Bundle 骨架 + 纯函数 + 单元测试

- [ ] 写失败测试 `tests/pure.test.js`：`formatTranscript`、`buildSideChatPrompt`、`normalizeOpenPayload`、`isSideChatId`、`normalizeEndPayload`、`buildLabel`。
- [ ] 运行 `node --test tests/pure.test.js` 确认失败。
- [ ] 实现 `lib/pure.js`。
- [ ] 运行测试通过；`node --check`。
- [ ] 写 `package.json`、`cordis.patch.yml`、locale、icon、README 骨架。
- [ ] commit + push。

### Task 2: Host 命令、子会话创建、只读限制、结束归档

- [ ] `lib/host.js` 记录结构、open、agent/created、end。
- [ ] `index.js` 注册命令、事件、清理。
- [ ] `node --check`；Task 1 测试通过。
- [ ] commit + push。

### Task 3: Client 选中动作 + 问题弹窗

- [ ] `client.js` loader 骨架、locale 字典、选中组件、问题弹窗、表面注册、`openSideChat`。
- [ ] `node --check`；安装后 Slot 检查；手动验证。
- [ ] commit + push。

### Task 4: 右侧标签跟踪与关闭清理

- [ ] localStorage 跟踪、`endSideChat`、reconcile、启动恢复。
- [ ] `node --check`；手动验证关闭/刷新/多个。
- [ ] commit + push。

### Task 5: 安装、Slot 检查、真机验收

- [ ] `plugin_manager install_bundle`。
- [ ] Slot/Config 检查；刷新现有页面。
- [ ] 手动验收；修复；更新 README；commit + push；报告仓库 URL 与验证状态。

## 配置默认值

```yaml
- insert:
    - id: side-chat
      name: '@local/dsh-side-chat'
      config:
        providerName: spawn
        maxTranscriptChars: 40000
        maxSelectionChars: 20000
        maxQuestionChars: 4000
        readOnlyTools: [read, glob, grep, read_image]
        systemPromptOrder: 900
```

## 边界情况与已知限制

- 选中为空/超长、问题超长：明确错误，不创建子会话。
- 主会话是 subagent/removed：隐藏“在侧边提问”，命令层拒绝。
- provider 未注册/没有只读工具：创建失败，返回错误；绝不创建可写侧边会话。
- tab 打开失败：调 end 清理，弹窗显示错误。
- `openTabs` 竞争：2 秒宽限 + 2.5 秒 reconcile。
- Host 重启/浏览器刷新：localStorage 恢复；end 通过 header 校验。
- 归档失败：记日志，标签仍消失。
- 主会话运行中：快照只含已提交消息；选中片段仍进入首条 prompt；主会话不中断。
- 关闭是归档隐藏，不物理删除磁盘 session log。
- 打开/结束各会在主会话留下一个紧凑 `/sidechat` 命令行；`recordInput:false` 应避免选中文字被记录。
- 侧边聊天是 continuable subagent，打开期间可能出现在主会话 subagent catalog/lineage；关闭后归档。
- 自带 `subagentchat` tab 标题优先用子会话投影 label；未加载时可能短暂显示 childId。
- 快照固定于打开时刻，不是实时镜像；Host 插件重载后系统提示可能丢失。
- 只读工具沿用主会话读取范围，不额外限制在 workspace 根。
- GitHub 仓库 public；不要提交凭据、`.env`、个人数据。

## 测试与验收

- `node --test tests/pure.test.js` 全部通过。
- `node --check index.js lib/host.js lib/pure.js client.js tests/pure.test.js` 全部通过。
- 安装返回 `application: applied`；Slot 检查 `quote`/`side-chat`/`shell.overlay`/`subagentchat`。
- 手动：两个动作、引用块、弹窗、侧边首答带主对话上下文、追问、只读拒绝写/shell、关闭归档、刷新、多个侧边聊天、浅色/深色、控制台无 slot crash。
- `git remote -v` 指向 `Endorphin1203/dsh-side-chat`；`gh repo view` 显示 public。

## 回滚

- `plugin_manager remove_bundle`；刷新页面；清理 localStorage `dsh.side-chat.tabs.v1`。
- 已创建侧边子会话先 `/sidechat {action:"end"}` 归档。
- 确认 `quote` 恢复为 `message-quotes` action；如未恢复，刷新页面。
- GitHub 仓库删除是破坏性操作，只有用户明确要求时才执行，并再次确认。
