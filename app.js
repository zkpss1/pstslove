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

// Aumentar limite do payload
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
        cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, ''));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 5 // máximo de 5 arquivos
    },
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Erro: Apenas imagens são permitidas (jpg, jpeg, png, gif)');
        }
    }
});

// Configurações do Express
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'src', 'views'));
app.use(express.static(path.join(process.cwd(), 'src', 'public')));
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro na aplicação:', err);
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).send('Erro: Arquivo muito grande. O tamanho máximo é 5MB.');
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(413).send('Erro: Máximo de 5 arquivos permitidos.');
        }
    }
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
        
        // Verificar se há arquivos
        if (!req.files || req.files.length === 0) {
            return res.status(400).send('Por favor, envie pelo menos uma foto do pet.');
        }

        // Processar fotos
        const fotos = req.files.map(file => '/uploads/' + file.filename);
        
        // Gerar ID único para o pet
        const petId = Date.now().toString();
        
        // Gerar QR Code com tamanho menor
        const qrCodeUrl = await QRCode.toDataURL(`${req.protocol}://${req.get('host')}/pet/${petId}`, {
            width: 300,
            margin: 2,
            quality: 0.8
        });
        
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
