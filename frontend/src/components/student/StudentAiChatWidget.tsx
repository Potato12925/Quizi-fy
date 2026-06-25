import type { FormEvent } from 'react';
import { useEffect, useRef } from 'react';

import { Bot, Send, Trash2, X } from 'lucide-react';
import { useStudentAiChat } from '@/hooks/use_student_ai_chat';

export default function StudentAiChatWidget() {
  const {
    messages,
    input,
    setInput,
    loading,
    error,
    isOpen,
    setIsOpen,
    rateLimit,
    sendMessage,
    clearHistory,
  } = useStudentAiChat();
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 72) + 'px';
  };

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  return (
    <div className="fixed z-50 bottom-6 right-6">
      {isOpen && (
        <section className="mb-4 w-[456px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between px-5 py-4 text-white bg-[var(--color-primary)]">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.16em]">Trợ lý học tập</h2>
              <p className="text-xs text-white/75">Phân tích từ dữ liệu luyện tập của bạn</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void clearHistory()}
                className="flex items-center justify-center w-9 h-9 text-white/70 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
                aria-label="Xoá lịch sử chat"
                title="Xoá lịch sử chat"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-9 h-9 text-white/70 hover:text-white hover:bg-white/15 rounded-lg transition-colors"
                aria-label="Đóng chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="h-[420px] space-y-3 overflow-y-auto bg-[var(--color-light)]/10 p-4">
            {messages.length === 0 && (
              <div className="p-4 text-base bg-white border border-dashed rounded-2xl border-slate-200 text-slate-600">
                Hỏi mình: “Tôi nên ôn gì?”, “Tôi sai nhiều ở đâu?” hoặc “Gần đây tôi có tiến bộ không?”.
              </div>
            )}
            {messages.map((message, index) => (
              <div key={`${message.created_at}-${index}`} className={message.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className={
                    message.role === 'user'
                      ? 'inline-block max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-[var(--color-primary)]/90 px-4 py-2.5 text-base text-white'
                      : 'inline-block max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-white px-4 py-2.5 text-base leading-relaxed text-slate-700 shadow-sm'
                  }
                >
                  {message.content}
                </div>
                {message.role === 'assistant' && message.actions && message.actions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.actions.map((action) => (
                      <button
                        key={action.type}
                        type="button"
                        className="rounded-full border border-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="text-sm font-bold text-slate-500">Trợ lý đang phân tích...</div>}
            <div ref={messageEndRef} />
          </div>

          <div className="px-4 py-2 bg-white border-t border-slate-100">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {rateLimit === null ? 'Giới hạn: 20 câu / 10 phút' : `Còn ${rateLimit} câu trong lượt hiện tại`}
            </div>
            {error && <p className="mb-2 text-xs font-semibold text-red-600">{error}</p>}
            <form onSubmit={handleSubmit} className="flex items-stretch gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => { setInput(event.target.value); setTimeout(autoResizeTextarea, 0); }}
                onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }}
                placeholder="Nhập câu hỏi học tập..."
                rows={1}
                className="flex-1 resize-none no-scrollbar rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-[var(--color-primary)] disabled:bg-slate-50"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex shrink-0 items-center justify-center rounded-2xl text-slate-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-light)]/40 px-4 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Send className="h-6 w-6" />
              </button>
            </form>
          </div>
        </section>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)] text-2xl text-white shadow-xl transition hover:scale-105 hover:bg-[var(--color-primary-dark)]"
          aria-label="Mở trợ lý học tập"
        >
          <Bot className="h-7 w-7" />
        </button>
      )}
    </div>
  );
}
