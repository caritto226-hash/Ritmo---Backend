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

module.exports = {
	APP_TIME_ZONE,
	getDateInTimeZone,
	getTodayInBogota,
};
