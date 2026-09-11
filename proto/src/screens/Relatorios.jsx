import { useMemo, useState } from 'react'
import { ScreenHeader } from '../components/ScreenHeader.jsx'
import Modal from '../components/Modal.jsx'
import { SearchIcon, FunnelIcon } from '../components/icons.jsx'
import '../components/ScreenHeader.css'
import '../components/Modal.css'
import './Relatorios.css'

const TIME_RANGES = [
  { id: 'short', label: 'Até 30s', test: (ms) => ms <= 30000 },
  { id: 'mid', label: '30s – 1min', test: (ms) => ms > 30000 && ms <= 60000 },
  { id: 'long', label: '≥ 1min', test: (ms) => ms > 60000 },
]

const pad2 = (n) => String(n).padStart(2, '0')

function fmtDate(iso) {
  const d = new Date(iso)
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`
}

function distinct(values) {
  return [...new Set(values)]
}

function ReportCard({ report, onClick }) {
  return (
    <button type="button" className="report-card" onClick={onClick}>
      <div className="report-card__main">
        <span className="report-card__title">{report.title}</span>
        <span className="report-card__date">{fmtDate(report.date)}</span>
      </div>
      <span className="report-card__location">
        {report.location || '—'}
      </span>
    </button>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      className={`filter-chip ${active ? 'filter-chip--active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function FilterGroup({ title, children }) {
  return (
    <div className="filter-group">
      <span className="filter-group__title">{title}</span>
      <div className="filter-group__chips">{children}</div>
    </div>
  )
}

function Relatorios({ reports, onOpenReport }) {
  const [query, setQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [draft, setDraft] = useState({ dates: [], locs: [], times: [] })
  const [applied, setApplied] = useState({ dates: [], locs: [], times: [] })

  const dateOptions = useMemo(
    () => distinct(reports.map((r) => fmtDate(r.date))),
    [reports],
  )
  const locOptions = useMemo(
    () => distinct(reports.map((r) => r.location).filter(Boolean)),
    [reports],
  )

  const filtered = useMemo(() => {
    let list = reports
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (r) =>
          (r.title || '').toLowerCase().includes(q) ||
          (r.location || '').toLowerCase().includes(q),
      )
    }
    if (applied.dates.length) {
      list = list.filter((r) => applied.dates.includes(fmtDate(r.date)))
    }
    if (applied.locs.length) {
      list = list.filter((r) => applied.locs.includes(r.location))
    }
    if (applied.times.length) {
      list = list.filter((r) =>
        applied.times.some((id) =>
          TIME_RANGES.find((t) => t.id === id).test(r.durationMs),
        ),
      )
    }
    return list
  }, [reports, query, applied])

  const hasQuery = query.trim().length > 0
  const hasFilters =
    applied.dates.length > 0 || applied.locs.length > 0 || applied.times.length > 0
  const searching = hasQuery || hasFilters

  function toggleDraft(key, value) {
    setDraft((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }))
  }

  function resetFilters() {
    setDraft({ dates: [], locs: [], times: [] })
    setApplied({ dates: [], locs: [], times: [] })
  }

  return (
    <>
      <ScreenHeader title="Relatórios" />
      <div className="rep-body">
        <div className="rep-search">
          <div className="rep-search__field">
            <SearchIcon className="rep-search__icon" />
            <input
              className="rep-search__input"
              type="search"
              placeholder="Buscar relatórios"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="rep-funnel"
            onClick={() => setFilterOpen(true)}
            aria-label="Filtrar"
          >
            <FunnelIcon />
          </button>
        </div>

        <span className="rep-label">
          {searching ? 'Relatórios pesquisados/filtrados' : 'Todos os relatórios'}
        </span>

        {filtered.length > 0 ? (
          <div className="rep-list">
            {filtered.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onClick={() => onOpenReport(report.id)}
              />
            ))}
          </div>
        ) : (
          <div className="rep-empty">Nenhum relatório encontrado</div>
        )}
      </div>

      <Modal open={filterOpen} backdrop onClose={() => setFilterOpen(false)}>
        <h2 className="modal__title">Filtrar relatórios</h2>
        <FilterGroup title="Data">
          {dateOptions.map((d) => (
            <FilterChip
              key={d}
              label={d}
              active={draft.dates.includes(d)}
              onClick={() => toggleDraft('dates', d)}
            />
          ))}
        </FilterGroup>
        <FilterGroup title="Localização">
          {locOptions.map((loc) => (
            <FilterChip
              key={loc}
              label={loc}
              active={draft.locs.includes(loc)}
              onClick={() => toggleDraft('locs', loc)}
            />
          ))}
        </FilterGroup>
        <FilterGroup title="Tempo gravado">
          {TIME_RANGES.map((t) => (
            <FilterChip
              key={t.id}
              label={t.label}
              active={draft.times.includes(t.id)}
              onClick={() => toggleDraft('times', t.id)}
            />
          ))}
        </FilterGroup>
        <div className="modal__actions">
          <button
            type="button"
            className="modal__btn modal__btn--ghost"
            onClick={resetFilters}
          >
            Limpar
          </button>
          <button
            type="button"
            className="modal__btn modal__btn--primary"
            onClick={() => {
              setApplied(draft)
              setFilterOpen(false)
            }}
          >
            Aplicar
          </button>
        </div>
      </Modal>
    </>
  )
}

export default Relatorios