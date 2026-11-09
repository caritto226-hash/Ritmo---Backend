const test = require('node:test');
const assert = require('node:assert/strict');
const {
	validateCreateHabit,
	validateUpdateHabit,
	validateHabitStatus,
	validateHabitProgress,
	validateProgressRange,
} = require('../src/modules/habits/habits.validator');

// Ejecuta un middleware y devuelve { error, req }: error es lo que recibió next (o null).
function run(middleware, { body, query } = {}) {
	const req = { body, query: query || {} };
	let error = 'next no fue llamado';
	middleware(req, {}, (value) => {
		error = value ?? null;
	});
	return { error, req };
}

function assertRejects(middleware, input, pattern) {
	const { error } = run(middleware, input);
	assert.ok(error instanceof Error, `se esperaba un error para ${JSON.stringify(input)}`);
	assert.equal(error.statusCode, 400);
	if (pattern) assert.match(error.message, pattern);
}

test('crear con días: máscara y etiqueta generada', () => {
	const { error, req } = run(validateCreateHabit, {
		body: { name: '  Leer ', days: [5, 1, 2, 3, 4], frequency: 'ignorado', goalType: 'duration', goal: 30 },
	});
	assert.equal(error, null);
	assert.deepEqual(req.body, {
		name: 'Leer',
		daysMask: 31,
		frequency: 'Lunes a viernes',
		goalType: 'duration',
		goal: 30,
		categoryId: null,
		reminderTime: null,
	});
});

test('crear con frecuencia de texto (cliente anterior)', () => {
	const cases = [
		['Diario', 127],
		[' fines de SEMANA ', 96],
		['Lunes a viernes', 31],
		['3 veces por semana', 127],
	];
	for (const [frequency, daysMask] of cases) {
		const { error, req } = run(validateCreateHabit, { body: { name: 'Agua', frequency, goal: 8 } });
		assert.equal(error, null);
		assert.equal(req.body.daysMask, daysMask);
		assert.equal(req.body.frequency, frequency.trim());
		assert.equal(req.body.goal, 8);
		assert.equal(req.body.goalType, undefined);
	}
});

test('crear exige al menos un día', () => {
	assertRejects(validateCreateHabit, { body: { name: 'Agua' } }, /día de la semana/);
	assertRejects(validateCreateHabit, { body: { name: 'Agua', frequency: '   ' } }, /frecuencia/);
});

test('days inválidos', () => {
	for (const days of [[], [0], [8], [1, 1], ['1'], [1.5], '1,2', null]) {
		assertRejects(validateCreateHabit, { body: { name: 'Agua', days } }, /days/);
	}
});

test('tipo, meta y unidad: forma', () => {
	assertRejects(validateCreateHabit, { body: { name: 'A', days: [1], goalType: 'timer' } }, /goalType/);
	for (const goal of [0, -1, 1.5, '8', 1441]) {
		assertRejects(validateCreateHabit, { body: { name: 'A', days: [1], goalType: 'count', goal } }, /meta/);
	}
	assertRejects(validateCreateHabit, { body: { name: 'A', days: [1], unit: 5 } }, /unidad/);
	assertRejects(validateCreateHabit, { body: { name: 'A', days: [1], unit: 'x'.repeat(21) } }, /20 caracteres/);

	const blank = run(validateCreateHabit, { body: { name: 'A', days: [1], goalType: 'count', goal: 8, unit: '   ' } });
	assert.equal(blank.req.body.unit, null);
	const accented = run(validateCreateHabit, { body: { name: 'A', days: [1], goalType: 'count', goal: 8, unit: ` ${'á'.repeat(20)} ` } });
	assert.equal(accented.error, null);
	assert.equal(accented.req.body.unit, 'á'.repeat(20));
});

test('editar: solo los campos enviados', () => {
	const { error, req } = run(validateUpdateHabit, { body: { days: [6, 7], unit: 'tazas' } });
	assert.equal(error, null);
	assert.deepEqual(req.body, { daysMask: 96, frequency: 'Fines de semana', unit: 'tazas' });
	assertRejects(validateUpdateHabit, { body: {} }, /al menos un campo/);
	assertRejects(validateUpdateHabit, { body: { days: [] } }, /days/);
});

test('estado con fecha opcional', () => {
	const today = run(validateHabitStatus, { body: { status: ' Completado ' } });
	assert.deepEqual(today.req.body, { status: 'completado', date: null });
	const past = run(validateHabitStatus, { body: { status: 'pendiente', date: '2026-11-05' } });
	assert.deepEqual(past.req.body, { status: 'pendiente', date: '2026-11-05' });
	assertRejects(validateHabitStatus, { body: { status: 'hecho' } }, /estado/);
	assertRejects(validateHabitStatus, { body: { status: 'completado', date: '2026-02-30' } }, /fecha/);
});

test('avance: amount o delta, solo uno', () => {
	assert.deepEqual(run(validateHabitProgress, { body: { amount: 0 } }).req.body, { date: null, amount: 0, delta: null });
	assert.deepEqual(
		run(validateHabitProgress, { body: { delta: -1, date: '2026-11-07' } }).req.body,
		{ date: '2026-11-07', amount: null, delta: -1 },
	);
	assertRejects(validateHabitProgress, { body: {} }, /solo uno/);
	assertRejects(validateHabitProgress, { body: { amount: 2, delta: 1 } }, /solo uno/);
	for (const amount of [-1, 10000, 1.5, '3']) {
		assertRejects(validateHabitProgress, { body: { amount } }, /avance/);
	}
	for (const delta of [0, 10000, -10000, 0.5]) {
		assertRejects(validateHabitProgress, { body: { delta } }, /sumar/);
	}
	assertRejects(validateHabitProgress, { body: { amount: 1, date: '07-11-2026' } }, /fecha/);
});

test('rango del historial', () => {
	assert.equal(run(validateProgressRange, { query: { from: '2026-10-05', to: '2026-11-08' } }).error, null);
	assert.equal(run(validateProgressRange, { query: { from: '2026-01-01', to: '2027-01-01' } }).error, null);
	assertRejects(validateProgressRange, { query: { from: '2026-01-01', to: '2027-01-02' } }, /366/);
	assertRejects(validateProgressRange, { query: { from: '2026-11-08' } }, /obligatorias/);
	assertRejects(validateProgressRange, { query: { from: '2026-11-09', to: '2026-11-08' } }, /posterior/);
	assertRejects(validateProgressRange, { query: { from: '2026-11-01', to: '2026-11-31' } }, /formato/);
});
