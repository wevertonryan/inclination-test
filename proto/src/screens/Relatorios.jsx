import { useMemo, useState } from 'react'
import { ScreenHeader } from '../components/ScreenHeader.jsx'
import Modal from '../components/Modal.jsx'
import { SearchIcon, FunnelIcon } from '../components/icons.jsx'
import '../components/ScreenHeader.css'
import '../components/Modal.css'
import './Relatorios.css'

const pad2 = (n) => String(n).padStart(2, '0')

const emptyFilters = () => ({
  dateFrom: '',
  dateTo: '',
  locs: [],
  timeMin: '',
  timeMax: '',
})

function fmtDate(iso) {
  const d = new Date(iso)
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`
}

function dateKey(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
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
  const [draft, setDraft] = useState(emptyFilters)
  const [applied, setApplied] = useState(emptyFilters)

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
    if (applied.dateFrom) {
      list = list.filter((r) => dateKey(r.date) >= applied.dateFrom)
    }
    if (applied.dateTo) {
      list = list.filter((r) => dateKey(r.date) <= applied.dateTo)
    }
    if (applied.locs.length) {
      list = list.filter((r) => applied.locs.includes(r.location))
    }
    if (applied.timeMin !== '') {
      list = list.filter((r) => r.durationMs >= Number(applied.timeMin) * 1000)
    }
    if (applied.timeMax !== '') {
      list = list.filter((r) => r.durationMs <= Number(applied.timeMax) * 1000)
    }
    return list
  }, [reports, query, applied])

  const hasQuery = query.trim().length > 0
  const hasFilters =
    applied.dateFrom !== '' ||
    applied.dateTo !== '' ||
    applied.locs.length > 0 ||
    applied.timeMin !== '' ||
    applied.timeMax !== ''
  const searching = hasQuery || hasFilters

  function toggleDraft(key, value) {
    setDraft((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }))
  }

  function setDraftField(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function resetFilters() {
    setDraft(emptyFilters())
    setApplied(emptyFilters())
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
            onClick={() => {
              setDraft(applied)
              setFilterOpen(true)
            }}
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
          <div className="filter-range">
            <label className="filter-field">
              <span>De</span>
              <input
                type="date"
                className="filter-field__input"
                value={draft.dateFrom}
                max={draft.dateTo || undefined}
                onChange={(e) => setDraftField('dateFrom', e.target.value)}
              />
            </label>
            <label className="filter-field">
              <span>Até</span>
              <input
                type="date"
                className="filter-field__input"
                value={draft.dateTo}
                min={draft.dateFrom || undefined}
                onChange={(e) => setDraftField('dateTo', e.target.value)}
              />
            </label>
          </div>
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
          <div className="filter-range">
            <label className="filter-field">
              <span>Mínimo (s)</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                className="filter-field__input"
                placeholder="0"
                value={draft.timeMin}
                onChange={(e) => setDraftField('timeMin', e.target.value)}
              />
            </label>
            <label className="filter-field">
              <span>Máximo (s)</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                className="filter-field__input"
                placeholder="Sem limite"
                value={draft.timeMax}
                onChange={(e) => setDraftField('timeMax', e.target.value)}
              />
            </label>
          </div>
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