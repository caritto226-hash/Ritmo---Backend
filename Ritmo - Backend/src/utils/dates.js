// Zona horaria de la aplicación: todas las fechas "de hoy" se calculan en Bogotá,
// sin depender de la zona del servidor ni de la de MySQL.
const APP_TIME_ZONE = 'America/Bogota';

function getDateInTimeZone(date = new Date(), timeZone = APP_TIME_ZONE) {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(date);
	const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

	return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function getTodayInBogota() {
	return getDateInTimeZone(new Date(), APP_TIME_ZONE);
}

// Suma (o resta, con días negativos) días a una fecha YYYY-MM-DD sin pasar por la zona local.
function addDaysToDate(dateValue, days) {
	const [year, month, day] = dateValue.split('-').map(Number);
	const date = new Date(Date.UTC(year, month - 1, day + days));

	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

module.exports = {
	APP_TIME_ZONE,
	getDateInTimeZone,
	getTodayInBogota,
	addDaysToDate,
};
