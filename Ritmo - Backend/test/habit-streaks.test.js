const test = require('node:test');
const assert = require('node:assert/strict');
const { computeStreaks } = require('../src/utils/habit-streaks');
const { addDaysToDate } = require('../src/utils/dates');

// 2026-11-02 es lunes; 2026-11-08, domingo.
function days(from, to) {
	const list = [];
	for (let date = from; date <= to; date = addDaysToDate(date, 1)) list.push(date);
	return list;
}

function done(habitId, dates) {
	return dates.map((date) => ({ habitId, date }));
}

const daily = (id, startDate = '2026-10-01') => ({ id, daysMask: 127, startDate });
const weekdays = (id, startDate = '2026-10-01') => ({ id, daysMask: 31, startDate });

function habitStreak(result, habitId) {
	return result.habits.find((habit) => habit.habitId === habitId).streak;
}

test('hoy sin cumplir no corta la racha', () => {
	const result = computeStreaks([daily(1)], done(1, days('2026-11-02', '2026-11-07')), '2026-11-08');
	assert.deepEqual(habitStreak(result, 1), { current: 6, best: 6 });
});

test('hoy cumplido suma a la racha', () => {
	const result = computeStreaks([daily(1)], done(1, days('2026-11-02', '2026-11-08')), '2026-11-08');
	assert.deepEqual(habitStreak(result, 1), { current: 7, best: 7 });
});

test('un día anterior sin cumplir corta la racha y la mejor se conserva', () => {
	const completions = done(1, [...days('2026-10-20', '2026-10-29'), ...days('2026-11-05', '2026-11-07')]);
	const result = computeStreaks([daily(1)], completions, '2026-11-08');
	assert.deepEqual(habitStreak(result, 1), { current: 3, best: 10 });
});

test('los días que no aplican se saltan (lunes a viernes)', () => {
	const completions = done(1, [...days('2026-10-26', '2026-10-30'), ...days('2026-11-02', '2026-11-06')]);
	// Domingo: el fin de semana no corta la racha.
	assert.deepEqual(habitStreak(computeStreaks([weekdays(1)], completions, '2026-11-08'), 1), { current: 10, best: 10 });
	// Lunes siguiente sin cumplir todavía: sigue en 10.
	assert.deepEqual(habitStreak(computeStreaks([weekdays(1)], completions, '2026-11-09'), 1), { current: 10, best: 10 });
});

test('los días antes de start_date no cuentan como incumplidos', () => {
	const result = computeStreaks([daily(1, '2026-11-05')], done(1, days('2026-11-05', '2026-11-07')), '2026-11-08');
	assert.deepEqual(habitStreak(result, 1), { current: 3, best: 3 });
});

test('sin registros la racha es 0', () => {
	const result = computeStreaks([daily(1)], [], '2026-11-08');
	assert.deepEqual(habitStreak(result, 1), { current: 0, best: 0 });
	assert.deepEqual(result.streak, { current: 0, best: 0 });
});

test('racha global: un día cuenta si se cumplieron todos los que aplicaban', () => {
	const completions = [
		...done(1, days('2026-11-02', '2026-11-07')),
		...done(2, [...days('2026-11-02', '2026-11-05'), '2026-11-07']),
	];
	const result = computeStreaks([daily(1), daily(2)], completions, '2026-11-08');
	// El 6 faltó el hábito 2: la racha global va del 7 (1 día); la mejor, del 2 al 5 (4 días).
	assert.deepEqual(result.streak, { current: 1, best: 4 });
	assert.deepEqual(habitStreak(result, 1), { current: 6, best: 6 });
	assert.deepEqual(habitStreak(result, 2), { current: 1, best: 4 });
});

test('racha global: un hábito de lunes a viernes no exige nada el fin de semana', () => {
	const completions = [
		...done(1, days('2026-11-02', '2026-11-07')),
		...done(2, days('2026-11-02', '2026-11-06')),
	];
	const result = computeStreaks([daily(1, '2026-11-02'), weekdays(2, '2026-11-02')], completions, '2026-11-08');
	assert.deepEqual(result.streak, { current: 6, best: 6 });
});

test('racha global: los días sin ningún hábito que aplique se saltan', () => {
	const result = computeStreaks([weekdays(1, '2026-11-02')], done(1, days('2026-11-02', '2026-11-06')), '2026-11-09');
	assert.deepEqual(result.streak, { current: 5, best: 5 });
});

test('se ignoran registros de hábitos que no están en la lista (borrados)', () => {
	const result = computeStreaks([daily(1, '2026-11-07')], [...done(1, ['2026-11-07']), ...done(99, ['2026-11-07'])], '2026-11-08');
	assert.deepEqual(habitStreak(result, 1), { current: 1, best: 1 });
	assert.equal(result.habits.length, 1);
});

test('sin hábitos', () => {
	assert.deepEqual(computeStreaks([], [], '2026-11-08'), { streak: { current: 0, best: 0 }, habits: [] });
});
