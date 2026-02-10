// Phase 2 placeholder.
// Draft message editing stream will be added in a follow-up PR.

export type TelegramDraftStream = {
  update: (text: string) => void;
  flush: () => Promise<void>;
  stop: () => void;
};

export function createTelegramDraftStream(): TelegramDraftStream {
  return {
    update: () => {},
    flush: async () => {},
    stop: () => {},
  };
}
