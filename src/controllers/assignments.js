const express = require('express');
const router = express.Router();
const { resp, query } = require('../functions');

router.post('/drivers/:driverId', async (req, res) => {
    const { driverId } = req.params;
    const { routes } = req.body;

    if (!Array.isArray(routes) || routes.length === 0) {
        return resp(res, 400, 'Routes array with routeId and assignedAt is required');
    }

    for (const route of routes) {
        if (!route.routeId || !route.assignedAt) {
            return resp(res, 400, 'Each route must have routeId and assignedAt');
        }

        if (isNaN(Date.parse(route.assignedAt))) {
            return resp(res, 400, `Invalid datetime format for route ID ${route.routeId}`);
        }
    }

    try {
        const driver = await query(req, 'SELECT id, isLive FROM drivers WHERE id = ?', [driverId]);
        if (driver.length === 0) {
            return resp(res, 404, 'Driver not found');
        }
        if (!driver[0].isLive) {
            return resp(res, 400, 'Cannot assign routes to inactive driver');
        }

        for (const route of routes) {
            const routeCheck = await query(req, 'SELECT id FROM routes WHERE id = ?', [route.routeId]);
            if (routeCheck.length === 0) {
                return resp(res, 404, `Route ID ${route.routeId} not found`);
            }

            const existingAssignment = await query(req,
                'SELECT id FROM assignments WHERE driverId = ? AND routeId = ?', 
                [driverId, route.routeId]);
            if (existingAssignment.length > 0) {
                return resp(res, 400, `Route ${route.routeId} is already assigned to this driver`);
            }
        }

        for (const route of routes) {
            await query(req, 'INSERT INTO assignments (driverId, routeId, assignedAt) VALUES (?, ?, ?)',
                [driverId, route.routeId, route.assignedAt]);
        }

        return resp(res, 201, 'Routes assigned successfully');
    } catch (error) {
        console.error('Error assigning routes:', error);
        return resp(res, 500, 'Error assigning routes');
    }
});

router.get('/drivers/:driverId', async (req, res) => {
    const { driverId } = req.params;

    try {
        const driverCheck = await query(req, 'SELECT id FROM drivers WHERE id = ?', [driverId]);
        if (driverCheck.length === 0) {
            return resp(res, 404, 'Driver not found');
        }

        const sql = `
            SELECT a.id AS assignmentId, a.routeId, a.assignedAt, r.name AS routeName, r.description, r.totalDistance
            FROM assignments a
            JOIN routes r ON a.routeId = r.id
            WHERE a.driverId = ?
            ORDER BY a.assignedAt ASC`;
        const result = await query(req, sql, [driverId]);

        return resp(res, 200, 'Driver routes retrieved successfully', { 
            driverId: parseInt(driverId), 
            assignments: result 
        });
    } catch (error) {
        console.error('Error retrieving assigned routes:', error);
        return resp(res, 500, 'Error retrieving assigned routes');
    }
});

router.delete('/drivers/:driverId/routes/:routeId', async (req, res) => {
    const { driverId, routeId } = req.params;

    try {
        const result = await query(req, 
            'DELETE FROM assignments WHERE driverId = ? AND routeId = ?', 
            [driverId, routeId]);

        if (result.affectedRows === 0) {
            return resp(res, 404, 'Assignment not found');
        }

        return resp(res, 200, 'Route unassigned successfully');
    } catch (error) {
        console.error('Error unassigning route:', error);
        return resp(res, 500, 'Error unassigning route');
    }
});

router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT a.id AS assignmentId, a.driverId, a.routeId, a.assignedAt,
            d.name AS driverName, d.phone AS driverPhone, d.isLive AS driverIsLive,
            r.name AS routeName, r.description, r.totalDistance
            FROM assignments a
            JOIN drivers d ON a.driverId = d.id
            JOIN routes r ON a.routeId = r.id
            ORDER BY a.assignedAt DESC`;
        const result = await query(req, sql);

        return resp(res, 200, 'All assignments retrieved successfully', { assignments: result });
    } catch (error) {
        console.error('Error retrieving all assignments:', error);
        return resp(res, 500, 'Error retrieving assignments');
    }
});

module.exports = router;
