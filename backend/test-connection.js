const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

async function testConnection() {
    console.log('🔍 Iniciando pruebas de conexión...\n');

    try {
        // 1. Probar conexión a la base de datos
        console.log('1. Probando conexión a la base de datos...');
        const connection = await pool.getConnection();
        console.log('✅ Conexión a la base de datos exitosa');
        connection.release();

        // 2. Verificar tablas
        console.log('\n2. Verificando tablas...');
        const [tables] = await pool.execute('SHOW TABLES');
        console.log('Tablas encontradas:', tables.map(t => Object.values(t)[0]));

        // 3. Verificar usuario admin
        console.log('\n3. Verificando usuario admin...');
        const [users] = await pool.execute('SELECT * FROM users WHERE username = "admin"');
        
        if (users.length === 0) {
            console.log('❌ No se encontró el usuario admin');
            return;
        }

        const adminUser = users[0];
        console.log('✅ Usuario admin encontrado:');
        console.log('   - ID:', adminUser.id);
        console.log('   - Username:', adminUser.username);
        console.log('   - Name:', adminUser.name);
        console.log('   - Role:', adminUser.role);
        console.log('   - Password hash:', adminUser.password);

        // 4. Verificar contraseña
        console.log('\n4. Verificando contraseña...');
        const password = 'admin123';
        const isPasswordValid = await bcrypt.compare(password, adminUser.password);
        console.log('🔑 Contraseña "admin123" es válida:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('❌ La contraseña no coincide. Generando nuevo hash...');
            const newHash = await bcrypt.hash('admin123', 10);
            console.log('Nuevo hash:', newHash);
            console.log('Ejecuta este SQL para actualizar:');
            console.log(`UPDATE users SET password = '${newHash}' WHERE username = 'admin';`);
        }

        // 5. Verificar categorías
        console.log('\n5. Verificando categorías...');
        const [categories] = await pool.execute('SELECT * FROM categories');
        console.log(`✅ Se encontraron ${categories.length} categorías:`);
        categories.forEach(cat => {
            console.log(`   - ${cat.name} (${cat.color})`);
        });

        console.log('\n🎉 Todas las pruebas completadas correctamente');

    } catch (error) {
        console.error('❌ Error en las pruebas:', error.message);
    } finally {
        process.exit();
    }
}

testConnection();