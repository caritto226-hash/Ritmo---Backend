const bcrypt = require('bcrypt');
const usersRepository = require('./users.repository');

async function create(userData) {
	const { nombre, correo, password, idRol } = userData;

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

	const passwordHash = await bcrypt.hash(password, 10);

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

  const emailInUse = await usersRepository.findByEmailExcludingId(data.correo, id);
  if (emailInUse) {
    const error = new Error('El correo ya está en uso por otro usuario');
    error.statusCode = 409;
    throw error;
  }

  const role = await usersRepository.findRoleById(data.idRol);
  if (!role) {
    const error = new Error('El rol especificado no existe');
    error.statusCode = 404;
    throw error;
  }

  const updatedUser = await usersRepository.update(id, data);
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
