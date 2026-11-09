const { getIsoWeekday } = require('./dates');

// habits.days_mask: bit 0 = lunes … bit 6 = domingo. Los días viajan en la API como números ISO
// (1 = lunes … 7 = domingo).
const ALL_DAYS_MASK = 127;
const WEEKDAYS_MASK = 31;
const WEEKEND_MASK = 96;
const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function daysToMask(days) {
	return days.reduce((mask, day) => mask | (1 << (day - 1)), 0);
}

function maskToDays(mask) {
	return [1, 2, 3, 4, 5, 6, 7].filter((day) => (mask & (1 << (day - 1))) !== 0);
}

function appliesOnDate(mask, dateValue) {
	return (mask & (1 << (getIsoWeekday(dateValue) - 1))) !== 0;
}

// Etiqueta que se guarda en habits.frequency para los clientes que solo leen ese texto.
function frequencyLabel(mask) {
	if (mask === ALL_DAYS_MASK) return 'Todos los días';
	if (mask === WEEKDAYS_MASK) return 'Lunes a viernes';
	if (mask === WEEKEND_MASK) return 'Fines de semana';

	return maskToDays(mask).map((day) => DAY_LETTERS[day - 1]).join(', ');
}

// Misma lectura que la migración 2026-11-08-habits-v2.sql: "Diario" o vacío, "Lunes a viernes" y
// "Fines de semana", sin importar mayúsculas, tildes ni espacios repetidos. Cualquier otro texto
// pasa a todos los días.
function parseLegacyFrequency(text) {
	const normalized = String(text ?? '')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.trim()
		.replace(/\s+/g, ' ');

	if (normalized === 'lunes a viernes') return WEEKDAYS_MASK;
	if (normalized === 'fines de semana') return WEEKEND_MASK;

	return ALL_DAYS_MASK;
}

module.exports = {
	ALL_DAYS_MASK,
	daysToMask,
	maskToDays,
	appliesOnDate,
	frequencyLabel,
	parseLegacyFrequency,
};
