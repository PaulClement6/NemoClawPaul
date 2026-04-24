import { AgentRole, ConversationMessage } from "../types";

/**
 * Manages conversation state for a single customer interaction.
 * Tracks the message history, the currently active agent, and
 * provides serialisation for persistence / debugging.
 */
export class Session {
  public readonly sessionId: string;
  public readonly customerId: string | undefined;
  public currentAgent: AgentRole;
  public messages: ConversationMessage[];
  public readonly createdAt: Date;

  constructor(sessionId: string, customerId?: string) {
    this.sessionId = sessionId;
    this.customerId = customerId;
    this.currentAgent = "triage";
    this.messages = [];
    this.createdAt = new Date();
  }

  /** Append a message to the conversation history. */
  addMessage(msg: ConversationMessage): void {
    this.messages.push(msg);
  }

  /** Return a shallow copy of the conversation history. */
  getHistory(): ConversationMessage[] {
    return [...this.messages];
  }

  /**
   * Switch the active agent for this session.
   * Logs the transition and inserts a system message so the new agent
   * has context about the hand-off.
   */
  switchAgent(role: AgentRole): void {
    const previous = this.currentAgent;
    this.currentAgent = role;

    console.log(
      `[Session ${this.sessionId}] Agent switch: ${previous} → ${role}`
    );

    this.addMessage({
      role: "system",
      content: `[Handoff] Conversation transferred from ${previous} agent to ${role} agent.`,
    });
  }

  /** Return a plain-object representation suitable for JSON.stringify. */
  toJSON(): object {
    return {
      sessionId: this.sessionId,
      customerId: this.customerId,
      currentAgent: this.currentAgent,
      messages: this.messages,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
