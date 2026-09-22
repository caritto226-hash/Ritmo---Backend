const dashboardService = require('./dashboard.service');

async function getDashboard(req, res, next) {
	try {
		const dashboard = await dashboardService.getDashboard(req.user.id);

		return res.status(200).json({ data: dashboard });
	} catch (error) {
		return next(error);
	}
}

module.exports = {
	getDashboard,
};
