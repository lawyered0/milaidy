/**
 * Conversations Sidebar — Left sidebar for managing chat conversations.
 *
 * Shows a "New Chat" button and a list of conversations sorted by most recent.
 * Dispatches events for conversation selection, creation, rename, and delete.
 */

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Conversation } from "./api-client.js";

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

@customElement("conversations-sidebar")
export class ConversationsSidebar extends LitElement {
  @property({ type: Array }) conversations: Conversation[] = [];
  @property({ type: String }) activeId: string | null = null;
  @state() private renamingId: string | null = null;
  @state() private renameValue = "";

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 240px;
      min-width: 240px;
      border-right: 1px solid var(--border);
      background: var(--bg);
      overflow-y: auto;
      font-size: 13px;
    }

    .sidebar-header {
      padding: 12px;
      border-bottom: 1px solid var(--border);
    }

    .new-chat-btn {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--accent);
      color: var(--accent-foreground);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.15s;
    }

    .new-chat-btn:hover {
      opacity: 0.9;
    }

    .conv-list {
      flex: 1;
      overflow-y: auto;
      padding: 4px 0;
    }

    .conv-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      cursor: pointer;
      transition: background 0.1s;
      gap: 8px;
      border-left: 3px solid transparent;
    }

    .conv-item:hover {
      background: var(--bg-hover);
    }

    .conv-item.active {
      background: var(--bg-hover);
      border-left-color: var(--accent);
    }

    .conv-info {
      flex: 1;
      min-width: 0;
    }

    .conv-title {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text);
      font-size: 13px;
    }

    .conv-time {
      font-size: 11px;
      color: var(--muted);
      margin-top: 2px;
    }

    .conv-delete {
      opacity: 0;
      border: none;
      background: none;
      color: var(--muted);
      cursor: pointer;
      font-size: 14px;
      padding: 2px 4px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .conv-item:hover .conv-delete {
      opacity: 1;
    }

    .conv-delete:hover {
      color: var(--destructive);
      background: var(--destructive-subtle);
    }

    .rename-input {
      width: 100%;
      padding: 4px 6px;
      border: 1px solid var(--accent);
      border-radius: 4px;
      background: var(--card);
      color: var(--text);
      font-size: 13px;
      outline: none;
    }

    .empty-state {
      padding: 24px 12px;
      text-align: center;
      color: var(--muted);
      font-size: 12px;
    }
  `;

  private handleNew() {
    this.dispatchEvent(new CustomEvent("new-conversation", { bubbles: true, composed: true }));
  }

  private handleSelect(id: string) {
    if (this.renamingId === id) return;
    this.dispatchEvent(
      new CustomEvent("select-conversation", {
        detail: { id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleDelete(e: Event, id: string) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("delete-conversation", {
        detail: { id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private startRename(e: Event, conv: Conversation) {
    e.stopPropagation();
    e.preventDefault();
    this.renamingId = conv.id;
    this.renameValue = conv.title;
  }

  private finishRename() {
    if (this.renamingId && this.renameValue.trim()) {
      this.dispatchEvent(
        new CustomEvent("rename-conversation", {
          detail: { id: this.renamingId, title: this.renameValue.trim() },
          bubbles: true,
          composed: true,
        }),
      );
    }
    this.renamingId = null;
    this.renameValue = "";
  }

  private handleRenameKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      this.finishRename();
    } else if (e.key === "Escape") {
      this.renamingId = null;
      this.renameValue = "";
    }
  }

  render() {
    return html`
      <div class="sidebar-header">
        <button class="new-chat-btn" @click=${this.handleNew}>+ New Chat</button>
      </div>
      <div class="conv-list">
        ${this.conversations.length === 0
          ? html`<div class="empty-state">No conversations yet</div>`
          : this.conversations.map(
              (conv) => html`
                <div
                  class="conv-item ${conv.id === this.activeId ? "active" : ""}"
                  @click=${() => this.handleSelect(conv.id)}
                  @dblclick=${(e: Event) => this.startRename(e, conv)}
                >
                  <div class="conv-info">
                    ${this.renamingId === conv.id
                      ? html`
                          <input
                            class="rename-input"
                            .value=${this.renameValue}
                            @input=${(e: Event) => {
                              this.renameValue = (e.target as HTMLInputElement).value;
                            }}
                            @blur=${() => this.finishRename()}
                            @keydown=${this.handleRenameKeydown}
                            @click=${(e: Event) => e.stopPropagation()}
                          />
                        `
                      : html`
                          <div class="conv-title">${conv.title}</div>
                          <div class="conv-time">${relativeTime(conv.updatedAt)}</div>
                        `}
                  </div>
                  <button
                    class="conv-delete"
                    @click=${(e: Event) => this.handleDelete(e, conv.id)}
                    title="Delete conversation"
                  >
                    &times;
                  </button>
                </div>
              `,
            )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "conversations-sidebar": ConversationsSidebar;
  }
}
