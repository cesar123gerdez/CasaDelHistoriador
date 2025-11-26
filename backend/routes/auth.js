const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Modelo de usuario
const User = {
    async findByUsername(username) {
        const { pool } = require('../config/database');
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        return rows[0];
    }
};

// Ruta de login - CORREGIDA
router.post('/login', async (req, res) => {
    try {
        console.log('🔐 Solicitud de login recibida:', req.body);
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Usuario y contraseña son requeridos'
            });
        }

        // Buscar usuario
        const user = await User.findByUsername(username);
        console.log('👤 Usuario encontrado:', user ? 'Sí' : 'No');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña
        console.log('🔑 Verificando contraseña...');
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('✅ Contraseña válida:', isPasswordValid);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );

        console.log('✅ Login exitoso para:', username);

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor: ' + error.message
        });
    }
});

// Ruta GET para probar que existe
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Ruta auth funcionando'
    });
});

module.exports = router;