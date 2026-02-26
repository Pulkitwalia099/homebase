import type { ChatMessage } from "@/lib/types";
import { QuoteBubble } from "./QuoteBubble";

interface MessageBubbleProps {
  message: ChatMessage;
  sessionId: string | null;
  onSend?: (msg: string) => void;
  isLast?: boolean;
  isLoading?: boolean;
}

// Max character length for a bullet to become a tappable chip.
// Longer bullets render as prose inside the bubble instead.
const MAX_CHIP_LENGTH = 55;

// Split message into intro text, long descriptive bullets, and short tappable options.
function parseContent(content: string): { intro: string; bullets: string[]; options: string[] } {
  const lines = content.split("\n");
  const firstBullet = lines.findIndex((l) => l.trimStart().startsWith("- "));
  if (firstBullet === -1) return { intro: content, bullets: [], options: [] };

  const intro = lines.slice(0, firstBullet).join("\n").trim();
  const allBullets = lines
    .slice(firstBullet)
    .filter((l) => l.trimStart().startsWith("- "))
    .map((l) => l.replace(/^[\s]*-\s+/, "").replace(/\*\*/g, "").trim());

  // Short items → chips; long items → prose bullets in the bubble
  const options = allBullets.filter((b) => b.length <= MAX_CHIP_LENGTH);
  const bullets = allBullets.filter((b) => b.length > MAX_CHIP_LENGTH);

  return { intro, bullets, options };
}

// Render **bold** markdown as <strong> — everything else is plain text.
function renderBold(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

// Render a block of text with bold support and newlines.
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i, arr) => (
        <span key={i}>
          {renderBold(line)}
          {i < arr.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

export function MessageBubble({ message, sessionId, onSend, isLast, isLoading }: MessageBubbleProps) {
  // Quote bubble overrides normal rendering
  if (message.quoteData && sessionId) {
    return <QuoteBubble quoteData={message.quoteData} sessionId={sessionId} />;
  }

  const isUser = message.role === "user";
  const { intro, bullets, options } = isUser
    ? { intro: message.content, bullets: [], options: [] }
    : parseContent(message.content);
  const hasChips = options.length > 0;
  const hasBullets = bullets.length > 0;
  const hasBubble = !!intro || hasBullets;

  return (
    <div className={`flex items-start gap-3 mb-4 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center flex-shrink-0 text-amber text-xs font-bold mt-0.5">
          HB
        </div>
      )}

      <div className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"} max-w-[80%]`}>
        {/* Main bubble — intro text + any long descriptive bullets as prose */}
        {hasBubble && (
          <div
            className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
              isUser
                ? "bg-navy text-white rounded-tr-sm"
                : "bg-white border border-gray-200 text-navy rounded-tl-sm"
            }`}
          >
            {intro && <RichText text={intro} />}
            {hasBullets && (
              <ul className={`${intro ? "mt-2" : ""} space-y-1.5`}>
                {bullets.map((b, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="flex-shrink-0">•</span>
                    <span>{renderBold(b)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Quick-reply chips — only short options (≤ MAX_CHIP_LENGTH chars) */}
        {hasChips && (
          <div className="flex flex-wrap gap-2">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => onSend?.(opt)}
                disabled={!isLast || isLoading || !onSend}
                className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  isLast && !isLoading && onSend
                    ? "bg-white border-amber/40 text-navy hover:bg-amber-light cursor-pointer"
                    : "bg-gray-50 border-gray-200 text-gray-400 cursor-default"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
