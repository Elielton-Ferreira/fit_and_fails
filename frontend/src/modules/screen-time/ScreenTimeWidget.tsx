import { useCallback, useEffect, useState } from 'react'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { ScreenTimeSummary } from '../../types'

const ScreenTimeWidget = () => {
  const [summary, setSummary] = useState<ScreenTimeSummary | null>(null)
  const [pages, setPages] = useState(20)
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10))
  const [message, setMessage] = useState('')
  const [bookTitle, setBookTitle] = useState('Livro atual')
  const [bookPages, setBookPages] = useState(200)
  const [bookSaved, setBookSaved] = useState('')
  const [books, setBooks] = useState<Array<{ title: string; pages: number }>>([])

  const fetchSummary = useCallback(async () => {
    const { data } = await api.get('/screen-time/summary')
    setSummary(data)
  }, [])

  useEffect(() => {
    fetchSummary()
    try {
      const stored = localStorage.getItem('fit-fails-book')
      const storedList = localStorage.getItem('fit-fails-books')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.title) setBookTitle(parsed.title)
        if (parsed.pages) setBookPages(parsed.pages)
      }
      if (storedList) {
        const parsedList = JSON.parse(storedList)
        if (Array.isArray(parsedList)) {
          setBooks(parsedList)
        }
      }
    } catch {
      // ignore
    }
  }, [fetchSummary])

  const saveBook = () => {
    const payload = { title: bookTitle || 'Livro atual', pages: bookPages || 0 }
    setBookTitle(payload.title)
    setBookPages(payload.pages)
    try {
      localStorage.setItem('fit-fails-book', JSON.stringify(payload))
      const nextList = Array.from(new Map([...books, payload].map((b) => [b.title, b])).values())
      setBooks(nextList)
      localStorage.setItem('fit-fails-books', JSON.stringify(nextList))
    } catch {
      // ignore
    }
    setBookSaved('Livro salvo')
    setTimeout(() => setBookSaved(''), 1500)
  }

  const recordLog = async () => {
    await api.post('/screen-time/logs', {
      date,
      minutes: pages,
      bookTitle,
      bookPages
    })
    setMessage('Leitura registrada 📖')
    fetchSummary()
    setTimeout(() => setMessage(''), 2000)
  }

  const share = async () => {
    await api.post('/screen-time/share')
    setMessage('Leitura publicada! 🚀')
    setTimeout(() => setMessage(''), 2000)
  }

  if (!summary) {
    return (
      <section id="screen" className="glass-panel rounded-3xl p-6">
        <p className="text-sm text-slate-400">Calculando suas leituras...</p>
      </section>
    )
  }

  const trendLabel =
    summary.trend === 'down'
      ? 'Menos páginas, desacelerou'
      : summary.trend === 'up'
        ? 'Mais páginas, ótimo ritmo!'
        : 'Ritmo estável — siga assim'

  return (
    <section id="screen" className="glass-panel rounded-3xl p-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Leitura semanal</p>
          <h3 className="text-2xl font-semibold text-white">{summary.current.averageMinutes} páginas/dia</h3>
        </div>
        <Badge
          label={trendLabel}
          variant={summary.trend === 'down' ? 'success' : summary.trend === 'up' ? 'warn' : 'info'}
        />
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr,1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-300">Livro atual</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={bookTitle}
              onChange={(event) => setBookTitle(event.target.value)}
              placeholder="Nome do Livro"
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
            />
            <input
              type="number"
              min={0}
              value={bookPages}
              onChange={(event) => setBookPages(Number(event.target.value))}
              placeholder="Total de páginas"
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Button type="button" variant="secondary" className="px-4 py-2 text-sm" onClick={saveBook}>
              Salvar livro
            </Button>
            {bookSaved && <span className="text-xs text-sky-200">{bookSaved}</span>}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            {bookTitle} • {bookPages} páginas
          </p>
          {books.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {books.map((bk) => (
                <button
                  key={bk.title}
                  type="button"
                  onClick={() => {
                    setBookTitle(bk.title)
                    setBookPages(bk.pages)
                  }}
                  className={[
                    'rounded-full border px-3 py-1 text-xs font-semibold transition',
                    bk.title === bookTitle ? 'border-primary bg-white/10 text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:border-primary'
                  ].join(' ')}
                >
                  {bk.title} • {bk.pages} págs
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-400">Progresso semanal</p>
          <p className="text-3xl font-bold text-white">{summary.current.totalMinutes} páginas</p>
          <p className="text-xs text-slate-500">Média diária {summary.current.averageMinutes} páginas</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 p-4">
          <p className="text-sm text-slate-400">Semana anterior</p>
          <p className="text-3xl font-bold text-white">{summary.previous.totalMinutes} páginas</p>
          <p className="text-xs text-slate-500">Média {summary.previous.averageMinutes} páginas</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 p-4">
          <p className="text-sm text-slate-300">Quantas páginas você leu no dia?</p>
          <div className="mt-3 flex flex-col gap-2">
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
            />
            <input
              type="number"
              min={0}
              value={pages}
              onChange={(event) => setPages(Number(event.target.value))}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
            />
            <Button type="button" onClick={recordLog}>
              Registrar páginas
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          <p className="text-sm text-slate-300">Compartilhe sua leitura</p>
          <p className="mt-2 text-lg font-semibold text-white">
            Você leu {Math.max(summary.improvementMinutes, 0)} páginas nesta semana
            {bookTitle ? ` em "${bookTitle}"` : ''}.
          </p>
          <Button type="button" variant="secondary" onClick={share} disabled={summary.improvementMinutes <= 0} className="mt-4">
            Publicar leitura
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">Histórico de registros</p>
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {summary.current.logs.length === 0 && <p className="text-sm text-slate-500">Nenhum registro recente.</p>}
          {summary.current.logs
            .slice()
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((log) => {
              const label = new Date(log.date).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                >
                  <div className="flex flex-col">
                    <span>{label}</span>
                    {log.bookTitle && <span className="text-xs text-slate-400">{log.bookTitle}</span>}
                  </div>
                  <span className="font-semibold text-white">{log.minutes} págs</span>
                </div>
              )
            })}
        </div>
      </div>

      {message && <p className="mt-4 text-sm text-sky-200">{message}</p>}
    </section>
  )
}

export default ScreenTimeWidget
