const usersRepository = require('../users/users.repository');

async function findByEmailWithPassword(email) {
	return usersRepository.findByEmailWithPassword(email);
}

module.exports = {
	findByEmailWithPassword,
};