const express = require('express');
const router = express.Router();


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
