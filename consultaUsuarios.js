const mysql = require('mysql2');

// Configuración de la conexión a la base de datos
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'learning'
});

// Ejecutar la consulta
connection.query('SELECT * FROM usuarios', (error, results) => {
    if (error) { 
        console.error('Error al obtener los usuarios:', error);
    } else {
        if (results.length > 0) {
            results.forEach((usuario) => {
                console.log(`ID: ${usuario.id}, Nombre: ${usuario.nombre}, Email: ${usuario.email}`);
            });
        } else {
            console.log('No se encontraron usuarios registrados.');
        }
    }

    connection.end(); // Cierra la conexión después de realizar la consulta
});