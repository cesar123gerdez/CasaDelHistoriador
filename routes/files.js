const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { auth, adminAuth } = require('../middleware/auth');

// ...existing code...

// Editar descripción de archivo
router.put('/:id/description', auth, adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { description } = req.body;
        if (!description || description.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'La descripción no puede estar vacía'
            });
        }
        const { pool } = require('../config/database');
        const [result] = await pool.execute(
            'UPDATE files SET description = ? WHERE id = ?',
            [description, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado'
            });
        }
        const updatedFile = await File.getById(id);
        res.json({
            success: true,
            message: 'Descripción actualizada',
            data: { file: updatedFile }
        });
    } catch (error) {
        console.error('❌ Error actualizando descripción:', error);
        res.status(500).json({
            success: false,
            message: 'Error actualizando descripción'
        });
    }
});


// (Eliminado: app.use('/api/files', router); esto solo va en server.js)

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    // Nota: se elimina el límite de tamaño para permitir subidas de cualquier tamaño.
    // En producción deberías poner límites razonables o usar streaming/S3.
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'), false);
        }
    }
});

// Modelo de archivos
const File = {
    async getAll() {
        const { pool } = require('../config/database');
        const [rows] = await pool.execute(`
            SELECT f.*, c.name as category_name, c.color as category_color
            FROM files f
            LEFT JOIN categories c ON f.category_id = c.id
            ORDER BY f.created_at DESC
        `);
        return rows;
    },

    async create(fileData) {
        const { pool } = require('../config/database');
        const { name, original_name, file_path, file_type, file_size, description, category_id, user_id } = fileData;
        
        const [result] = await pool.execute(
            `INSERT INTO files (name, original_name, file_path, file_type, file_size, description, category_id, user_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, original_name, file_path, file_type, file_size, description, category_id, user_id]
        );
        return result.insertId;
    },

    async delete(id) {
        const { pool } = require('../config/database');
        const [result] = await pool.execute(
            'DELETE FROM files WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    },

    async getById(id) {
        const { pool } = require('../config/database');
        const [rows] = await pool.execute(
            'SELECT * FROM files WHERE id = ?',
            [id]
        );
        return rows[0];
    }
};

// Obtener todos los archivos
router.get('/', async (req, res) => {
    try {
        console.log('📁 Solicitando archivos');
        const files = await File.getAll();
        
        res.json({
            success: true,
            data: {
                files
            }
        });
    } catch (error) {
        console.error('❌ Error obteniendo archivos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Subir archivo
router.post('/upload', auth, adminAuth, upload.array('files'), async (req, res) => {
    try {
        console.log('📤 Solicitud de subida de archivo recibida');
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se han subido archivos'
            });
        }


        const { category_id } = req.body;
        let descriptions = req.body.descriptions;
        // Si descriptions es string, convertir a array
        if (typeof descriptions === 'string') {
            descriptions = [descriptions];
        }

        // Procesar cada archivo subido y crear un registro en la base de datos
        const createdIds = await Promise.all(req.files.map(async (file, idx) => {
            let description = `Documento ${path.extname(file.originalname).toLowerCase().substring(1).toUpperCase()} subido el ${new Date().toLocaleDateString()}`;
            if (descriptions && descriptions[idx] !== undefined && descriptions[idx].trim() !== '') {
                description = descriptions[idx];
            }
            const fileData = {
                name: file.originalname,
                original_name: file.originalname,
                file_path: file.path,
                file_type: path.extname(file.originalname).toLowerCase().substring(1),
                file_size: file.size,
                description,
                category_id: category_id ? category_id : null,
                user_id: req.user.id
            };

            console.log('📝 Datos del archivo a crear:', fileData.name);
            const id = await File.create(fileData);
            return id;
        }));

        // Obtener los registros creados en una sola consulta para mejorar rendimiento
        const { pool } = require('../config/database');
        if (createdIds.length === 0) {
            return res.json({
                success: true,
                message: '0 archivo(s) subido(s) exitosamente',
                data: { files: [] }
            });
        }
        const placeholders = createdIds.map(() => '?').join(',');
        const [createdFiles] = await pool.execute(`
            SELECT f.*, c.name as category_name, c.color as category_color
            FROM files f
            LEFT JOIN categories c ON f.category_id = c.id
            WHERE f.id IN (${placeholders})
            ORDER BY f.created_at DESC
        `, createdIds);

        res.json({
            success: true,
            message: `${createdFiles.length} archivo(s) subido(s) exitosamente`,
            data: {
                files: createdFiles
            }
        });
        
    } catch (error) {
        console.error('❌ Error subiendo archivo:', error);
        res.status(500).json({
            success: false,
            message: 'Error subiendo archivo: ' + error.message
        });
    }
});

// Eliminar archivo
router.delete('/:id', auth, adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Solicitando eliminación del archivo:', id);

        const file = await File.getById(id);
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Archivo no encontrado'
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
        console.error('❌ Error eliminando archivo:', error);
        res.status(500).json({
            success: false,
            message: 'Error eliminando archivo'
        });
    }
});

//Preview Path
router.get('/:id/preview', async (req, res) => {
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
        // Servir el archivo para vista previa
        res.sendFile(path.resolve(file.file_path));
    } catch (error) {
        console.error('❌ Error en vista previa:', error);
        res.status(500).json({
            success: false,
            message: 'Error en vista previa'
        });
    }
});

// Ruta de descarga
router.get('/:id/download', async (req, res) => {
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

        res.download(file.file_path, file.original_name);
        
    } catch (error) {
        console.error('❌ Error descargando archivo:', error);
        res.status(500).json({
            success: false,
            message: 'Error descargando archivo'
        });
    }
});

module.exports = router;