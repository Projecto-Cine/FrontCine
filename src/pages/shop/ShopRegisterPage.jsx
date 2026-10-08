import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Eye, EyeOff, X } from 'lucide-react';
import { useShopAuth } from '../../contexts/ShopAuthContext';
import styles from './ShopRegisterPage.module.css';

/**
 * Alta de cliente.
 *
 * No existía ninguna pantalla de registro: el layout invitaba a registrarse
 * para tener descuentos de socio, pero no había adónde ir. La única alta era la
 * del mostrador, dentro de la página de taquilla y para uso del personal.
 *
 * Las reglas de validación son las mismas que valida el backend. Se comprueban
 * también aquí para que el usuario las vea mientras escribe, no para
 * sustituirlas: la autoridad es el servidor, y sus errores por campo se pintan
 * igualmente al enviar.
 */

const MIN_PASSWORD = 8;

/** Edad mínima para tener cuenta propia y poder comprar sin acompañante. */
const MIN_AGE = 14;

function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

export default function ShopRegisterPage() {
  const { register, error, fieldErrors } = useShopAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    name: '', lastName: '', email: '', password: '', birthDate: '',
  });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Si llega desde una compra interrumpida, se vuelve allí al terminar.
  const returnTo = searchParams.get('returnTo') ?? '/shop';

  const passwordChecks = useMemo(() => ({
    length: form.password.length >= MIN_PASSWORD,
    letter: /[a-zA-Z]/.test(form.password),
    digit: /\d/.test(form.password),
  }), [form.password]);

  const localErrors = useMemo(() => {
    const errors = {};
    if (touched.name && form.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres.';
    }
    if (touched.lastName && form.lastName.trim().length < 2) {
      errors.lastName = 'Los apellidos deben tener al menos 2 caracteres.';
    }
    if (touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Introduce un email válido.';
    }
    if (touched.password && !(passwordChecks.length && passwordChecks.letter && passwordChecks.digit)) {
      errors.password = 'La contraseña no cumple los requisitos.';
    }
    if (touched.birthDate) {
      if (!form.birthDate) {
        errors.birthDate = 'La fecha de nacimiento es obligatoria.';
      } else if (new Date(form.birthDate) >= new Date()) {
        errors.birthDate = 'La fecha debe ser anterior a hoy.';
      } else if (calculateAge(form.birthDate) < MIN_AGE) {
        errors.birthDate = `Debes tener al menos ${MIN_AGE} años para crear una cuenta.`;
      }
    }
    return errors;
  }, [form, touched, passwordChecks]);

  const isComplete =
    form.name.trim().length >= 2 &&
    form.lastName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    passwordChecks.length && passwordChecks.letter && passwordChecks.digit &&
    form.birthDate && new Date(form.birthDate) < new Date() &&
    calculateAge(form.birthDate) >= MIN_AGE;

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const markTouched = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // El error del servidor manda sobre el local: es la comprobación real.
  const errorFor = (field) => fieldErrors?.[field] ?? localErrors[field];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ name: true, lastName: true, email: true, password: true, birthDate: true });
    if (!isComplete || submitting) return;

    setSubmitting(true);
    const ok = await register(form);
    setSubmitting(false);
    if (ok) navigate(returnTo, { replace: true });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <header className={styles.head}>
          <h1 className={styles.title}>Crear cuenta</h1>
          <p className={styles.subtitle}>
            Reserva tus butacas, guarda tus entradas y acumula visitas para el descuento de socio.
          </p>
        </header>

        {error && (
          <p className={styles.formError} role="alert">{error}</p>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.row}>
            <Field
              id="name" label="Nombre" autoComplete="given-name"
              value={form.name} onChange={update('name')} onBlur={markTouched('name')}
              error={errorFor('name')}
            />
            <Field
              id="lastName" label="Apellidos" autoComplete="family-name"
              value={form.lastName} onChange={update('lastName')} onBlur={markTouched('lastName')}
              error={errorFor('lastName')}
            />
          </div>

          <Field
            id="email" label="Email" type="email" autoComplete="email"
            value={form.email} onChange={update('email')} onBlur={markTouched('email')}
            error={errorFor('email')}
          />

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Contraseña</label>
            <div className={styles.passwordWrap}>
              <input
                id="password"
                className={`${styles.input} ${errorFor('password') ? styles.inputError : ''}`}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={update('password')}
                onBlur={markTouched('password')}
                aria-invalid={Boolean(errorFor('password'))}
                aria-describedby="password-requirements"
              />
              <button
                type="button"
                className={styles.reveal}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <ul className={styles.requirements} id="password-requirements">
              <Requirement met={passwordChecks.length}>Al menos {MIN_PASSWORD} caracteres</Requirement>
              <Requirement met={passwordChecks.letter}>Una letra</Requirement>
              <Requirement met={passwordChecks.digit}>Un número</Requirement>
            </ul>
          </div>

          <Field
            id="birthDate" label="Fecha de nacimiento" type="date" autoComplete="bday"
            value={form.birthDate} onChange={update('birthDate')} onBlur={markTouched('birthDate')}
            error={errorFor('birthDate')}
            hint="La pedimos para aplicar la calificación por edad de cada película."
            max={new Date().toISOString().split('T')[0]}
          />

          <button className={styles.submit} type="submit" disabled={submitting}>
            {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className={styles.footer}>
          ¿Ya tienes cuenta? <Link className={styles.link} to="/shop">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ id, label, error, hint, ...inputProps }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <input
        id={id}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...inputProps}
      />
      {hint && <span className={styles.hint} id={`${id}-hint`}>{hint}</span>}
      {error && <span className={styles.error} role="alert">{error}</span>}
    </div>
  );
}

function Requirement({ met, children }) {
  return (
    <li className={met ? styles.reqMet : styles.reqPending}>
      {met ? <Check size={13} aria-hidden="true" /> : <X size={13} aria-hidden="true" />}
      <span>{children}</span>
      <span className={styles.srOnly}>{met ? ' cumplido' : ' pendiente'}</span>
    </li>
  );
}
