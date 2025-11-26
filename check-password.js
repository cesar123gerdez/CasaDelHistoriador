cd 'C:\Users\cesar\OneDrive\Desktop\New Folder (2)\backend '
show folderquire('./config/database');
npm start
# or to view errors directly() {
    try {
        console.log('🔍 Verificando contraseña del admin...');
        
        // Obtener el usuario admin
        const [users] = await pool.execute('SELECT * FROM users WHERE username = "admin"');
        
        if (users.length === 0) {
            console.log('❌ No se encontró el usuario admin');
            return;
        }

        const admin = users[0];
        console.log('📋 Información del admin:');
        console.log('   - ID:', admin.id);
        console.log('   - Username:', admin.username);
        console.log('   - Password hash:', admin.password);
        
        // Probar contraseña "admin123"
        const testPassword = 'admin123';
        const isValid = await bcrypt.compare(testPassword, admin.password);
        console.log(`🔑 Contraseña "admin123" es válida: ${isValid}`);
        
        if (!isValid) {
            console.log('❌ La contraseña no coincide. Generando nuevo hash...');
            const newHash = await bcrypt.hash('admin123', 10);
            console.log('Nuevo hash:', newHash);
            console.log('\n💡 Ejecuta este SQL para actualizar:');
            console.log(`UPDATE users SET password = '${newHash}' WHERE username = 'admin';`);
        } else {
            console.log('✅ La contraseña es correcta');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit();
    }
}

checkAdminPassword();