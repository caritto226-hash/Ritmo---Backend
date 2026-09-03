const usersService = require('./users.service');

async function createUser(req, res, next) {
	try {
		const user = await usersService.create(req.body);

		return res.status(201).json(user);
	} catch (error) {
		return next(error);
	}
}

module.exports = {
	createUser,
};
