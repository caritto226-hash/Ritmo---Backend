function validateCreateUser(req, res, next) {
	const { nombre, correo, password, idRol } = req.body || {};
	const passwordAlias = req.body ? req.body['contrase\u00f1a'] : undefined;
	const userPassword = password !== undefined ? password : passwordAlias;

	if (typeof nombre !== 'string' || nombre.trim() === '') {
		const error = new Error('El nombre es obligatorio');
		error.statusCode = 400;
		return next(error);
	}

	if (typeof correo !== 'string' || correo.trim() === '') {
		const error = new Error('El correo es obligatorio');
		error.statusCode = 400;
		return next(error);
	}

	const normalizedCorreo = correo.trim().toLowerCase();
	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	if (!emailPattern.test(normalizedCorreo)) {
		const error = new Error('El correo no tiene un formato válido');
		error.statusCode = 400;
		return next(error);
	}

	if (typeof userPassword !== 'string' || userPassword.length === 0) {
		const error = new Error('La contraseña es obligatoria');
		error.statusCode = 400;
		return next(error);
	}

	if (userPassword.length < 6) {
		const error = new Error('La contraseña debe tener mínimo seis caracteres');
		error.statusCode = 400;
		return next(error);
	}

	if (idRol === undefined || idRol === null || idRol === '') {
		const error = new Error('El rol es obligatorio');
		error.statusCode = 400;
		return next(error);
	}

	const normalizedIdRol = Number(idRol);

	if (!Number.isInteger(normalizedIdRol) || normalizedIdRol <= 0) {
		const error = new Error('El rol debe ser un entero positivo');
		error.statusCode = 400;
		return next(error);
	}

	req.body.nombre = nombre.trim();
	req.body.correo = normalizedCorreo;
	req.body.password = userPassword;
	req.body.idRol = normalizedIdRol;

	next();
}

function validateUpdateUser(req, res, next) {
  try {
    const { nombre, correo, idRol } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      const error = new Error('El nombre es obligatorio');
      error.statusCode = 400;
      throw error;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo || !emailRegex.test(correo)) {
      const error = new Error('El correo es obligatorio y debe tener formato válido');
      error.statusCode = 400;
      throw error;
    }

    const idRolNumber = Number(idRol);
    if (!idRol || !Number.isInteger(idRolNumber) || idRolNumber <= 0) {
      const error = new Error('El rol es obligatorio y debe ser un entero positivo');
      error.statusCode = 400;
      throw error;
    }

    req.body.nombre = nombre.trim();
    req.body.correo = correo.trim().toLowerCase();
    req.body.idRol = idRolNumber;

    next();
  } catch (error) {
    next(error);
  }
}


function validateStatus(req, res, next) {
  try {
    const { status } = req.body;

    if (typeof status !== 'boolean') {
      const error = new Error('El status debe ser true o false');
      error.statusCode = 400;
      throw error;
    }

    next();
  } catch (error) {
    next(error);
  }
}


module.exports = {
	validateCreateUser,
	validateUpdateUser,
	validateStatus,
};
