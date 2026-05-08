import { Temporal } from 'temporal-polyfill';

const BOGOTA = 'America/Bogota';

const parseToBogota = (date) => {
  if (!date) return null;
  if (date instanceof Date) {
    return Temporal.Instant.fromEpochMilliseconds(date.getTime()).toZonedDateTimeISO(BOGOTA);
  }
  if (typeof date === 'number') {
    return Temporal.Instant.fromEpochMilliseconds(date).toZonedDateTimeISO(BOGOTA);
  }
  try {
    return Temporal.Instant.from(date).toZonedDateTimeISO(BOGOTA);
  } catch {
    return Temporal.PlainDate.from(String(date)).toZonedDateTime({ timeZone: BOGOTA });
  }
};

const formatDateSlash = (date) => {
  const zdt = parseToBogota(date);
  if (!zdt) return '____';
  return `${String(zdt.day).padStart(2, '0')}/${String(zdt.month).padStart(2, '0')}/${zdt.year}`;
};

const formatDateLong = (date) => {
  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const zdt = parseToBogota(date);
  if (!zdt) return '____';
  const mes = MESES[zdt.month - 1];
  return `${zdt.day} de ${mes.charAt(0).toUpperCase() + mes.slice(1)} de ${zdt.year}`;
};

let passed = 0, failed = 0;
const test = (label, result, expected) => {
  const ok = result === expected;
  console.log(`${ok ? '✓' : '✗'} ${label}`);
  if (!ok) console.log(`    expected: ${expected}\n    got:      ${result}`);
  ok ? passed++ : failed++;
};

// ── FechaCreacion: JS Date (TIMESTAMP from Sequelize/pg) ──
// User at 10:59 PM Bogota May 7 → UTC = May 8 03:59 AM
const certDate1 = new Date('2026-05-08T03:59:38.000Z');
test('FechaCreacion: 10:59 PM Bogota May 7 (UTC May 8 03:59)', formatDateSlash(certDate1), '07/05/2026');

// User at 2:01 AM Bogota May 8 (UTC May 8 07:01) → already May 8 in Bogota
const certDate2 = new Date('2026-05-08T07:01:00.000Z');
test('FechaCreacion: 2:01 AM Bogota May 8 (UTC May 8 07:01)', formatDateSlash(certDate2), '08/05/2026');

// User at 9:01 PM Bogota May 7 (UTC May 8 02:01)
const certDate3 = new Date('2026-05-08T02:01:00.000Z');
test('FechaCreacion: 9:01 PM Bogota May 7 (UTC May 8 02:01)', formatDateSlash(certDate3), '07/05/2026');

// Midday Bogota May 7 (UTC May 7 17:00)
const certDate4 = new Date('2026-05-07T17:00:00.000Z');
test('FechaCreacion: 12 PM Bogota May 7 (UTC May 7 17:00)', formatDateSlash(certDate4), '07/05/2026');

// ── Period/assembly dates: plain strings from pg DATE columns (Bogota calendar dates) ──
test('periodoInicio: "2016-07-01" → July 1 2016', formatDateSlash('2016-07-01'), '01/07/2016');
test('periodoFin: "2020-07-01" → July 1 2020', formatDateSlash('2020-07-01'), '01/07/2020');
test('personeriaFecha "2019-01-30" → Jan 30 2019', formatDateSlash('2019-01-30'), '30/01/2019');
test('formatDateLong "2016-07-01"', formatDateLong('2016-07-01'), '1 de Julio de 2016');
test('formatDateLong "2020-07-01"', formatDateLong('2020-07-01'), '1 de Julio de 2020');

// ── ISO string with Z (if Sequelize returns this format) ──
test('ISO Z string "2026-05-08T02:01:00Z" → Bogota May 7', formatDateSlash('2026-05-08T02:01:00Z'), '07/05/2026');

console.log(`\n${passed} passed, ${failed} failed`);
