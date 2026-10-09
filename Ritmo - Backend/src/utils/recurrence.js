function getNextDate(dateValue, frequency, anchorDay, anchorMonth) {
	const [year, month, day] = String(dateValue).slice(0, 10).split('-').map(Number);
	const current = new Date(Date.UTC(year, month - 1, day));

	if (frequency === 'daily') {
		current.setUTCDate(current.getUTCDate() + 1);
	} else if (frequency === 'weekly') {
		current.setUTCDate(current.getUTCDate() + 7);
	} else if (frequency === 'monthly') {
		const nextMonth = new Date(Date.UTC(year, month, 1));
		const lastDay = new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth() + 1, 0)).getUTCDate();
		nextMonth.setUTCDate(Math.min(anchorDay, lastDay));
		return formatDate(nextMonth);
	} else if (frequency === 'yearly') {
		const nextYear = year + 1;
		const lastDay = new Date(Date.UTC(nextYear, anchorMonth, 0)).getUTCDate();
		return formatDate(new Date(Date.UTC(nextYear, anchorMonth - 1, Math.min(anchorDay, lastDay))));
	}

	return formatDate(current);
}

function formatDate(date) {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

module.exports = { getNextDate };
