import { useState, useMemo, useId } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search, Inbox } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import styles from './DataTable.module.css';

export default function DataTable({
  columns, data, pageSize = 15, searchable = true,
  searchKeys = [], onRowClick, rowActions, emptyText,
  bulkActions, rowKey = 'id', tableLabel = 'Tabla de datos',
}) {
  const { t } = useLanguage();
  const uid = useId();
  const [query, setQuery]     = useState('');
  const [sort, setSort]       = useState({ key: null, dir: 'asc' });
  const [page, setPage]       = useState(1);
  const [selected, setSelected] = useState(new Set());

  const filtered = useMemo(() => {
    let rows = [...data];
    if (query && searchKeys.length) {
      const q = query.toLowerCase();
      rows = rows.filter(r => searchKeys.some(k => String(r[k] ?? '').toLowerCase().includes(q)));
    }
    if (sort.key) {
      rows.sort((a, b) => {
        const va = a[sort.key] ?? '', vb = b[sort.key] ?? '';
        const cmp = String(va).localeCompare(String(vb), 'es', { numeric: true });
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [data, query, sort, searchKeys]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageData    = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (key) => {
    setSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
    setPage(1);
  };

  const allSelected = pageData.length > 0 && pageData.every(r => selected.has(r[rowKey]));
  const toggleAll   = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) pageData.forEach(r => next.delete(r[rowKey]));
      else             pageData.forEach(r => next.add(r[rowKey]));
      return next;
    });
  };
  const toggleRow = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const SortIcon = ({ colKey, label }) => {
    if (sort.key !== colKey) return <ChevronsUpDown size={12} className={styles.sortIcon} aria-hidden="true" />;
    const isAsc = sort.dir === 'asc';
    return (
      <>
        <span className="sr-only">{isAsc ? t('common.sortAsc', { col: label }) : t('common.sortDesc', { col: label })}</span>
        {isAsc
          ? <ChevronUp size={12} className={`${styles.sortIcon} ${styles.active}`} aria-hidden="true" />
          : <ChevronDown size={12} className={`${styles.sortIcon} ${styles.active}`} aria-hidden="true" />
        }
      </>
    );
  };

  const searchId = `${uid}-search`;
  const statusId = `${uid}-status`;
  const empty    = emptyText ?? t('common.noResults');

  return (
    <div className={styles.wrapper}>
      {(searchable || (bulkActions && selected.size > 0)) && (
        <div className={styles.toolbar}>
          {searchable && (
            <div className={styles.searchWrap}>
              <Search size={13} className={styles.searchIcon} aria-hidden="true" />
              <label htmlFor={searchId} className="sr-only">{t('common.searchTable')}</label>
              <input
                id={searchId}
                className={styles.search}
                placeholder={t('common.searchPlaceholder')}
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1); }}
                type="search"
                aria-controls={`${uid}-table`}
              />
            </div>
          )}
          {bulkActions && selected.size > 0 && (
            <div className={styles.bulkBar} role="status" aria-live="polite">
              <span className={styles.bulkCount}>{t('common.selected', { count: selected.size })}</span>
              {bulkActions(Array.from(selected), () => setSelected(new Set()))}
            </div>
          )}
        </div>
      )}

      <div className={styles.tableWrap}>
        <table
          id={`${uid}-table`}
          className={styles.table}
          aria-label={tableLabel}
          aria-rowcount={filtered.length}
          aria-describedby={statusId}
        >
          <thead className={styles.thead}>
            <tr>
              {bulkActions && (
                <th className={styles.checkTh} scope="col">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label={allSelected ? t('common.deselectAll') : t('common.selectAll')}
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  scope="col"
                  className={`${styles.th} ${col.sortable !== false ? styles.sortable : ''}`}
                  style={{ width: col.width }}
                  onClick={col.sortable !== false ? () => toggleSort(col.key) : undefined}
                  aria-sort={sort.key === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : (col.sortable !== false ? 'none' : undefined)}
                >
                  <span>{col.label}</span>
                  {col.sortable !== false && <SortIcon colKey={col.key} label={col.label} />}
                </th>
              ))}
              {rowActions && <th scope="col" className={styles.th} style={{ width: 80 }}><span className="sr-only">{t('common.actions')}</span></th>}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr><td colSpan={columns.length + (bulkActions ? 1 : 0) + (rowActions ? 1 : 0)} className={styles.empty}>
                <Inbox size={28} className={styles.emptyIcon} />
                {empty}
              </td></tr>
            ) : pageData.map(row => (
              <tr
                key={row[rowKey]}
                className={`${styles.tr} ${onRowClick ? styles.clickable : ''} ${selected.has(row[rowKey]) ? styles.selectedRow : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onRowClick(row) : undefined}
                aria-selected={bulkActions ? selected.has(row[rowKey]) : undefined}
                role={onRowClick ? 'button' : undefined}
              >
                {bulkActions && (
                  <td className={styles.checkTd} onClick={e => { e.stopPropagation(); toggleRow(row[rowKey]); }}>
                    <input
                      type="checkbox"
                      checked={selected.has(row[rowKey])}
                      onChange={() => toggleRow(row[rowKey])}
                      aria-label={t('common.selectRow', { id: row[rowKey] })}
                    />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key} className={styles.td} style={{ width: col.width }} data-label={col.label}>
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
                {rowActions && (
                  <td className={`${styles.td} ${styles.actionsTd}`} onClick={e => e.stopPropagation()}>
                    {rowActions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination} role="navigation" aria-label={t('common.pagination')}>
        <span id={statusId} className={styles.pgInfo} aria-live="polite" aria-atomic="true">
          {t('common.records', { count: filtered.length })}
        </span>
        <div className={styles.pgControls}>
          <button
            className={styles.pgBtn}
            disabled={currentPage <= 1}
            onClick={() => setPage(p => p - 1)}
            aria-label={t('common.prevPage')}
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
          <span className={styles.pgNum} aria-live="polite" aria-atomic="true">
            {t('common.pageShort', { current: currentPage, total: totalPages })}
          </span>
          <button
            className={styles.pgBtn}
            disabled={currentPage >= totalPages}
            onClick={() => setPage(p => p + 1)}
            aria-label={t('common.nextPage')}
          >
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
