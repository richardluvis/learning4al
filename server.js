const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
app.use(express.urlencoded({
    extended: true
}));

const session = require('express-session');

app.use(session({
    secret: 'mi-secreto',
    resave: false,
    saveUninitialized: true
}));



// Configuración de la conexión a la base de datos
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'learning',
});

// Ruta para manejar el registro de usuarios
app.post('/registrar', (req, res) => {
    const {
        nombre,
        apellido,
        region,
        ocupacion,
        email,
        password
    } = req.body;

    const query = 'INSERT INTO usuarios (nombre, apellido, region, ocupacion, email, pass) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [nombre, apellido, region, ocupacion, email, password];

    connection.query(query, values, (error, results) => {
        if (error) {
        
            console.error('Error al guardar el usuario:', error);
            const successMessage = encodeURIComponent('Error al guardar el usuario:');
            const redirectURL = '/usuariose.html' + '?mensaje=' + successMessage;            
            res.redirect(redirectURL);

        } else {
            console.log('Usuario registrado exitosamente.');
            const successMessage = encodeURIComponent('Usuario registrado exitosamente.');
            const redirectURL = '/sesion.html' + '?mensaje=' + successMessage;
            res.redirect(redirectURL);

        }
    });
});
// Ruta para el inicio de sesión
app.get('/sesion.html', (req, res) => {
    res.render('sesion', {
        mensajeError: null
    });
});
// Ruta para el inicio de sesión
app.post('/iniciar-sesion', (req, res) => {
    const {
        email,
        password
    } = req.body;

    const query = 'SELECT * FROM usuarios WHERE email = ? AND pass = ?';
    const values = [email, password];

    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error al realizar la consulta:', error);
            res.render('sesion', {
                mensajeError: 'Error al iniciar sesión.'
            });
        } else {
            if (results.length > 0) {
                // El usuario ha iniciado sesión correctamente
                const nombreUsuario = results[0].nombre;
                const codUn2 = results[0].codUn;

                if (codUn2 === 100378415) {
                    // Redireccionar a la página de administrador
                    res.render('pagina-administrador', {
                        nombreUsuario
                    });
                } else if (codUn2 === 100032) {
                    // Redireccionar a la página de estudiante
                    res.render('bienvenido', {
                        nombreUsuario
                    });
                }
            } else {
                // Las credenciales son incorrectas
                res.render('sesion', {
                    mensajeError: 'Credenciales incorrectas.'
                });
            }
        }
    });
});


// Ruta para agregar un nuevo curso
app.post('/cursos/agregar', (req, res) => {
    const { nombre, descripcion } = req.body;

    const query = 'INSERT INTO cursos (nombre, descripcion) VALUES (?, ?)';
    const values = [nombre, descripcion];

    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error al agregar el curso:', error);
            res.send('Error al agregar el curso.');
        } else {
            console.log('Curso agregado exitosamente.');

            // Mostrar el mensaje de éxito utilizando SweetAlert y redirigir a la página de administrar cursos
            const successMessage = encodeURIComponent('Curso agregado exitosamente.');
            const redirectURL = '/administrar-cursos' + '?mensaje=' + successMessage;
            res.redirect(redirectURL);
        }
    });
});


app.get('/cursos', (req, res) => {
    const query = 'SELECT * FROM cursos';
    connection.query(query, (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).send('Error al obtener los cursos');
        } else {
            res.render('cursos', {
                nombreUsuario: req.session.nombreUsuario,
                cursos: results
            });
        }
    });
});

app.get('/perfil', (req, res) => {
    // Verificar si el usuario está autenticado
    if (req.session.nombreUsuario) {
        // Obtener el correo del usuario de la sesión
        const correoUsuario = req.session.correoUsuario;
        // Realizar una consulta a la base de datos para obtener la información del usuario
        const query = 'SELECT * FROM usuarios WHERE correo = ?';
        connection.query(query, [correoUsuario], (error, results) => {
            if (error) {
                throw error;
            }
            // Renderizar la página de perfil y pasar los datos del usuario como variables
            res.render('/perfil', {
                usuario: results[0]
            });
        });
    } else {
        // Si el usuario no está autenticado, redireccionar al inicio de sesión
        res.redirect('/');
    }
});

// Ruta para administrar estudiantes
app.get('/administrar-estudiantes', (req, res) => {
    // Lógica para renderizar la página "Administrar Estudiantes"
    res.render('administrar_estudiantes'); // Renderiza el archivo HTML correspondiente
});

// Ruta para administrar cursos
app.get('/administrar-cursos', (req, res) => {
    const query = 'SELECT * FROM cursos';
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error al obtener los cursos:', error);
            res.status(500).send('Error al obtener los cursos.');
        } else {
            const successMessage = req.query.mensaje;

            res.render('administrar_cursos', {
                cursos: results,
                mensaje: successMessage
            });
        }
    });
});


app.get('/cursos/editar/:id', (req, res) => {
    const cursoId = req.params.id;

    // Lógica para obtener los datos del curso con el ID proporcionado
    const query = 'SELECT * FROM cursos WHERE id = ?';
    connection.query(query, [cursoId], (error, results) => {
        if (error) {
            console.error('Error al obtener el curso:', error);
            res.status(500).send('Error al obtener el curso.');
        } else {
            if (results.length > 0) {
                const curso = results[0];

                // Renderizar la plantilla y pasar los datos del curso y el mensaje
                res.render('editar_curso', {
                    curso,
                    mensaje: null // Puedes cambiar null por el mensaje que desees mostrar
                });
            } else {
                res.status(404).send('Curso no encontrado.');
            }
        }
    });
});

// Ruta para editar un curso (POST)
app.post('/cursos/editar/:id', (req, res) => {
    const courseId = req.params.id;
    const { nombre, descripcion } = req.body;

    const query = 'UPDATE cursos SET nombre = ?, descripcion = ? WHERE id = ?';
    const values = [nombre, descripcion, courseId];

    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error al editar el curso:', error);
            res.send('Error al editar el curso.');
        } else {
            console.log('Curso editado exitosamente.');

            // Mostrar el mensaje de éxito utilizando SweetAlert
            res.render('editar_curso', {
                curso: { id: courseId, nombre, descripcion },
                mensaje: 'Curso editado exitosamente.'
            }, (err, html) => {
                if (err) {
                    console.error('Error al renderizar la plantilla:', err);
                    res.send('Error al editar el curso.');
                } else {
                    // Agregar el código de SweetAlert al HTML renderizado
                    const modifiedHTML = `${html}
                        <script>
                            Swal.fire({
                                title: 'Éxito',
                                text: 'Curso editado exitosamente.',
                                icon: 'success',
                                confirmButtonText: 'OK'
                            }).then(() => {
                                window.location.href = '/administrar-cursos'; // Redirigir a la página de administrar cursos
                            });
                        </script>
                    `;
                    res.send(modifiedHTML);
                }
            });
        }
    });
});



// Ruta para eliminar un curso
app.get('/cursos/eliminar/:id', (req, res) => {
    const cursoId = req.params.id;

    const query = 'DELETE FROM cursos WHERE id = ?';
    const values = [cursoId];

    connection.query(query, values, (error, results) => {
        if (error) {
            console.error('Error al eliminar el curso:', error);
            res.send('Error al eliminar el curso.');
        } else {
            console.log('Curso eliminado exitosamente.');

            // Mostrar el mensaje de éxito utilizando SweetAlert y redirigir a la página de administrar cursos
            const successMessage = encodeURIComponent('Curso eliminado exitosamente.');
            const redirectURL = '/administrar-cursos' + '?mensaje=' + successMessage;
            res.redirect(redirectURL);
        }
    });
});







// Configuración de la carpeta de archivos estáticos
app.use(express.static(path.join(__dirname, 'assets')));

// Configuración del motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Ruta para la página principal
app.get('/', (req, res) => {
    res.render('index');
});

// Ruta para mostrar la página de registro
app.get('/registrarse.html', (req, res) => {
    res.render('registrarse'); // Renderiza el archivo "registrarse.ejs"
});
app.get('/courses.html', (req, res) => {
    res.render('courses');
});
app.get('/about.html', (req, res) => {
    res.render('about');
});


app.get('/bienvenido', (req, res) => {
    res.render('bienvenido', {
        nombreUsuario: 'John Doe'
    }); // Reemplaza 'John Doe' con el nombre de usuario real
});

app.get('/course-details.html', (req, res) => {
    res.render('course-details');
});

app.get('/usuarios.html', (req, res) => {
    res.render('usuarios');
});

app.get('/usuariose.html', (req, res) => {
    res.render('usuariose');
});

app.get('/usuariost.html', (req, res) => {
    res.render('usuariost');
});

app.get('/perfiles.html', (req, res) => {
    res.render('perfil_profesional');
});

app.get('/cerrar-sesion', (req, res) => {
    // Eliminar la sesión
    req.session.destroy();
    // Redireccionar al inicio
    res.redirect('/');
});

// Iniciar el servidor
app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});


// Cerrar la conexión al final del archivo
process.on('SIGINT', () => {
    connection.end();
    process.exit();
});