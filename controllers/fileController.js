const File = require('../models/File');
const path = require('path');
const fs = require('fs');

const fileController = {
    getAllFiles: async (req, res) => {
        try {
            const { search, category } = req.query;
            const files = await File.getAll(search, category);
            
            res.json({
                success: true,
                data: {
                    files
                }
            });
        } catch (error) {
            console.error('Error obteniendo archivos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    },

    getFile: async (req, res) => {
        try {
            const { id } = req.params;
            const file = await File.getById(id);
            
            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: 'Archivo no encontrado'
                });
            }

            res.json({
                success: true,
                data: {
                    file
                }
            });
        } catch (error) {
            console.error('Error obteniendo archivo:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    },

    uploadFile: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No se ha subido ningún archivo'
                });
            }

            const { description, category_id } = req.body;
            
            const fileData = {
                name: req.file.originalname,
                original_name: req.file.originalname,
                file_path: req.file.path,
                file_type: path.extname(req.file.originalname).toLowerCase().substring(1),
                file_size: req.file.size,
                description: description || '',
                category_id: category_id || null,
                user_id: req.user.id
            };

            const fileId = await File.create(fileData);
            const newFile = await File.getById(fileId);

            res.status(201).json({
                success: true,
                message: 'Archivo subido exitosamente',
                data: {
                    file: newFile
                }
            });
        } catch (error) {
            console.error('Error subiendo archivo:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    },

    updateFile: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, category_id } = req.body;

            const file = await File.getById(id);
            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: 'Archivo no encontrado'
                });
            }

            // Verificar que el usuario es el propietario o es admin
            if (file.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para editar este archivo'
                });
            }

            const updates = {};
            if (name) updates.name = name;
            if (description !== undefined) updates.description = description;
            if (category_id !== undefined) updates.category_id = category_id;

            const updated = await File.update(id, updates);
            
            if (updated) {
                const updatedFile = await File.getById(id);
                res.json({
                    success: true,
                    message: 'Archivo actualizado exitosamente',
                    data: {
                        file: updatedFile
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'No se pudo actualizar el archivo'
                });
            }
        } catch (error) {
            console.error('Error actualizando archivo:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    },

    deleteFile: async (req, res) => {
        try {
            const { id } = req.params;

            const file = await File.getById(id);
            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: 'Archivo no encontrado'
                });
            }

            // Verificar que el usuario es el propietario o es admin
            if (file.user_id !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para eliminar este archivo'
                });
            }

            // Eliminar archivo físico
            if (fs.existsSync(file.file_path)) {
                fs.unlinkSync(file.file_path);
            }

            const deleted = await File.delete(id);
            
            if (deleted) {
                res.json({
                    success: true,
                    message: 'Archivo eliminado exitosamente'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'No se pudo eliminar el archivo'
                });
            }
        } catch (error) {
            console.error('Error eliminando archivo:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    },

    downloadFile: async (req, res) => {
        try {
            const { id } = req.params;
            const file = await File.getById(id);
            
            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: 'Archivo no encontrado'
                });
            }

            if (!fs.existsSync(file.file_path)) {
                return res.status(404).json({
                    success: false,
                    message: 'El archivo físico no existe'
                });
            }

            // Incrementar contador de descargas
            await File.incrementDownloads(id);

            res.download(file.file_path, file.original_name, (err) => {
                if (err) {
                    console.error('Error descargando archivo:', err);
                    res.status(500).json({
                        success: false,
                        message: 'Error al descargar el archivo'
                    });
                }
            });
        } catch (error) {
            console.error('Error descargando archivo:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
};

module.exports = fileController;