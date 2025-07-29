const express = require('express');
const router = express.Router();

async function executeQuery(req, sql, params = []) {
    const dbPool = req.app.locals.dbPool;
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [rows, fields] = await connection.execute(sql, params);
        return rows;
    } finally {
        if (connection) connection.release();
    }
}

router.get('/', async (req, res) => {
    try {
        const sql = 'SELECT * FROM routes ORDER BY createdAt DESC';
        const result = await executeQuery(req, sql);
        const routes = result.map(route => ({
            ...route,
            points: JSON.parse(route.points)
        }));
        res.status(200).json(routes);
    } catch (error) {
        console.error('Error getting all routes:', error);
        res.status(500).json({ message: 'Error retrieving routes', error: error.message });
    }
});

router.post('/saveRoutes', async (req, res) => {
    const { name, description, totalDistance, points } = req.body;
    if (!name || !description || !totalDistance || !points) {
        return res.status(400).json({ message: 'Name, description, totalDistance, and points are required.' });
    }

    try {
        const sql = 'INSERT INTO routes (name, description, totalDistance, points, createdAt) VALUES (?, ?, ?, ?, NOW())';
        const params = [name, description, totalDistance, JSON.stringify(points)];
        const result = await executeQuery(req, sql, params);
        res.status(201).json({ message: "Route saved", route: { id: result.insertId, name, description, totalDistance, points } });
    } catch (error) {
        console.error('Error saving route:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/getRoutes", async(req, res) => {
  try {
    const sql = 'SELECT * FROM routes ORDER BY createdAt DESC';
    const routes = await executeQuery(req, sql);
    
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
        const result = await executeQuery(req, sql, params);

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
        const result = await executeQuery(req, sql, params);
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
        const result = await executeQuery(req, sql, params);

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
