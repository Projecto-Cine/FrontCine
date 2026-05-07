import { useState, useMemo, useEffect, useRef } from 'react';
import { Users, RefreshCw, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { shiftsService } from '../../services/shiftsService';
import { usersService } from '../../services/usersService';
import { useApp } from '../../contexts/AppContext';
import styles from './ShiftsPage.module.css';

const SHIFTS = {
  M: { label: 'Mañana', hours: '08–16' },
  T: { label: 'Tarde', hours: '14–22' },
  N: { label: 'Noche', hours: '18–02' },
  L: { label: 'Libre', hours: '—' },
};
const SHIFT_ORDER = ['M', 'T', 'N', 'L'];

const ROLE_SHIFTS = {
  CAJERO: ['M', 'T'],
  LIMPIEZA: ['M', 'T'],
  SEGURIDAD: ['T', 'N'],
  GERENCIA: ['M', 'T', 'N'],
};

const ROLE_LABELS = {
  CAJERO: 'Cajero', LIMPIEZA: 'Limpieza', SEGURIDAD: 'Seguridad', GERENCIA: 'Gerencia',
};

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

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
  const ws = getWeekStart(date);
  return `${ws.getFullYear()}-${ws.getMonth() + 1}-${ws.getDate()}`;
}

function generateWeekSchedule(employees, weekStartDate, genKey = 0) {
  const wn = weekNum(weekStartDate) + weekStartDate.getFullYear() * 100;
  let seed = ((wn * 31337 + 7 + genKey * 999983) >>> 0);

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

function ShiftCell({ shift, isEditing, onEdit, onSelect }) {
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!isEditing) return;
    const handler = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) onEdit(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isEditing, onEdit]);

  return (
    <div className={styles.cellWrap}>
      <button
        className={`${styles.cell} ${styles[`cell${shift}`]} ${isEditing ? styles.cellActive : ''}`}
        onClick={onEdit}
        title={`${SHIFTS[shift]?.label} ${SHIFTS[shift]?.hours} — clic para cambiar`}
      >
        {shift}
      </button>
      {isEditing && (
        <div className={styles.picker} ref={pickerRef}>
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
      )}
    </div>
  );
}

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
                  <div className={styles.empAvatar}>{emp.name?.charAt(0)}</div>
                  <span className={styles.empName}>
                    {emp.name?.split(' ')[0]} {emp.name?.split(' ')[1]?.charAt(0)}.
                  </span>
                </td>
                <td className={styles.tdRole}>
                  <span className={`${styles.roleBadge} ${styles[`role_${emp.role}`]}`}>
                    {ROLE_LABELS[emp.role] || emp.role}
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

export default function ShiftsPage() {
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    usersService.getAll().then(data => {
      setAllUsers(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const activeEmployees = useMemo(
    () => allUsers.filter(u => u.status === 'active'),
    [allUsers]
  );

  const currentKey = weekKey(weekStart);
  const weekRows = useMemo(
    () => scheduleMap[currentKey] ?? generateWeekSchedule(activeEmployees, weekStart, 0),
    [currentKey, scheduleMap, activeEmployees, weekStart]
  );

  const stats = { M: 0, T: 0, N: 0, L: 0 };
  weekRows.forEach(r => r.days.forEach(d => { if (stats[d] !== undefined) stats[d]++; }));

  const periodLabel = mode === 'week'
    ? `Sem ${weekNum(weekStart)} · ${fmtDate(weekStart)} — ${fmtDate(addDays(weekStart, 6))}`
    : monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());

  const prevPeriod = () => {
    if (mode === 'week') setWeekStart(d => addDays(d, -7));
    else setMonthStart(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const nextPeriod = () => {
    if (mode === 'week') setWeekStart(d => addDays(d, 7));
    else setMonthStart(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

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

  const handleShiftChange = (empId, dayIdx, newShift) => {
    setScheduleMap(prev => {
      const key = weekKey(weekStart);
      const rows = prev[key] ?? generateWeekSchedule(activeEmployees, weekStart, 0);
      const updated = rows.map(r => r.id === empId ? { ...r, days: r.days.map((d, i) => i === dayIdx ? newShift : d) } : r);
      return { ...prev, [key]: updated };
    });
    setEditCell(null);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const rows = scheduleMap[currentKey] || weekRows;
      const shifts = rows.flatMap(emp =>
        emp.days.map((shift, dayIdx) => {
          if (shift === 'L') return null;
          const date = addDays(weekStart, dayIdx);
          const startHour = shift === 'M' ? 8 : shift === 'T' ? 14 : 18;
          return {
            workerEmail: emp.email,
            workerName: emp.name,
            role: emp.role,
            shiftDate: date.toISOString().split('T')[0],
            startTime: `${startHour}:00`,
            endTime: shift === 'M' ? '16:00' : shift === 'T' ? '22:00' : '02:00',
            status: 'PENDIENTE',
          };
        }).filter(Boolean)
      );

      await Promise.all(shifts.map(s => shiftsService.create(s)));
      toast('Turnos guardados en la base de datos', 'success');
    } catch {
      toast('Error al guardar turnos', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <Users size={18} className={styles.titleIcon} />
          <div>
            <h1 className={styles.title}>Cuadrante de Turnos</h1>
            <p className={styles.sub}>
              {weekRows.length} empleados · {activeEmployees.length} activos
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
          </div>

          <div className={styles.periodNav}>
            <button className={styles.navBtn} onClick={prevPeriod}><ChevronLeft size={14} /></button>
            <span className={styles.periodLabel}>{periodLabel}</span>
            <button className={styles.navBtn} onClick={nextPeriod}><ChevronRight size={14} /></button>
          </div>

          <button className={styles.generateBtn} onClick={handleGenerate}>
            <RefreshCw size={13} />
            Generar
          </button>

          <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar en BD'}
          </button>
        </div>
      </div>

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
      </div>

      <WeekTable
        rows={weekRows}
        weekStart={weekStart}
        editCell={editCell}
        onEditCell={(empId, dayIdx) => setEditCell({ empId, dayIdx })}
        onShiftChange={handleShiftChange}
        onCloseEdit={() => setEditCell(null)}
      />
    </div>
  );
}
