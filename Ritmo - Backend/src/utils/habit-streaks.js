const { addDaysToDate } = require('./dates');
const { appliesOnDate } = require('./habit-days');

/**
 * Rachas de hábitos. Solo cuentan los días en que el hábito aplica (days_mask) desde su
 * start_date; los demás se saltan sin cortar la racha. Hoy sin cumplir tampoco la corta: el día
 * todavía no termina, así que la racha actual llega hasta ayer.
 *
 * habits: [{ id, daysMask, startDate }]; completions: [{ habitId, date }] solo de días cumplidos
 * (amount >= target); today: YYYY-MM-DD en Bogotá.
 * Racha global: un día cuenta si se cumplieron todos los hábitos que aplicaban ese día; los días
 * sin ningún hábito que aplique se saltan.
 */
function computeStreaks(habits, completions, today) {
	const completedByHabit = new Map(habits.map((habit) => [habit.id, new Set()]));

	for (const { habitId, date } of completions) {
		completedByHabit.get(habitId)?.add(date);
	}

	const perHabit = new Map(habits.map((habit) => [habit.id, { run: 0, best: 0 }]));
	const overall = { run: 0, best: 0 };
	const firstDay = habits.reduce((first, habit) => (habit.startDate < first ? habit.startDate : first), today);

	for (let date = firstDay; date <= today; date = addDaysToDate(date, 1)) {
		const isToday = date === today;
		let applicable = 0;
		let completed = 0;

		for (const habit of habits) {
			if (date < habit.startDate || !appliesOnDate(habit.daysMask, date)) continue;

			const done = completedByHabit.get(habit.id).has(date);
			applicable += 1;
			if (done) completed += 1;
			advance(perHabit.get(habit.id), done, isToday);
		}

		if (applicable > 0) {
			advance(overall, completed === applicable, isToday);
		}
	}

	return {
		streak: { current: overall.run, best: overall.best },
		habits: habits.map((habit) => {
			const { run, best } = perHabit.get(habit.id);
			return { habitId: habit.id, streak: { current: run, best } };
		}),
	};
}

function advance(counter, done, isToday) {
	if (done) {
		counter.run += 1;
		counter.best = Math.max(counter.best, counter.run);
	} else if (!isToday) {
		counter.run = 0;
	}
}

module.exports = {
	computeStreaks,
};
