const express = require('express');
const path = require('path');
const petRoutes = require('./src/routes/petRoutes');

const app = express();

// Configurar pasta de arquivos estáticos (CSS, imagens, etc.)
app.use(express.static(path.join(__dirname, '/src/public/css/style.css')));

// Configurar a renderização de arquivos HTML e o uso do template engine EJS (opcional)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/src/views/index.html'));

// Usar rotas para lidar com pets
app.use('/', petRoutes);

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
