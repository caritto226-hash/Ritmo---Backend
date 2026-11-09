const test = require('node:test');
const assert = require('node:assert/strict');
const {
	daysToMask,
	maskToDays,
	appliesOnDate,
	frequencyLabel,
	parseLegacyFrequency,
} = require('../src/utils/habit-days');
const { isValidDateKey, getIsoWeekday, diffInDays } = require('../src/utils/dates');

test('días ↔ máscara', () => {
	assert.equal(daysToMask([1, 2, 3, 4, 5, 6, 7]), 127);
	assert.equal(daysToMask([1, 2, 3, 4, 5]), 31);
	assert.equal(daysToMask([6, 7]), 96);
	assert.deepEqual(maskToDays(31), [1, 2, 3, 4, 5]);
	assert.deepEqual(maskToDays(daysToMask([7, 1, 3])), [1, 3, 7]);
});

test('aplica en una fecha según su día de la semana', () => {
	// 2026-11-02 es lunes y 2026-11-08 es domingo.
	assert.equal(appliesOnDate(31, '2026-11-02'), true);
	assert.equal(appliesOnDate(31, '2026-11-08'), false);
	assert.equal(appliesOnDate(96, '2026-11-08'), true);
	assert.equal(appliesOnDate(127, '2026-11-05'), true);
});

test('etiqueta de frecuencia', () => {
	assert.equal(frequencyLabel(127), 'Todos los días');
	assert.equal(frequencyLabel(31), 'Lunes a viernes');
	assert.equal(frequencyLabel(96), 'Fines de semana');
	assert.equal(frequencyLabel(daysToMask([1, 3, 5])), 'L, X, V');
});

test('texto libre anterior: igual que la migración', () => {
	assert.equal(parseLegacyFrequency('Diario'), 127);
	assert.equal(parseLegacyFrequency('  DIÁRIO '), 127);
	assert.equal(parseLegacyFrequency(''), 127);
	assert.equal(parseLegacyFrequency(null), 127);
	assert.equal(parseLegacyFrequency('Lunes a viernes'), 31);
	assert.equal(parseLegacyFrequency(' lunes   A  VIERNES '), 31);
	assert.equal(parseLegacyFrequency('Fines de Semana'), 96);
	assert.equal(parseLegacyFrequency('3 veces por semana'), 127);
	assert.equal(parseLegacyFrequency('Lunes, miércoles y viernes'), 127);
});

test('fechas YYYY-MM-DD', () => {
	assert.equal(isValidDateKey('2026-02-28'), true);
	assert.equal(isValidDateKey('2028-02-29'), true);
	assert.equal(isValidDateKey('2026-02-30'), false);
	assert.equal(isValidDateKey('2026-2-3'), false);
	assert.equal(isValidDateKey(20261108), false);
	assert.equal(getIsoWeekday('2026-11-02'), 1);
	assert.equal(getIsoWeekday('2026-11-08'), 7);
	assert.equal(diffInDays('2026-11-01', '2026-11-08'), 7);
	assert.equal(diffInDays('2026-11-08', '2026-11-01'), -7);
});
