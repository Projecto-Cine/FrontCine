import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import styles from './DataTable.module.css';

export default function DataTable({
  columns, data, pageSize = 15, searchable = true,
  searchKeys = [], onRowClick, rowActions, emptyText = 'Sin resultados',
  bulkActions, rowKey = 'id'
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(1);
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (key) => {
    setSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
    setPage(1);
  };

  const allSelected = pageData.length > 0 && pageData.every(r => selected.has(r[rowKey]));
  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) pageData.forEach(r => next.delete(r[rowKey]));
      else pageData.forEach(r => next.add(r[rowKey]));
      return next;
    });
  };
  const toggleRow = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const SortIcon = ({ colKey }) => {
    if (sort.key !== colKey) return <ChevronsUpDown size={12} className={styles.sortIcon} />;
    return sort.dir === 'asc' ? <ChevronUp size={12} className={`${styles.sortIcon} ${styles.active}`} /> : <ChevronDown size={12} className={`${styles.sortIcon} ${styles.active}`} />;
  };

  return (
    <div className={styles.wrapper}>
      {(searchable || (bulkActions && selected.size > 0)) && (
        <div className={styles.toolbar}>
          {searchable && (
            <div className={styles.searchWrap}>
              <Search size={13} className={styles.searchIcon} />
              <input
                className={styles.search}
                placeholder="Buscar..."
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1); }}
              />
            </div>
          )}
          {bulkActions && selected.size > 0 && (
            <div className={styles.bulkBar}>
              <span className={styles.bulkCount}>{selected.size} seleccionado{selected.size !== 1 ? 's' : ''}</span>
              {bulkActions(Array.from(selected), () => setSelected(new Set()))}
            </div>
          )}
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {bulkActions && <th className={styles.checkTh}><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>}
              {columns.map(col => (
                <th key={col.key} className={`${styles.th} ${col.sortable !== false ? styles.sortable : ''}`}
                  style={{ width: col.width }}
                  onClick={col.sortable !== false ? () => toggleSort(col.key) : undefined}>
                  <span>{col.label}</span>
                  {col.sortable !== false && <SortIcon colKey={col.key} />}
                </th>
              ))}
              {rowActions && <th className={styles.th} style={{ width: 80 }}></th>}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr><td colSpan={columns.length + (bulkActions ? 1 : 0) + (rowActions ? 1 : 0)} className={styles.empty}>{emptyText}</td></tr>
            ) : pageData.map(row => (
              <tr key={row[rowKey]} className={`${styles.tr} ${onRowClick ? styles.clickable : ''} ${selected.has(row[rowKey]) ? styles.selectedRow : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}>
                {bulkActions && (
                  <td className={styles.checkTd} onClick={e => { e.stopPropagation(); toggleRow(row[rowKey]); }}>
                    <input type="checkbox" checked={selected.has(row[rowKey])} onChange={() => {}} />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key} className={styles.td} style={{ width: col.width }}>
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

      <div className={styles.pagination}>
        <span className={styles.pgInfo}>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
        <div className={styles.pgControls}>
          <button className={styles.pgBtn} disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></button>
          <span className={styles.pgNum}>Pág. {currentPage} / {totalPages}</span>
          <button className={styles.pgBtn} disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}
