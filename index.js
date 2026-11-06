import { createSideChatHost } from './lib/host.js'

/**
 * Host half of the side-chat plugin.
 *
 * The command, child-session lifecycle, and read-only policy live in
 * `lib/host.js`; this entry only wires them into the Host context.
 */
export const name = 'side-chat'

/** Host services required by the side-chat lifecycle. */
export const inject = ['commands', 'subagents', 'tools', 'systemPrompt']

/**
 * Register the side-chat command and per-agent setup listener.
 * @param {object} ctx - Host context.
 * @param {object} [config] - plugin configuration from cordis.patch.yml.
 */
export function apply(ctx, config = {}) {
  const host = createSideChatHost(ctx, config)

  ctx.effect(() => ctx.commands.register({
    name: 'sidechat',
    description: 'Open or close a temporary read-only side chat',
    recordInput: false,
    handler: invocation => host.command(invocation),
  }), 'side-chat: command')

  ctx.on('agent/created', ({ agent }) => {
    host.onAgentCreated(agent)
  })

  ctx.effect(() => () => host.disposeAll(), 'side-chat: records')
}
