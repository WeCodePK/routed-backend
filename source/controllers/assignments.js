const express = require('express');
const router = express.Router();

const { resp, query } = require('../functions'); 

// router.get('/', async (req, res) => {
//     try {
//         return resp(res, 200, 'Successfully fetched all assignments', {
//             assignments: await query(req, 'SELECT * FROM assignments JOIN ;')
//         });
//     }

//     catch (error) {
//         console.error('Error getting all assignments:', error);
//         return resp(res, 500, 'Internal Server Error');
//     }
// });

router.get('/', async (req, res) => {
    try {
        const assignments = await query(req, `
            SELECT 
                a.id AS assignmentId,
                r.id AS routeId, r.name AS routeName, r.points, r.description, r.totalDistance, r.createdAt,
                d.id AS driverId, d.name AS driverName, d.email
            FROM assignments a
            JOIN routes r ON a.routeId = r.id
            JOIN drivers d ON a.driverId = d.id
        `);

        const formattedAssignments = assignments.map(row => ({
            id: row.assignmentId,
            route: {
                id: row.routeId,
                name: row.routeName,
                points: row.points,
                description: row.description,
                totalDistance: row.totalDistance,
                createdAt: row.createdAt
            },
            driver: {
                id: row.driverId,
                name: row.driverName,
                email: row.email
            }
        }));

        return resp(res, 200, 'Successfully fetched all assignments', { assignments: formattedAssignments });
    } catch (error) {
        console.error('Error getting all assignments:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

router.post('/', async (req, res) => {
    const { routes, drivers } = req.body;

    if (!Array.isArray(routes) || !Array.isArray(drivers)) {
        return resp(res, 400, 'Missing or malformed input');
    }

    const assignments = [];
    for (const routeId of routes) {
        for (const driverId of drivers) {
            assignments.push([routeId, driverId]);
        }
    }

    if (assignments.length === 0) {
        return resp(res, 400, 'No assignments to insert');
    }

    const placeholders = assignments.map(() => '(?, ?)').join(', ');
    const sql = `INSERT INTO assignments (routeId, driverId) VALUES ${placeholders}`;

    try {
        await query(res, sql, assignments.flat());
        return resp(res, 201, 'Successfully created assignments')
    }

    catch (error) {
        console.error('Error creating assignments:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

router.post('/assignRoutes', async (req, res) => {
    const { driverId, routeIds } = req.body;

    if (!driverId || !Array.isArray(routeIds) || routeIds.length === 0) {
        return res.status(400).json({ message: 'driverId and an array of routeIds are required.' });
    }

    try {
        
        const selectSql = 'SELECT assignedRoutes FROM drivers WHERE id = ?';
        const selectParams = [driverId];
        const result = await executeQuery(req, selectSql, selectParams);

        if (result.length === 0) {
            return res.status(404).json({ message: 'Driver not found.' });
        }

        let currentAssignedRoutes = result[0].assignedRoutes ? JSON.parse(result[0].assignedRoutes) : [];

        
        const newAssignedRoutes = [...new Set([...currentAssignedRoutes, ...routeIds])];

        
        const updateSql = 'UPDATE drivers SET assignedRoutes = ? WHERE id = ?';
        const updateParams = [JSON.stringify(newAssignedRoutes), driverId];
        const updateResult = await executeQuery(req, updateSql, updateParams);

        if (updateResult.affectedRows === 0) {
            return res.status(500).json({ message: 'Failed to update driver assignments or no changes made.' });
        }

        res.status(200).json({ message: 'Routes assigned successfully to driver.', driverId, assignedRoutes: newAssignedRoutes });

    } catch (error) {
        console.error('Error assigning routes to driver:', error);
        res.status(500).json({ message: 'Error assigning routes to driver', error: error.message });
    }
});

router.get('/driver/:driverId', async (req, res) => {
    const driverId = req.params.driverId;

    try {
        const sql = 'SELECT assignedRoutes FROM drivers WHERE id = ?';
        const params = [driverId];
        const result = await executeQuery(req, sql, params);

        if (result.length === 0) {
            return res.status(404).json({ message: 'Driver not found.' });
        }

        const assignedRoutes = result[0].assignedRoutes ? JSON.parse(result[0].assignedRoutes) : [];
        res.status(200).json({ driverId, assignedRoutes });

    } catch (error) {
        console.error('Error retrieving assigned routes for driver:', error);
        res.status(500).json({ message: 'Error retrieving assigned routes', error: error.message });
    }
});

router.delete('/unassignRoute', async (req, res) => {
    const { driverId, routeId } = req.body;

    if (!driverId || !routeId) {
        return res.status(400).json({ message: 'driverId and routeId are required.' });
    }

    try {
        const selectSql = 'SELECT assignedRoutes FROM drivers WHERE id = ?';
        const selectParams = [driverId];
        const result = await executeQuery(req, selectSql, selectParams);

        if (result.length === 0) {
            return res.status(404).json({ message: 'Driver not found.' });
        }

        let currentAssignedRoutes = result[0].assignedRoutes ? JSON.parse(result[0].assignedRoutes) : [];

        const updatedAssignedRoutes = currentAssignedRoutes.filter(id => id !== routeId);

        const updateSql = 'UPDATE drivers SET assignedRoutes = ? WHERE id = ?';
        const updateParams = [JSON.stringify(updatedAssignedRoutes), driverId];
        const updateResult = await executeQuery(req, updateSql, updateParams);

        if (updateResult.affectedRows === 0) {
            return res.status(500).json({ message: 'Failed to unassign route or no changes made.' });
        }

        res.status(200).json({ message: 'Route unassigned successfully from driver.', driverId, assignedRoutes: updatedAssignedRoutes });

    } catch (error) {
        console.error('Error unassigning route from driver:', error);
        res.status(500).json({ message: 'Error unassigning route', error: error.message });
    }
});


module.exports = router;
