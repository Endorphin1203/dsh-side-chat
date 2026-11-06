/**
 * Host half of the side-chat plugin.
 *
 * The command, child-session lifecycle, and read-only policy live in
 * `lib/host.js`; this entry only wires them into the Host context.
 */
export const name = 'side-chat'

/** Host services required by the side-chat lifecycle. */
export const inject = ['commands', 'subagents', 'tools', 'systemPrompt']

/** Placeholder Host body; the lifecycle is implemented in Task 2. */
export function apply() {}
