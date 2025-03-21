const express = require('express');
const multer = require('multer');
const QRCode = require('qrcode');
const path = require('path');
const moment = require('moment');
const fs = require('fs');

// Configurar momento para português
moment.locale('pt-br');

const app = express();
const port = process.env.PORT || 3005;

// Configuração de diretórios
const uploadDir = path.join(process.cwd(), 'public', 'uploads');

// Garantir que o diretório de uploads existe
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (err) {
    console.error('Erro ao criar diretório de uploads:', err);
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
app.set('views', path.join(process.cwd(), 'src', 'views'));
app.use(express.static(path.join(process.cwd(), 'src', 'public')));
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
app.use(express.urlencoded({ extended: true }));

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro na aplicação:', err);
    res.status(500).send('Algo deu errado! 😢');
});

// Rota principal
app.get('/', (req, res) => {
    try {
        res.render('index');
    } catch (error) {
        console.error('Erro na rota principal:', error);
        res.status(500).send('Erro ao carregar página inicial');
    }
});

// Rota para criar perfil do pet
app.post('/criar-pet', upload.array('fotos', 5), async (req, res) => {
    try {
        const { nomeDono, nomePet, dataPet } = req.body;
        const fotos = req.files ? req.files.map(file => '/uploads/' + file.filename) : [];
        
        // Gerar ID único para o pet
        const petId = Date.now().toString();
        
        // Gerar QR Code
        const qrCodeUrl = await QRCode.toDataURL(`${req.protocol}://${req.get('host')}/pet/${petId}`);
        
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

// Tratamento para rotas não encontradas
app.use((req, res) => {
    res.status(404).send('Página não encontrada 😢');
});

// Iniciar o servidor
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Servidor rodando em http://localhost:${port}`);
    });
}

module.exports = app;
