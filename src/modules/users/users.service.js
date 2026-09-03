const bcrypt = require('bcrypt');
const usersRepository = require('./users.repository');

async function create(userData) {
	const { nombre, correo, contraseña, idRol } = userData;

	const existingUser = await usersRepository.findByEmail(correo);

	if (existingUser) {
		const error = new Error('El correo ya está registrado');
		error.statusCode = 409;
		throw error;
	}

	const existingRole = await usersRepository.findRoleById(idRol);

	if (!existingRole) {
		const error = new Error('El rol no existe');
		error.statusCode = 404;
		throw error;
	}

	const passwordHash = await bcrypt.hash(contraseña, 10);

	const createdUser = await usersRepository.create({
		nombre,
		correo,
		passwordHash,
		idRol,
	});

	if (createdUser && typeof createdUser === 'object') {
		const { contraseña: ignoredPassword, password, passwordHash: ignoredHash, ...safeUser } = createdUser;
		return safeUser;
	}

	return createdUser;
}

module.exports = {
	create,
};
