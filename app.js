const express = require('express');
const multer = require('multer');
const QRCode = require('qrcode');
const path = require('path');
const moment = require('moment');
const fs = require('fs');

// Configurar momento para português
moment.locale('pt-br');

const app = express();
const port = 3005;

// Garantir que o diretório de uploads existe
const uploadDir = path.join(__dirname, 'src', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // 10MB
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Erro: Apenas imagens são permitidas!');
        }
    }
});

// Configurações do Express
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use(express.urlencoded({ extended: true }));

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado! 😢');
});

// Rota principal
app.get('/', (req, res) => {
    res.render('index');
});

// Rota para criar perfil do pet
app.post('/criar-pet', upload.array('fotos', 5), async (req, res) => {
    try {
        const { nomeDono, nomePet, dataPet } = req.body;
        const fotos = req.files ? req.files.map(file => '/uploads/' + file.filename) : [];
        
        // Gerar ID único para o pet
        const petId = Date.now().toString();
        
        // Gerar QR Code
        const qrCodeUrl = await QRCode.toDataURL(`http://${req.get('host')}/pet/${petId}`);
        
        res.render('sucesso', {
            nomeDono,
            nomePet,
            dataPet,
            fotos,
            qrCode: qrCodeUrl,
            petId
        });
    } catch (error) {
        console.error('Erro ao criar perfil:', error);
        res.status(500).send('Erro ao criar perfil do pet');
    }
});

// Rota para visualizar perfil do pet
app.get('/pet/:id', (req, res) => {
    try {
        // Dados de exemplo para teste
        const petData = {
            nomeDono: 'Maria',
            nomePet: 'Luna',
            dataPet: '2023-01-15',
            fotos: [
                '/uploads/exemplo1.jpg',
                '/uploads/exemplo2.jpg'
            ]
        };
        
        res.render('perfil', {
            pet: petData,
            moment: moment
        });
    } catch (error) {
        console.error('Erro ao exibir perfil:', error);
        res.status(500).send('Erro ao exibir perfil do pet');
    }
});

// Iniciar o servidor com tratamento de erro
const server = app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Porta ${port} já está em uso. Tentando outra porta...`);
        server.listen(0); // Tentar uma porta aleatória disponível
    } else {
        console.error('Erro ao iniciar servidor:', err);
    }
});
