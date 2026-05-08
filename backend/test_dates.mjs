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
    return Temporal.PlainDate.from(String(date))
      .toZonedDateTime({ timeZone: 'UTC' })
      .toInstant()
      .toZonedDateTimeISO(BOGOTA);
  }
};

const formatDateSlash = (date) => {
  const zdt = parseToBogota(date);
  if (!zdt) return '____';
  return `${String(zdt.day).padStart(2, '0')}/${String(zdt.month).padStart(2, '0')}/${zdt.year}`;
};

// ── Test cases ──

// Case 1: JS Date at 9:01 PM Bogota = 02:01 AM UTC May 8
const d1 = new Date('2026-05-08T02:01:00.000Z');
console.log('=== Case 1: JS Date (UTC May 8 02:01) ===');
console.log('instanceof Date:', d1 instanceof Date);
console.log('getTime():', d1.getTime());
console.log('formatDateSlash:', formatDateSlash(d1));
console.log('Expected: 07/05/2026');
console.log('PASS:', formatDateSlash(d1) === '07/05/2026');
console.log();

// Case 2: JS Date at 1 AM Bogota = 06:00 AM UTC (both on same date)
const d2 = new Date('2026-05-07T06:00:00.000Z');
console.log('=== Case 2: JS Date (UTC May 7 06:00 = Bogota May 7 01:00) ===');
console.log('formatDateSlash:', formatDateSlash(d2));
console.log('Expected: 07/05/2026');
console.log('PASS:', formatDateSlash(d2) === '07/05/2026');
console.log();

// Case 3: String like what Sequelize/pg might return for TIMESTAMPTZ
const d3 = '2026-05-08 02:01:00.000+00';
console.log('=== Case 3: PostgreSQL-style string "2026-05-08 02:01:00.000+00" ===');
console.log('formatDateSlash:', formatDateSlash(d3));
console.log('Expected: 07/05/2026');
console.log('PASS:', formatDateSlash(d3) === '07/05/2026');
console.log();

// Case 4: ISO string with Z
const d4 = '2026-05-08T02:01:00.000Z';
console.log('=== Case 4: ISO string with Z ===');
console.log('formatDateSlash:', formatDateSlash(d4));
console.log('Expected: 07/05/2026');
console.log('PASS:', formatDateSlash(d4) === '07/05/2026');
console.log();

// Case 5: Plain date string (what pg returns for DATE columns)
const d5 = '2026-05-08';
console.log('=== Case 5: Plain date string "2026-05-08" (pg DATE column) ===');
console.log('formatDateSlash:', formatDateSlash(d5));
console.log('Expected: 07/05/2026 (UTC midnight converts to Bogota May 7)');
console.log('PASS:', formatDateSlash(d5) === '07/05/2026');
console.log();

// Case 6: What if the DATE was stored as May 7 (Bogota date)?
const d6 = '2026-05-07';
console.log('=== Case 6: Plain date string "2026-05-07" (Bogota date stored) ===');
console.log('formatDateSlash:', formatDateSlash(d6));
console.log('Expected depends on how date was stored:');
console.log('  If stored as Bogota date: should be 07/05/2026');
console.log('  But UTC catch converts: UTC midnight May 7 = Bogota May 6 at 7PM');
console.log('formatDateSlash result:', formatDateSlash(d6), '(= 06/05/2026 due to UTC catch)');
console.log();

// Case 7: new Date() right now
const d7 = new Date();
console.log('=== Case 7: new Date() right now ===');
console.log('UTC time:', d7.toISOString());
console.log('formatDateSlash:', formatDateSlash(d7));
console.log();

// Case 8: Sequelize might return a Date with different internal representation
// Simulate what might happen if Sequelize timezone is set and double-offsets
const d8 = new Date('2026-05-08T07:01:00.000Z'); // 9:01 PM Bogota but with +5h error
console.log('=== Case 8: JS Date with +5h error (2026-05-08T07:01Z = midnight May 8 Bogota) ===');
console.log('formatDateSlash:', formatDateSlash(d8));
console.log('This would show 08/05/2026 if this is what parseToBogota receives');
console.log();

console.log('=== Temporal.Instant.from() test with PostgreSQL string ===');
try {
  const r = Temporal.Instant.from('2026-05-08 02:01:00.000+00');
  console.log('Temporal.Instant.from("2026-05-08 02:01:00.000+00") SUCCEEDED:', r.toString());
} catch(e) {
  console.log('Temporal.Instant.from("2026-05-08 02:01:00.000+00") FAILED:', e.message);
}

try {
  const r = Temporal.Instant.from('2026-05-08 02:01:00+00:00');
  console.log('Temporal.Instant.from("2026-05-08 02:01:00+00:00") SUCCEEDED:', r.toString());
} catch(e) {
  console.log('Temporal.Instant.from("2026-05-08 02:01:00+00:00") FAILED:', e.message);
}
