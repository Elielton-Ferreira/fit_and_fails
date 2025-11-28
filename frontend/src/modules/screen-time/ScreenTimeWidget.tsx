import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Book, BookLog } from '../../types'

const todayLocal = () => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().substring(0, 10)
}

const ScreenTimeWidget = () => {
  const navigate = useNavigate()
  const [books, setBooks] = useState<Book[]>([])
  const [logs, setLogs] = useState<BookLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({ title: '', totalPages: '' })
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [pagesRead, setPagesRead] = useState<number>(0)
  const [date, setDate] = useState(() => todayLocal())

  const loadData = async () => {
    try {
      setError('')
      const [bookRes, logRes] = await Promise.all([api.get<Book[]>('/books'), api.get<BookLog[]>('/books/logs/all')])
      setBooks(bookRes.data)
      setLogs(logRes.data)
      if (bookRes.data.length > 0 && !selectedBookId) setSelectedBookId(bookRes.data[0].id)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Não foi possível carregar livros.')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveBook = async () => {
    if (!form.title.trim()) {
      setError('Informe o nome do livro.')
      return
    }
    setLoading(true)
    try {
      const payload = { title: form.title.trim(), totalPages: form.totalPages ? Number(form.totalPages) : undefined }
      const { data } = await api.post<Book>('/books', payload)
      setBooks((prev) => [data, ...prev])
      setForm({ title: '', totalPages: '' })
      if (!selectedBookId) setSelectedBookId(data.id)
      setMessage('Livro salvo ✅')
      setTimeout(() => setMessage(''), 2000)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Não foi possível salvar o livro.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditBook = async (book: Book) => {
    const title = window.prompt('Novo nome do livro:', book.title)
    if (title === null) return
    const totalStr = window.prompt('Total de páginas (opcional):', book.totalPages?.toString() ?? '')
    setLoading(true)
    try {
      const payload: any = { title }
      if (totalStr !== null && totalStr !== '') payload.totalPages = Number(totalStr)
      const { data } = await api.patch<Book>(`/books/${book.id}`, payload)
      setBooks((prev) => prev.map((b) => (b.id === book.id ? data : b)))
      setMessage('Livro atualizado ✅')
      setTimeout(() => setMessage(''), 2000)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Não foi possível atualizar o livro.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBook = async (book: Book) => {
    if (!window.confirm(`Excluir o livro "${book.title}" e seus registros?`)) return
    setLoading(true)
    try {
      await api.delete(`/books/${book.id}`)
      setBooks((prev) => prev.filter((b) => b.id !== book.id))
      setLogs((prev) => prev.filter((l) => l.bookId !== book.id))
      if (selectedBookId === book.id) setSelectedBookId(null)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Não foi possível excluir.')
    } finally {
      setLoading(false)
    }
  }

  const handleLog = async () => {
    if (!selectedBookId) {
      setError('Escolha um livro para registrar.')
      return
    }
    if (!pagesRead || pagesRead <= 0) {
      setError('Informe páginas lidas.')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post<BookLog>(`/books/${selectedBookId}/logs`, {
        pages: pagesRead,
        date: `${date}T12:00:00`
      })
      setLogs((prev) => [data, ...prev])
      setPagesRead(0)
      setMessage('Leitura registrada 📚')
      setTimeout(() => setMessage(''), 1500)
      // redireciona para o feed
      navigate('/dashboard#feed')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Não foi possível registrar.')
    } finally {
      setLoading(false)
    }
  }

  const totalThisWeek = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    return logs
      .filter((l) => new Date(l.date) >= start)
      .reduce((acc, l) => acc + l.pages, 0)
  }, [logs])

  return (
    <section id="screen" className="glass-panel rounded-3xl p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Leitura</p>
          <h3 className="text-2xl font-semibold text-white">Registre páginas lidas</h3>
          <p className="text-sm text-slate-400">Cadastre livros e some sua leitura diária.</p>
        </div>
        <Badge label={`${totalThisWeek} páginas na última semana`} variant="info" />
      </header>

      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      {message && <p className="mt-3 text-sm text-sky-200">{message}</p>}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-300">Cadastrar livro</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Nome do Livro"
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
            />
            <input
              type="number"
              min={0}
              value={form.totalPages}
              onChange={(event) => setForm((prev) => ({ ...prev, totalPages: event.target.value }))}
              placeholder="Total de páginas"
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="mt-3 flex gap-3">
            <Button type="button" onClick={handleSaveBook} disabled={loading}>
              Salvar livro
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-300">Registrar leitura</p>
          <div className="mt-3 grid gap-3">
            <select
              value={selectedBookId ?? ''}
              onChange={(event) => setSelectedBookId(event.target.value || null)}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
            >
              <option value="">Selecione um livro</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title} {book.totalPages ? `• ${book.totalPages} págs` : ''}
                </option>
              ))}
            </select>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              />
              <input
                type="number"
                min={0}
                value={pagesRead}
                onChange={(event) => setPagesRead(Number(event.target.value))}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                placeholder="Páginas lidas"
              />
            </div>
            <Button type="button" onClick={handleLog} disabled={loading}>
              Registrar e publicar no feed
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">Meus livros</p>
        {books.length === 0 && <p className="mt-2 text-sm text-slate-400">Nenhum livro cadastrado.</p>}
        <div className="mt-3 space-y-2">
          {books.map((book) => (
            <div key={book.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              <div>
                <p className="font-semibold">{book.title}</p>
                <p className="text-xs text-slate-400">{book.totalPages ? `${book.totalPages} páginas` : 'Total não informado'}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" className="px-3 py-1 text-xs" onClick={() => handleEditBook(book)}>
                  Editar
                </Button>
                <Button type="button" variant="ghost" className="px-3 py-1 text-xs text-rose-200 hover:text-rose-100" onClick={() => handleDeleteBook(book)}>
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">Histórico de registros</p>
        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
          {logs.length === 0 && <p className="text-sm text-slate-400">Nenhum registro.</p>}
          {logs.map((log) => {
            const label = new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            return (
              <div key={log.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                <div className="flex flex-col">
                  <span className="font-semibold">{log.book.title}</span>
                  <span className="text-xs text-slate-400">{label}</span>
                </div>
                <span className="text-sm font-semibold text-white">{log.pages} págs</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ScreenTimeWidget
