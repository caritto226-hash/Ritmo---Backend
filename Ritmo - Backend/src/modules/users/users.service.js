const bcrypt = require('bcrypt');
const usersRepository = require('./users.repository');

const ROL_USUARIO = 1;
const ROL_SOPORTE = 2;

async function create(userData) {
	const { nombre: name, correo: email, password, idRol: roleId } = userData;

	if (roleId !== ROL_USUARIO) {
		const error = new Error('El registro público solo permite el rol de usuario (idRol 1)');
		error.statusCode = 403;
		throw error;
	}

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

async function update(id, data, requester) {
	const existingUser = await usersRepository.findById(id);
	if (!existingUser) {
		const error = new Error('Usuario no encontrado');
		error.statusCode = 404;
		throw error;
	}

	const { nombre: name, correo: email, idRol: roleId } = data;

	if (requester.idRol !== ROL_SOPORTE && roleId !== existingUser.roleId) {
		const error = new Error('No tienes permiso para cambiar el rol');
		error.statusCode = 403;
		throw error;
	}

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