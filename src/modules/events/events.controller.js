const eventsService = require('./events.service');

async function create(req, res, next) {
	try {
		const event = await eventsService.createEvent(req.user.id, req.body);

		return res.status(201).json({ data: event });
	} catch (error) {
		return next(error);
	}
}

async function getEvents(req, res, next) {
	try {
		const events = await eventsService.getEvents(req.user.id);

		return res.status(200).json({ data: events });
	} catch (error) {
		return next(error);
	}
}

async function getEventById(req, res, next) {
	try {
		const eventId = Number(req.params.id);
		const event = await eventsService.getEventById(eventId, req.user.id);

		return res.status(200).json({ data: event });
	} catch (error) {
		return next(error);
	}
}

async function update(req, res, next) {
	try {
		const eventId = Number(req.params.id);
		const event = await eventsService.updateEvent(eventId, req.user.id, req.body);

		return res.status(200).json({ data: event });
	} catch (error) {
		return next(error);
	}
}

async function deleteEvent(req, res, next) {
	try {
		const eventId = Number(req.params.id);
		await eventsService.deleteEvent(eventId, req.user.id);

		return res.status(200).json({ message: 'Evento eliminado correctamente' });
	} catch (error) {
		return next(error);
	}
}

module.exports = {
	create,
	getEvents,
	getEventById,
	update,
	deleteEvent,
};
