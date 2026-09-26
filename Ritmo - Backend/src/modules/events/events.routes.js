const express = require('express');
const {
	validateCreateEvent,
	validateUpdateEvent,
} = require('./events.validator');
const eventsController = require('./events.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/', verifyToken, validateCreateEvent, eventsController.create);
router.get('/', verifyToken, eventsController.getEvents);
router.get('/:id', verifyToken, eventsController.getEventById);
router.put('/:id', verifyToken, validateUpdateEvent, eventsController.update);
router.delete('/:id', verifyToken, eventsController.deleteEvent);

module.exports = router;
