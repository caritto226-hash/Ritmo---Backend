const bcrypt = require('bcrypt');
const usersRepository = require('./users.repository');

async function create(userData) {
	const { nombre: name, correo: email, password, idRol: roleId } = userData;

	const existingUser = await usersRepository.findByEmail(email);

	if (existingUser) {
		const error = new Error('El correo ya está registrado');
		error.statusCode = 409;
		throw error;
	}

	const existingRole = await usersRepository.findRoleById(roleId);

	if (!existingRole) {
		const error = new Error('El rol no existe');
		error.statusCode = 404;
		throw error;
	}

	const passwordHash = await bcrypt.hash(password, 10);

	const createdUser = await usersRepository.create({
		name,
		email,
		passwordHash,
		roleId,
	});

	return createdUser;
}

async function getAll() {
	const users = await usersRepository.findAll();
	return users;
}

async function getById(id) {
	const user = await usersRepository.findById(id);

	if (!user) {
		const error = new Error('Usuario no encontrado');
		error.statusCode = 404;
		throw error;
	}

	return user;
}

async function update(id, data) {
	const existingUser = await usersRepository.findById(id);
	if (!existingUser) {
		const error = new Error('Usuario no encontrado');
		error.statusCode = 404;
		throw error;
	}

	const { nombre: name, correo: email, idRol: roleId } = data;

	const emailInUse = await usersRepository.findByEmailExcludingId(email, id);
	if (emailInUse) {
		const error = new Error('El correo ya está en uso por otro usuario');
		error.statusCode = 409;
		throw error;
	}

	const role = await usersRepository.findRoleById(roleId);
	if (!role) {
		const error = new Error('El rol especificado no existe');
		error.statusCode = 404;
		throw error;
	}

	const updatedUser = await usersRepository.update(id, { name, email, roleId });
	return updatedUser;
}

async function changeStatus(id, status) {
	const existingUser = await usersRepository.findById(id);
	if (!existingUser) {
		const error = new Error('Usuario no encontrado');
		error.statusCode = 404;
		throw error;
	}

	await usersRepository.changeStatus(id, status);
}

async function remove(id) {
	const existingUser = await usersRepository.findById(id);
	if (!existingUser) {
		const error = new Error('Usuario no encontrado');
		error.statusCode = 404;
		throw error;
	}

	await usersRepository.softDelete(id);
}

module.exports = {
	create,
	getAll,
	getById,
	update,
	changeStatus,
	remove,
};