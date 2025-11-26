const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');

// Modelo de categorías
const Category = {
    async getAll() {
        const { pool } = require('../config/database');
        const [rows] = await pool.execute(`
            SELECT c.*, COUNT(f.id) as file_count 
            FROM categories c 
            LEFT JOIN files f ON c.id = f.category_id 
            GROUP BY c.id 
            ORDER BY c.name
        `);
        return rows;
    },

    async create(name, color) {
        const { pool } = require('../config/database');
        const [result] = await pool.execute(
            'INSERT INTO categories (name, color) VALUES (?, ?)',
            [name, color]
        );
        return result.insertId;
    },

    async update(id, name, color) {
        const { pool } = require('../config/database');
        await pool.execute(
            'UPDATE categories SET name = ?, color = ? WHERE id = ?',
            [name, color, id]
        );
        return true;
    },

    async delete(id) {
        const { pool } = require('../config/database');
        
        // Primero actualizar archivos que usan esta categoría
        await pool.execute(
            'UPDATE files SET category_id = NULL WHERE category_id = ?',
            [id]
        );
        
        // Luego eliminar la categoría
        const [result] = await pool.execute(
            'DELETE FROM categories WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    },

    async getById(id) {
        const { pool } = require('../config/database');
        const [rows] = await pool.execute(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );
        return rows[0];
    }
};

// Obtener todas las categorías
router.get('/', async (req, res) => {
    try {
        console.log('📂 Solicitando categorías');
        const categories = await Category.getAll();
        
        res.json({
            success: true,
            data: {
                categories
            }
        });
    } catch (error) {
        console.error('❌ Error obteniendo categorías:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Crear categoría
router.post('/', auth, adminAuth, async (req, res) => {
    try {
        const { name, color } = req.body;
        console.log('➕ Creando categoría:', name, color);

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la categoría es requerido'
            });
        }

        const categoryId = await Category.create(name, color || '#3498db');
        const newCategory = await Category.getById(categoryId);

        res.json({
            success: true,
            message: 'Categoría creada exitosamente',
            data: {
                category: newCategory
            }
        });
        
    } catch (error) {
        console.error('❌ Error creando categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar categoría
router.put('/:id', auth, adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, color } = req.body;
        console.log('✏️ Actualizando categoría:', id, name, color);

        const category = await Category.getById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        await Category.update(id, name, color);
        const updatedCategory = await Category.getById(id);

        res.json({
            success: true,
            message: 'Categoría actualizada exitosamente',
            data: {
                category: updatedCategory
            }
        });
        
    } catch (error) {
        console.error('❌ Error actualizando categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Eliminar categoría
router.delete('/:id', auth, adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Eliminando categoría:', id);

        const category = await Category.getById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        const deleted = await Category.delete(id);
        
        if (deleted) {
            res.json({
                success: true,
                message: 'Categoría eliminada exitosamente'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'No se pudo eliminar la categoría'
            });
        }
        
    } catch (error) {
        console.error('❌ Error eliminando categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;