const usersRepository = require('../users/users.repository');

async function findByEmailWithPassword(correo) {
	return usersRepository.findByEmailWithPassword(correo);
}

module.exports = {
	findByEmailWithPassword,
};