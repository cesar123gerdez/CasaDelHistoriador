const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const categoryRoutes = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging MEJORADO
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
    next();
});

// RUTAS API - DEBEN IR PRIMERO
console.log('🔧 Configurando rutas API...');

// Ruta de salud - SIMPLE Y DIRECTA
app.get('/api/health', (req, res) => {
    console.log('✅ /api/health called');
    res.json({ 
        success: true,
        status: 'OK', 
        message: 'Servidor funcionando',
        timestamp: new Date().toISOString()
    });
});

// Ruta de test de base de datos
app.get('/api/test', async (req, res) => {
    console.log('✅ /api/test called');
    try {
        const { pool } = require('./config/database');
        const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const [categories] = await pool.execute('SELECT COUNT(*) as count FROM categories');
        
        res.json({
            success: true,
            data: {
                users: users[0].count,
                categories: categories[0].count
            }
        });
    } catch (error) {
        console.error('❌ Error en /api/test:', error);
        res.status(500).json({
            success: false,
            message: 'Error en base de datos'
        });
    }
});

// Rutas de la aplicación
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/categories', categoryRoutes);

// Middleware para servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Ruta catch-all para SPA - DEBE IR AL FINAL
app.get('*', (req, res) => {
    console.log(`📄 Sirviendo index.html para: ${req.path}`);
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Manejo de errores
app.use((error, req, res, next) => {
    console.error('❌ Error del servidor:', error);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Función para probar la base de datos
async function testDatabase() {
    try {
        const { pool } = require('./config/database');
        const connection = await pool.getConnection();
        console.log('✅ Conexión a la base de datos establecida');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error conectando a la base de datos:', error.message);
        return false;
    }
}

// Iniciar servidor
app.listen(PORT, async () => {
    console.log('\n🎉 ====================================');
    console.log('🚀 SERVIDOR INICIADO CORRECTAMENTE');
    console.log('====================================');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🔧 Puerto: ${PORT}`);
    
    // Probar base de datos
    const dbConnected = await testDatabase();
    console.log(`🗄️  Base de datos: ${dbConnected ? '✅ CONECTADA' : '❌ NO CONECTADA'}`);
    
    console.log('\n🔗 URLs PARA PROBAR:');
    console.log(`   📋 Health: http://localhost:${PORT}/api/health`);
    console.log(`   🗄️  Test DB: http://localhost:${PORT}/api/test`);
    console.log(`   📂 Categorías: http://localhost:${PORT}/api/categories`);
    console.log('====================================\n');
});

console.log('✅ Servidor configurado');