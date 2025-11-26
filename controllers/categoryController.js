const Category = require('../models/Category');

const categoryController = {
    getAllCategories: async (req, res) => {
        try {
            const categories = await Category.getAll();
            
            res.json({
                success: true,
                data: {
                    categories
                }
            });
        } catch (error) {
            console.error('Error obteniendo categorías:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    },

    createCategory: async (req, res) => {
        try {
            const { name, color } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de la categoría es requerido'
                });
            }

            const categoryId = await Category.create(name, color || '#3498db');
            const newCategory = await Category.getById(categoryId);

            res.status(201).json({
                success: true,
                message: 'Categoría creada exitosamente',
                data: {
                    category: newCategory
                }
            });
        } catch (error) {
            console.error('Error creando categoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    },

    updateCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, color } = req.body;

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
            console.error('Error actualizando categoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    },

    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;

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
            console.error('Error eliminando categoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
};

module.exports = categoryController;