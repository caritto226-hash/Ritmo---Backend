const test = require('node:test');
const assert = require('node:assert/strict');
// Solo se prueban las reglas puras del servicio: no hacen consultas a MySQL.
const { resolveGoal, validateLogDate } = require('../src/modules/habits/habits.service');

const CHECK = { goalType: 'check', goal: null, unit: null };
const WATER = { goalType: 'count', goal: 8, unit: 'vasos' };

function assertBadRequest(fn, pattern) {
	assert.throws(fn, (error) => error.statusCode === 400 && pattern.test(error.message));
}

test('resolveGoal: crear', () => {
	assert.deepEqual(resolveGoal(CHECK, {}), CHECK);
	assert.deepEqual(resolveGoal(CHECK, { goalType: 'count', goal: 8, unit: 'vasos' }), WATER);
	assert.deepEqual(resolveGoal(CHECK, { goalType: 'count', goal: 5 }), { goalType: 'count', goal: 5, unit: null });
	assert.deepEqual(resolveGoal(CHECK, { goalType: 'duration', goal: 30, unit: 'min' }), { goalType: 'duration', goal: 30, unit: null });
	assert.deepEqual(resolveGoal(CHECK, { goalType: 'check', goal: 8, unit: 'vasos' }), CHECK);
});

test('resolveGoal: sin goalType la meta decide (clientes anteriores)', () => {
	assert.deepEqual(resolveGoal(CHECK, { goal: 8 }), { goalType: 'count', goal: 8, unit: null });
	assert.deepEqual(resolveGoal(CHECK, { goal: 1 }), CHECK);
	assert.deepEqual(resolveGoal(CHECK, { goal: null }), CHECK);
	assert.deepEqual(resolveGoal(WATER, { goal: 10 }), { goalType: 'count', goal: 10, unit: 'vasos' });
});

test('resolveGoal: editar conserva lo que no llega', () => {
	assert.deepEqual(resolveGoal(WATER, { unit: 'tazas' }), { goalType: 'count', goal: 8, unit: 'tazas' });
	assert.deepEqual(resolveGoal(WATER, { goalType: 'check' }), CHECK);
	assert.deepEqual(resolveGoal(WATER, { goalType: 'duration' }), { goalType: 'duration', goal: 8, unit: null });
});

test('resolveGoal: meta obligatoria y tope por tipo', () => {
	assertBadRequest(() => resolveGoal(CHECK, { goalType: 'count' }), /cantidad.*entre 1 y 999/);
	assertBadRequest(() => resolveGoal(CHECK, { goalType: 'count', goal: 1000 }), /999/);
	assertBadRequest(() => resolveGoal(CHECK, { goalType: 'duration', goal: null }), /tiempo.*1440/);
	assert.deepEqual(resolveGoal(CHECK, { goalType: 'duration', goal: 1440 }), { goalType: 'duration', goal: 1440, unit: null });
});

test('validateLogDate: ventana de 7 días, sin futuro, desde start_date y solo días que aplican', () => {
	const today = '2026-11-08'; // domingo
	const daily = { days: [1, 2, 3, 4, 5, 6, 7], startDate: '2026-10-01' };
	const weekdays = { days: [1, 2, 3, 4, 5], startDate: '2026-10-01' };

	assert.doesNotThrow(() => validateLogDate(daily, today, today));
	assert.doesNotThrow(() => validateLogDate(daily, '2026-11-02', today));
	assertBadRequest(() => validateLogDate(daily, '2026-11-01', today), /6 días atrás/);
	assertBadRequest(() => validateLogDate(daily, '2026-11-09', today), /futuros/);
	assertBadRequest(() => validateLogDate({ ...daily, startDate: '2026-11-06' }, '2026-11-05', today), /no existía/);
	assertBadRequest(() => validateLogDate(weekdays, '2026-11-07', today), /no aplica/);
	assert.doesNotThrow(() => validateLogDate(weekdays, '2026-11-06', today));
});
