const recurrencesService = require('./recurrences.service');

async function createRecurrence(req, res, next) {
	try {
		const recurrence = await recurrencesService.createRecurrence(req.user.id, req.body);
		return res.status(201).json({ data: recurrence });
	} catch (error) {
		return next(error);
	}
}

async function getReminders(req, res, next) {
	try {
		const reminders = await recurrencesService.getReminders(req.user.id);
		return res.status(200).json({ data: reminders });
	} catch (error) {
		return next(error);
	}
}

async function confirmOccurrence(req, res, next) {
	try {
		const result = await recurrencesService.confirmOccurrence(
			Number(req.params.occurrenceId),
			req.user.id,
			req.body.paidDate,
		);
		return res.status(200).json({ data: result });
	} catch (error) {
		return next(error);
	}
}

async function cancelRecurrence(req, res, next) {
	try {
		const result = await recurrencesService.cancelRecurrence(
			Number(req.params.id),
			req.user.id,
			req.query.scope,
		);
		return res.status(200).json({ data: result });
	} catch (error) {
		return next(error);
	}
}

module.exports = {
	createRecurrence,
	getReminders,
	confirmOccurrence,
	cancelRecurrence,
};
