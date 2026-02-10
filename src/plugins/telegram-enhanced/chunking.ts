// @ts-expect-error - plugin package currently ships without type declarations
import { markdownToTelegramChunks } from "@elizaos/plugin-telegram";

const TELEGRAM_MESSAGE_LIMIT = 4096;
const DEFAULT_HEADROOM = 120;

export type TelegramChunk = {
  html: string;
  text: string;
};

export function smartChunkTelegramText(
  markdown: string,
  maxChars: number = TELEGRAM_MESSAGE_LIMIT - DEFAULT_HEADROOM,
): TelegramChunk[] {
  const safeText = (markdown ?? "").trim();
  if (!safeText) return [];

  const chunks = markdownToTelegramChunks(safeText, maxChars);
  if (Array.isArray(chunks) && chunks.length > 0) {
    return chunks.map((chunk: { html?: string; text?: string }) => ({
      html: chunk.html ?? "",
      text: chunk.text ?? "",
    }));
  }

  return [{ html: safeText, text: safeText }];
}
