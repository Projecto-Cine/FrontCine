import { useState, useMemo, useEffect, useRef } from 'react';
import { Users, RefreshCw, ChevronLeft, ChevronRight, Download, Calendar } from 'lucide-react';
import { workersService } from '../../services/workersService';
import { useApp } from '../../contexts/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import styles from './ShiftsPage.module.css';

// ── Shift codes (stable — not translated) ──────────────
const SHIFT_ORDER = ['M', 'T', 'N', 'L'];

const ROLE_SHIFTS = {
  CAJERO:    ['M', 'T'],
  GERENCIA:  ['M', 'M', 'T'],
  SEGURIDAD: ['M', 'T', 'N'],
  LIMPIEZA:  ['M', 'N'],
};

// ── Date helpers ───────────────────────────────────────
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

function fmtDate(date, lang) {
  return date.toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', { day: '2-digit', month: 'short' });
}

function weekNum(date) {
  const jan1 = new Date(date.getFullYear(), 0, 1);
  return Math.ceil(((date - jan1) / 86400000 + jan1.getDay() + 1) / 7);
}

function weekKey(date) {
  return getWeekStart(date).toISOString().split('T')[0];
}

// ── Schedule generator ─────────────────────────────────
function generateWeekSchedule(employees, weekStartDate, genKey = 0) {
  const wn = weekNum(weekStartDate) + weekStartDate.getFullYear() * 100;
  let seed = ((wn * 31337 + 7 + genKey * 999983) >>> 0);

  const rand = () => {
    seed = ((seed * 1664525 + 1013904223) >>> 0);
    return seed / 0xffffffff;
  };

  const weights = [2, 1, 1, 1, 1, 3, 3];
  const totalW = weights.reduce((a, b) => a + b, 0);

  return employees.map((emp) => {
    let es = ((seed ^ (emp.id * 2654435761 + genKey * 40503)) >>> 0);
    const erand = () => { es = ((es * 1664525 + 1013904223) >>> 0); return es / 0xffffffff; };

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

// ── Coverage stats ─────────────────────────────────────
function coverageStats(rows) {
  const counts = { M: 0, T: 0, N: 0, L: 0 };
  rows.forEach(r => r.days.forEach(d => { if (counts[d] !== undefined) counts[d]++; }));
  return counts;
}

// ── ShiftPicker sub-component ──────────────────────────
function ShiftPicker({ onSelect, onClose, shifts }) {
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
          title={`${shifts[s].label} ${shifts[s].hours}`}
        >
          <span className={styles.pickerShort}>{s}</span>
          <span className={styles.pickerHours}>{shifts[s].hours}</span>
        </button>
      ))}
    </div>
  );
}

// ── ShiftCell sub-component ────────────────────────────
function ShiftCell({ shift, isEditing, onEdit, onSelect, onClose, shifts }) {
  return (
    <div className={styles.cellWrap}>
      <button
        className={`${styles.cell} ${styles[`cell${shift}`]} ${isEditing ? styles.cellActive : ''}`}
        onClick={onEdit}
        title={`${shifts[shift]?.label} ${shifts[shift]?.hours}`}
      >
        {shift}
      </button>
      {isEditing && <ShiftPicker onSelect={onSelect} onClose={onClose} shifts={shifts} />}
    </div>
  );
}

// ── WeekTable sub-component ────────────────────────────
function WeekTable({ rows, weekStart, editCell, onEditCell, onShiftChange, onCloseEdit, dayNames, shifts, roleLabels, colLabels, lang }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thEmployee}>{colLabels.employee}</th>
            <th className={styles.thRole}>{colLabels.role}</th>
            {Array.from({ length: 7 }, (_, i) => {
              const d = addDays(weekStart, i);
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <th key={i} className={`${styles.thDay} ${isToday ? styles.thToday : ''}`}>
                  <span className={styles.dayName}>{dayNames[i]}</span>
                  <span className={styles.dayNum}>{d.getDate()}</span>
                </th>
              );
            })}
            <th className={styles.thStats}>{colLabels.hours}</th>
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
                    {roleLabels[emp.role] ?? emp.role}
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
                        shifts={shifts}
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

// ── Main page ──────────────────────────────────────────
export default function CuadrantePage() {
  const { toast } = useApp();
  const { t, language } = useLanguage();
  const [mode, setMode] = useState('week');
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [monthStart, setMonthStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [allUsers, setAllUsers] = useState([]);
  const [scheduleMap, setScheduleMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lumen_schedule_map') ?? '{}'); } catch { return {}; }
  });
  const [editCell, setEditCell] = useState(null);

  // Reactive translations for shift labels and day names
  const SHIFTS = {
    M: { label: t('shifts.shift.M'), hours: t('shifts.hours.M') },
    T: { label: t('shifts.shift.T'), hours: t('shifts.hours.T') },
    N: { label: t('shifts.shift.N'), hours: t('shifts.hours.N') },
    L: { label: t('shifts.shift.L'), hours: t('shifts.hours.L') },
  };
  const DAY_NAMES  = t('shifts.day');
  const ROLE_LABELS = {
    CAJERO:    t('shifts.role.CAJERO'),
    GERENCIA:  t('shifts.role.GERENCIA'),
    SEGURIDAD: t('shifts.role.SEGURIDAD'),
    LIMPIEZA:  t('shifts.role.LIMPIEZA'),
  };
  const COL_LABELS = {
    employee: t('shifts.col.employee'),
    role:     t('shifts.col.role'),
    hours:    t('shifts.col.hours'),
  };

  useEffect(() => {
    workersService.getAll().then(data => {
      setAllUsers(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const VALID_ROLES = new Set(['CAJERO', 'GERENCIA', 'SEGURIDAD', 'LIMPIEZA']);

  const activeEmployees = useMemo(
    () => allUsers.filter(e => VALID_ROLES.has(String(e.role).toUpperCase())),
    [allUsers]
  );

  const currentKey = weekKey(weekStart);
  const weekRows = useMemo(
    () => scheduleMap[currentKey] ?? generateWeekSchedule(activeEmployees, weekStart, 0),
    [currentKey, scheduleMap, activeEmployees, weekStart]
  );

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

  const handleGenerate = () => {
    const genKey = Date.now();
    if (mode === 'week') {
      setScheduleMap(prev => {
        const next = { ...prev, [currentKey]: generateWeekSchedule(activeEmployees, weekStart, genKey) };
        try { localStorage.setItem('lumen_schedule_map', JSON.stringify(next)); } catch {}
        return next;
      });
      toast(t('shifts.weekGenerated'), 'success');
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
      setScheduleMap(prev => {
        const next = { ...prev, ...updates };
        try { localStorage.setItem('lumen_schedule_map', JSON.stringify(next)); } catch {}
        return next;
      });
      toast(t('shifts.monthGenerated', { count: Object.keys(updates).length }), 'success');
    }
    setEditCell(null);
  };

  const handleShiftChange = (empId, dayIdx, newShift) => {
    setScheduleMap(prev => {
      const rows = prev[currentKey] ?? generateWeekSchedule(activeEmployees, weekStart, 0);
      const next = {
        ...prev,
        [currentKey]: rows.map(emp =>
          emp.id === empId
            ? { ...emp, days: emp.days.map((d, i) => i === dayIdx ? newShift : d) }
            : emp
        ),
      };
      try { localStorage.setItem('lumen_schedule_map', JSON.stringify(next)); } catch {}
      return next;
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

  const lang = language ?? 'es';
  const periodLabel = mode === 'week'
    ? `${t('shifts.weekPrefix')} ${weekNum(weekStart)} · ${fmtDate(weekStart, lang)} — ${fmtDate(addDays(weekStart, 6), lang)}`
    : monthStart.toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', { month: 'long', year: 'numeric' })
        .replace(/^\w/, c => c.toUpperCase());

  return (
    <div className={styles.page}>
      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <Users size={18} className={styles.titleIcon} />
          <div>
            <h1 className={styles.title}>{t('shifts.title')}</h1>
            <p className={styles.sub}>
              {t('shifts.subtitle', { count: activeEmployees.length })}
            </p>
          </div>
        </div>

        <div className={styles.topRight}>
          <div className={styles.modeSwitch}>
            <button
              className={`${styles.modeBtn} ${mode === 'week' ? styles.modeBtnActive : ''}`}
              onClick={() => setMode('week')}
            >
              <Calendar size={12} />{t('shifts.mode.week')}
            </button>
            <button
              className={`${styles.modeBtn} ${mode === 'month' ? styles.modeBtnActive : ''}`}
              onClick={() => setMode('month')}
            >
              <Calendar size={12} />{t('shifts.mode.month')}
            </button>
          </div>

          <div className={styles.periodNav}>
            <button className={styles.navBtn} onClick={prevPeriod}><ChevronLeft size={14} /></button>
            <span className={styles.periodLabel}>{periodLabel}</span>
            <button className={styles.navBtn} onClick={nextPeriod}><ChevronRight size={14} /></button>
          </div>

          <button className={styles.generateBtn} onClick={handleGenerate}>
            <RefreshCw size={13} />
            {mode === 'week' ? t('shifts.generate.week') : t('shifts.generate.month')}
          </button>

          <button className={styles.exportBtn} title="Imprimir / Exportar PDF" onClick={() => window.print()}>
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* ── Weekly coverage bar ── */}
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

      {/* ── Week view ── */}
      {mode === 'week' && (
        <WeekTable
          rows={weekRows}
          weekStart={weekStart}
          editCell={editCell}
          onEditCell={handleEditCell}
          onShiftChange={handleShiftChange}
          onCloseEdit={() => setEditCell(null)}
          dayNames={DAY_NAMES}
          shifts={SHIFTS}
          roleLabels={ROLE_LABELS}
          colLabels={COL_LABELS}
          lang={lang}
        />
      )}

      {/* ── Month view ── */}
      {mode === 'month' && (
        <div className={styles.monthView}>
          {monthWeeks.map((week) => (
            <div key={week.key} className={styles.monthWeek}>
              <div className={styles.monthWeekHeader}>
                <span className={styles.monthWeekLabel}>
                  {t('shifts.weekPrefix')} {weekNum(week.start)} · {fmtDate(week.start, lang)} — {fmtDate(addDays(week.start, 6), lang)}
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
                      <th className={styles.thEmployee}>{t('shifts.col.employee')}</th>
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
          {t('shifts.footer.note')}
        </span>
        <div className={styles.footerStats}>
          <span>{t('shifts.footer.employees')}: <strong>{activeEmployees.length}</strong></span>
          <span>·</span>
          <span>{t('shifts.footer.hoursPerWeek')}: <strong>{weekRows.reduce((a, r) => a + r.days.filter(d => d !== 'L').length * 8, 0)}h</strong></span>
          <span>·</span>
          <span>{t('shifts.footer.daysOff')}: <strong>{stats.L}</strong></span>
        </div>
      </div>
    </div>
  );
}
