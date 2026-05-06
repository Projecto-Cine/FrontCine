import { useState, useMemo, useEffect, useRef } from 'react';
import { Users, RefreshCw, ChevronLeft, ChevronRight, Download, Calendar } from 'lucide-react';
import { usersService } from '../../services/usersService';
import { useApp } from '../../contexts/AppContext';
import styles from './ShiftsPage.module.css';

// ── Turno config ─────────────────────────────────────────────
const SHIFTS = {
  M: { label: 'Mañana',  hours: '08–16' },
  T: { label: 'Tarde',   hours: '14–22' },
  N: { label: 'Noche',   hours: '18–02' },
  L: { label: 'Libre',   hours: '—'     },
};
const SHIFT_ORDER = ['M', 'T', 'N', 'L'];

const ROLE_SHIFTS = {
  admin:       ['M', 'M', 'T'],
  supervisor:  ['M', 'T', 'T', 'N'],
  operator:    ['M', 'T', 'N'],
  ticket:      ['M', 'T'],
  maintenance: ['M', 'T', 'N'],
  readonly:    ['M'],
};

const ROLE_LABELS = {
  admin: 'Administrador', supervisor: 'Supervisor', operator: 'Operador',
  ticket: 'Taquilla', maintenance: 'Mantenimiento', readonly: 'Consulta',
};

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ── Helpers de fecha ─────────────────────────────────────────
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmtDate(date) {
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function weekNum(date) {
  const jan1 = new Date(date.getFullYear(), 0, 1);
  return Math.ceil(((date - jan1) / 86400000 + jan1.getDay() + 1) / 7);
}

function weekKey(date) {
  return getWeekStart(date).toISOString().split('T')[0];
}

// ── Generador — genKey varía el resultado para la misma semana ─
function generateWeekSchedule(employees, weekStartDate, genKey = 0) {
  const wn = weekNum(weekStartDate) + weekStartDate.getFullYear() * 100;
  // genKey hace que el mismo período produzca distribuciones diferentes
  let seed = ((wn * 31337 + 7 + genKey * 999983) >>> 0);

  const rand = () => {
    seed = ((seed * 1664525 + 1013904223) >>> 0);
    return seed / 0xffffffff;
  };

  const weights = [2, 1, 1, 1, 1, 3, 3]; // pesos días libres (sáb/dom más probables)
  const totalW = weights.reduce((a, b) => a + b, 0);

  return employees.map((emp) => {
    // Semilla independiente por empleado + genKey
    let es = ((seed ^ (emp.id * 2654435761 + genKey * 40503)) >>> 0);
    const erand = () => { es = ((es * 1664525 + 1013904223) >>> 0); return es / 0xffffffff; };

    // Elegir 2 días libres con pesos
    const daysOff = new Set();
    let attempts = 0;
    while (daysOff.size < 2 && attempts < 50) {
      let r = erand() * totalW;
      for (let i = 0; i < 7; i++) {
        r -= weights[i];
        if (r <= 0 && !daysOff.has(i)) { daysOff.add(i); break; }
      }
      attempts++;
    }

    const pool = ROLE_SHIFTS[emp.role] || ['M', 'T'];
    const days = Array.from({ length: 7 }, (_, d) =>
      daysOff.has(d) ? 'L' : pool[Math.floor(erand() * pool.length)]
    );

    return { ...emp, days };
  });
}

// ── Cobertura diaria ─────────────────────────────────────────
function coverageStats(rows) {
  const counts = { M: 0, T: 0, N: 0, L: 0 };
  rows.forEach(r => r.days.forEach(d => { if (counts[d] !== undefined) counts[d]++; }));
  return counts;
}

// ── Picker inline de turno ───────────────────────────────────
function ShiftPicker({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div className={styles.picker} ref={ref}>
      {SHIFT_ORDER.map(s => (
        <button
          key={s}
          className={`${styles.pickerOpt} ${styles[`cell${s}`]}`}
          onClick={() => onSelect(s)}
          title={`${SHIFTS[s].label} ${SHIFTS[s].hours}`}
        >
          <span className={styles.pickerShort}>{s}</span>
          <span className={styles.pickerHours}>{SHIFTS[s].hours}</span>
        </button>
      ))}
    </div>
  );
}

// ── Celda de turno editable ──────────────────────────────────
function ShiftCell({ shift, isEditing, onEdit, onSelect, onClose }) {
  return (
    <div className={styles.cellWrap}>
      <button
        className={`${styles.cell} ${styles[`cell${shift}`]} ${isEditing ? styles.cellActive : ''}`}
        onClick={onEdit}
        title={`${SHIFTS[shift]?.label} ${SHIFTS[shift]?.hours} — clic para cambiar`}
      >
        {shift}
      </button>
      {isEditing && <ShiftPicker onSelect={onSelect} onClose={onClose} />}
    </div>
  );
}

// ── Tabla semanal ────────────────────────────────────────────
function WeekTable({ rows, weekStart, editCell, onEditCell, onShiftChange, onCloseEdit }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thEmployee}>Empleado</th>
            <th className={styles.thRole}>Rol</th>
            {Array.from({ length: 7 }, (_, i) => {
              const d = addDays(weekStart, i);
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <th key={i} className={`${styles.thDay} ${isToday ? styles.thToday : ''}`}>
                  <span className={styles.dayName}>{DAY_NAMES[i]}</span>
                  <span className={styles.dayNum}>{d.getDate()}</span>
                </th>
              );
            })}
            <th className={styles.thStats}>Horas est.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((emp, i) => {
            const workDays = emp.days.filter(d => d !== 'L').length;
            return (
              <tr key={emp.id} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td className={styles.tdEmployee}>
                  <div className={styles.empAvatar}>{emp.name.charAt(0)}</div>
                  <span className={styles.empName}>
                    {emp.name.split(' ')[0]} {emp.name.split(' ')[1]?.charAt(0)}.
                  </span>
                </td>
                <td className={styles.tdRole}>
                  <span className={`${styles.roleBadge} ${styles[`role_${emp.role}`]}`}>
                    {ROLE_LABELS[emp.role]}
                  </span>
                </td>
                {emp.days.map((shift, d) => {
                  const date = addDays(weekStart, d);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isEditing = editCell?.empId === emp.id && editCell?.dayIdx === d;
                  return (
                    <td key={d} className={`${styles.tdShift} ${isToday ? styles.tdToday : ''}`}>
                      <ShiftCell
                        shift={shift}
                        isEditing={isEditing}
                        onEdit={() => onEditCell(emp.id, d)}
                        onSelect={(s) => onShiftChange(emp.id, d, s)}
                        onClose={onCloseEdit}
                      />
                    </td>
                  );
                })}
                <td className={styles.tdStats}>
                  <span className={styles.hoursVal}>{workDays * 8}h</span>
                  <span className={styles.daysVal}>{workDays}d</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────
export default function CuadrantePage() {
  const { toast } = useApp();
  const [mode, setMode] = useState('week');
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [monthStart, setMonthStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [allUsers, setAllUsers] = useState([]);
  const [scheduleMap, setScheduleMap] = useState({});
  const [editCell, setEditCell] = useState(null);

  useEffect(() => {
    usersService.getAll().then(data => {
      setAllUsers(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const activeEmployees = useMemo(
    () => allUsers.filter(u => u.status === 'active' && u.role?.toLowerCase() !== 'client'),
    [allUsers]
  );

  // Cuadrante de la semana actual (auto-generado si no existe)
  const currentKey = weekKey(weekStart);
  const weekRows = useMemo(
    () => scheduleMap[currentKey] ?? generateWeekSchedule(activeEmployees, weekStart, 0),
    [currentKey, scheduleMap, activeEmployees, weekStart]
  );

  // Semanas del mes actual (auto-generadas si no existen)
  const monthWeeks = useMemo(() => {
    const weeks = [];
    let cursor = getWeekStart(monthStart);
    const targetMonth = monthStart.getMonth();
    for (let w = 0; w < 6; w++) {
      const hasMonth = Array.from({ length: 7 }, (_, i) => addDays(cursor, i))
        .some(d => d.getMonth() === targetMonth);
      if (!hasMonth) break;
      const key = weekKey(cursor);
      weeks.push({
        start: new Date(cursor),
        key,
        rows: scheduleMap[key] ?? generateWeekSchedule(activeEmployees, cursor, 0),
      });
      cursor = addDays(cursor, 7);
    }
    return weeks;
  }, [monthStart, scheduleMap, activeEmployees]);

  const stats = coverageStats(weekRows);

  // Genera nuevo cuadrante para semana o mes (genKey = timestamp → siempre diferente)
  const handleGenerate = () => {
    const genKey = Date.now();
    if (mode === 'week') {
      setScheduleMap(prev => ({
        ...prev,
        [currentKey]: generateWeekSchedule(activeEmployees, weekStart, genKey),
      }));
      toast('Cuadrante semanal generado', 'success');
    } else {
      const updates = {};
      let cursor = getWeekStart(monthStart);
      const targetMonth = monthStart.getMonth();
      for (let w = 0; w < 6; w++) {
        const hasMonth = Array.from({ length: 7 }, (_, i) => addDays(cursor, i))
          .some(d => d.getMonth() === targetMonth);
        if (!hasMonth) break;
        updates[weekKey(cursor)] = generateWeekSchedule(activeEmployees, cursor, genKey + w);
        cursor = addDays(cursor, 7);
      }
      setScheduleMap(prev => ({ ...prev, ...updates }));
      toast(`Cuadrante mensual generado: ${Object.keys(updates).length} semanas`, 'success');
    }
    setEditCell(null);
  };

  // Edición manual de una celda
  const handleShiftChange = (empId, dayIdx, newShift) => {
    setScheduleMap(prev => {
      const rows = prev[currentKey] ?? generateWeekSchedule(activeEmployees, weekStart, 0);
      return {
        ...prev,
        [currentKey]: rows.map(emp =>
          emp.id === empId
            ? { ...emp, days: emp.days.map((d, i) => i === dayIdx ? newShift : d) }
            : emp
        ),
      };
    });
    setEditCell(null);
  };

  const handleEditCell = (empId, dayIdx) => {
    setEditCell(prev =>
      prev?.empId === empId && prev?.dayIdx === dayIdx ? null : { empId, dayIdx }
    );
  };

  const prevPeriod = () => {
    setEditCell(null);
    if (mode === 'week') setWeekStart(d => addDays(d, -7));
    else setMonthStart(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const nextPeriod = () => {
    setEditCell(null);
    if (mode === 'week') setWeekStart(d => addDays(d, 7));
    else setMonthStart(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const periodLabel = mode === 'week'
    ? `Sem ${weekNum(weekStart)} · ${fmtDate(weekStart)} — ${fmtDate(addDays(weekStart, 6))}`
    : monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        .replace(/^\w/, c => c.toUpperCase());

  return (
    <div className={styles.page}>
      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <Users size={18} className={styles.titleIcon} />
          <div>
            <h1 className={styles.title}>Cuadrante de Turnos</h1>
            <p className={styles.sub}>
              {activeEmployees.length} empleados activos · Clic en cualquier celda para editar
            </p>
          </div>
        </div>

        <div className={styles.topRight}>
          <div className={styles.modeSwitch}>
            <button
              className={`${styles.modeBtn} ${mode === 'week' ? styles.modeBtnActive : ''}`}
              onClick={() => setMode('week')}
            >
              <Calendar size={12} />Semana
            </button>
            <button
              className={`${styles.modeBtn} ${mode === 'month' ? styles.modeBtnActive : ''}`}
              onClick={() => setMode('month')}
            >
              <Calendar size={12} />Mes
            </button>
          </div>

          <div className={styles.periodNav}>
            <button className={styles.navBtn} onClick={prevPeriod}><ChevronLeft size={14} /></button>
            <span className={styles.periodLabel}>{periodLabel}</span>
            <button className={styles.navBtn} onClick={nextPeriod}><ChevronRight size={14} /></button>
          </div>

          <button className={styles.generateBtn} onClick={handleGenerate}>
            <RefreshCw size={13} />
            Generar {mode === 'week' ? 'semana' : 'mes'}
          </button>

          <button className={styles.exportBtn} title="Imprimir / Exportar PDF" onClick={() => window.print()}>
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* ── Cobertura semanal ── */}
      {mode === 'week' && (
        <div className={styles.coverageBar}>
          <div className={styles.coverageItems}>
            {Object.entries(SHIFTS).map(([k, s]) => (
              <div key={k} className={styles.coverageItem}>
                <span className={`${styles.shiftDot} ${styles[`dot${k}`]}`} />
                <span className={styles.coverageLabel}>{s.label}</span>
                <span className={styles.coverageHours}>{s.hours}</span>
                <span className={styles.coverageCount}>{stats[k]}</span>
              </div>
            ))}
          </div>
          <div className={styles.coverageSep} />
          <div className={styles.coverageLegend}>
            {SHIFT_ORDER.map(k => (
              <span key={k} className={`${styles.legendPill} ${styles[`pill${k}`]}`}>
                {k} = {SHIFTS[k].label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Vista semanal ── */}
      {mode === 'week' && (
        <WeekTable
          rows={weekRows}
          weekStart={weekStart}
          editCell={editCell}
          onEditCell={handleEditCell}
          onShiftChange={handleShiftChange}
          onCloseEdit={() => setEditCell(null)}
        />
      )}

      {/* ── Vista mensual ── */}
      {mode === 'month' && (
        <div className={styles.monthView}>
          {monthWeeks.map((week) => (
            <div key={week.key} className={styles.monthWeek}>
              <div className={styles.monthWeekHeader}>
                <span className={styles.monthWeekLabel}>
                  Semana {weekNum(week.start)} · {fmtDate(week.start)} — {fmtDate(addDays(week.start, 6))}
                </span>
                <div className={styles.monthWeekStats}>
                  {Object.entries(coverageStats(week.rows)).map(([k, v]) => (
                    <span key={k} className={`${styles.miniPill} ${styles[`pill${k}`]}`}>{v} {k}</span>
                  ))}
                </div>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.thEmployee}>Empleado</th>
                      {Array.from({ length: 7 }, (_, i) => {
                        const d = addDays(week.start, i);
                        const inMonth = d.getMonth() === monthStart.getMonth();
                        const isToday = d.toDateString() === new Date().toDateString();
                        return (
                          <th key={i} className={`${styles.thDay} ${isToday ? styles.thToday : ''} ${!inMonth ? styles.thOutMonth : ''}`}>
                            <span className={styles.dayName}>{DAY_NAMES[i]}</span>
                            <span className={styles.dayNum}>{d.getDate()}</span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {week.rows.map((emp, i) => (
                      <tr key={emp.id} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                        <td className={styles.tdEmployee}>
                          <div className={styles.empAvatar}>{emp.name.charAt(0)}</div>
                          <span className={styles.empName}>
                            {emp.name.split(' ')[0]} {emp.name.split(' ')[1]?.charAt(0)}.
                          </span>
                        </td>
                        {emp.days.map((shift, d) => {
                          const date = addDays(week.start, d);
                          const inMonth = date.getMonth() === monthStart.getMonth();
                          const isToday = date.toDateString() === new Date().toDateString();
                          return (
                            <td key={d} className={`${styles.tdShift} ${isToday ? styles.tdToday : ''} ${!inMonth ? styles.tdOutMonth : ''}`}>
                              {inMonth
                                ? <span className={`${styles.cell} ${styles[`cell${shift}`]}`}>{shift}</span>
                                : <span className={styles.outMonth}>—</span>
                              }
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <div className={styles.footer}>
        <span className={styles.footerNote}>
          Generación automática por rol · Clic en cualquier celda para cambiar el turno manualmente
        </span>
        <div className={styles.footerStats}>
          <span>Empleados: <strong>{activeEmployees.length}</strong></span>
          <span>·</span>
          <span>Horas/semana: <strong>{weekRows.reduce((a, r) => a + r.days.filter(d => d !== 'L').length * 8, 0)}h</strong></span>
          <span>·</span>
          <span>Libres semana: <strong>{stats.L}</strong></span>
        </div>
      </div>
    </div>
  );
}
