import type { FormEvent } from 'react';
import { useEffect, useRef } from 'react';
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
        <section className="mb-4 w-[380px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between px-5 py-4 text-white bg-[var(--color-primary-dark)]">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.16em]">Trợ lý học tập</h2>
              <p className="text-xs text-white/75">Phân tích từ dữ liệu luyện tập của bạn</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20"
              aria-label="Đóng chat"
            >
              ×
            </button>
          </header>

          <div className="h-[420px] space-y-3 overflow-y-auto bg-[var(--color-light)]/25 p-4">
            {messages.length === 0 && (
              <div className="p-4 text-sm bg-white border border-dashed rounded-2xl border-slate-200 text-slate-600">
                Hỏi mình: “Tôi nên ôn gì?”, “Tôi sai nhiều ở đâu?” hoặc “Gần đây tôi có tiến bộ không?”.
              </div>
            )}
            {messages.map((message, index) => (
              <div key={`${message.created_at}-${index}`} className={message.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className={
                    message.role === 'user'
                      ? 'inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl bg-[var(--color-primary)] px-4 py-2 text-sm text-white'
                      : 'inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl bg-white px-4 py-2 text-sm leading-relaxed text-slate-700 shadow-sm'
                  }
                >
                  {message.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs font-bold text-slate-500">Trợ lý đang phân tích...</div>}
            <div ref={messageEndRef} />
          </div>

          <div className="px-4 py-2 bg-white border-t border-slate-100">
            <div className="flex items-center justify-between mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>{rateLimit === null ? 'Giới hạn: 20 câu / 10 phút' : `Còn ${rateLimit} câu trong lượt hiện tại`}</span>
              <button type="button" onClick={() => void clearHistory()} className="text-[var(--color-secondary)] hover:underline">
                Xoá chat
              </button>
            </div>
            {error && <p className="mb-2 text-xs font-semibold text-red-600">{error}</p>}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Nhập câu hỏi học tập..."
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Gửi
              </button>
            </form>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)] text-2xl text-white shadow-2xl transition hover:scale-105 hover:bg-[var(--color-primary-dark)]"
        aria-label="Mở trợ lý học tập"
      >
        💬
      </button>
    </div>
  );
}
