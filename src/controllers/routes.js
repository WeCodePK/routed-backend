const express = require('express');
const router = express.Router();

const { resp, query } = require('../functions');

router.get('/', async (req, res) => {
    try {
        const result = await query(req, 'SELECT * FROM routes ORDER BY createdAt DESC');
        console.log(result);

        return resp(res, 200, '', {
            routes: result.map(route => ({
                ...route,
                points: JSON.parse(route.points)
            }))
        });
    }

    catch (error) {
        console.error('Error getting all routes:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

router.post('/', async (req, res) => {
    const { name, description, totalDistance, points } = req.body;

    if (!name || !description || !totalDistance || !points) return resp(res, 400, 'Missing or malformed input');

    try {
        const result = await query(req,
            'INSERT INTO routes (name, description, totalDistance, points, createdAt) VALUES (?, ?, ?, ?, NOW())',
            [name, description, totalDistance, JSON.stringify(points)]
        );

        return resp(res, 200, "Route saved successfully", { route: { id: result.insertId } });
    }

    catch (error) {
        console.error('Error saving route:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

router.get("/getRoutes", async(req, res) => {
  try {
    const sql = 'SELECT * FROM routes ORDER BY createdAt DESC';
    const routes = await query(req, sql);
    
    const parsedRoutes = routes.map(route => ({
        ...route,
        points: JSON.parse(route.points)
    }));
    res.status(200).json({ message: "Routes get successfully", route: parsedRoutes });
  } catch (error) {
        console.error('Error getting routes:', error);
        res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
    const routeId = req.params.id;
    try {
        const sql = 'SELECT * FROM routes WHERE id = ?';
        const params = [routeId];
        const result = await query(req, sql, params);

        if (result.length === 0) {
            return res.status(404).json({ message: 'Route not found.' });
        }
        const route = result[0];
        route.points = JSON.parse(route.points);
        res.status(200).json(route);
    } catch (error) {
        console.error('Error getting route by ID:', error);
        res.status(500).json({ message: 'Error retrieving route', error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    const routeId = req.params.id;
    const { name, description, totalDistance, points } = req.body;

    let sql = 'UPDATE routes SET ';
    const params = [];
    const fieldsToUpdate = [];

    if (name) {
        fieldsToUpdate.push('name = ?');
        params.push(name);
    }
    if (description) {
        fieldsToUpdate.push('description = ?');
        params.push(description);
    }
    if (totalDistance) {
        fieldsToUpdate.push('totalDistance = ?');
        params.push(totalDistance);
    }
    if (points) {
        fieldsToUpdate.push('points = ?');
        params.push(JSON.stringify(points));
    }

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    sql += fieldsToUpdate.join(', ') + ' WHERE id = ?';
    params.push(routeId);

    try {
        const result = await query(req, sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Route not found or no changes made.' });
        }
        res.status(200).json({ message: 'Route updated successfully.' });
    } catch (error) {
        console.error('Error updating route:', error);
        res.status(500).json({ message: 'Error updating route', error: error.message });
    }
});

router.delete('/deleteRoute/:id', async (req, res) => {
    const routeId = req.params.id;
    try {
        const sql = 'DELETE FROM routes WHERE id = ?';
        const params = [routeId];
        const result = await query(req, sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Route not found.' });
        }
        res.status(200).json({ message: 'Route deleted successfully.' });
    } catch (error) {
        console.error('Error deleting route:', error);
        res.status(500).json({ message: 'Error deleting route', error: error.message });
    }
});

module.exports = router;
