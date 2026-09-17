const usersService = require('./users.service');

async function createUser(req, res, next) {
	try {
		const user = await usersService.create(req.body);

		return res.status(201).json(user);
	} catch (error) {
		return next(error);
	}
}

async function getAll(req, res, next) {
	try {
		const users = await usersService.getAll();

		return res.status(200).json(users);
	} catch (error) {
		return next(error);
	}
}

async function getById(req, res, next) {
	try {
		const { id } = req.params;
		const user = await usersService.getById(id);

		return res.status(200).json(user);
	} catch (error) {
		return next(error);
	}
}


async function update(req, res, next) {
	try {
		const { id } = req.params;
		const updatedUser = await usersService.update(id, req.body);

		return res.status(200).json(updatedUser);
	} catch (error) {
		return next(error);
	}
}

async function changeStatus(req, res, next) {
	try {
		const { id } = req.params;
		const { status } = req.body;

		await usersService.changeStatus(id, status);

		return res.status(200).json({ message: 'Estado actualizado correctamente' });
	} catch (error) {
		return next(error);
	}
}


async function remove(req, res, next) {
	try {
		const { id } = req.params;

		await usersService.remove(id);

		return res.status(200).json({ message: 'User deleted successfully' });
	} catch (error) {
		return next(error);
	}
}


module.exports = {
	createUser,
	getAll,
	getById,
	update,
	changeStatus,
	remove,
};
