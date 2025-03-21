const express = require('express');
const multer = require('multer');
const QRCode = require('qrcode');
const path = require('path');
const moment = require('moment');

// Configurar momento para português
moment.locale('pt-br');

const app = express();
const port = process.env.PORT || 3005;

// Aumentar limite do payload
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Armazenamento temporário em memória
const memoryStorage = new Map();

// Configuração do multer para armazenamento em memória
const storage = multer.memoryStorage();

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

// Rota para servir imagens em memória
app.get('/uploads/:id', (req, res) => {
    const imageData = memoryStorage.get(req.params.id);
    if (imageData) {
        res.writeHead(200, {
            'Content-Type': imageData.mimetype,
            'Content-Length': imageData.buffer.length
        });
        res.end(imageData.buffer);
    } else {
        res.status(404).send('Imagem não encontrada');
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

        // Processar fotos e salvar em memória
        const fotos = req.files.map(file => {
            const id = Date.now() + '-' + Math.random().toString(36).substring(7);
            memoryStorage.set(id, {
                buffer: file.buffer,
                mimetype: file.mimetype
            });
            return '/uploads/' + id;
        });
        
        // Gerar ID único para o pet
        const petId = Date.now().toString();
        
        // Gerar QR Code com tamanho menor
        const qrCodeUrl = await QRCode.toDataURL(`${req.protocol}://${req.get('host')}/pet/${petId}`, {
            width: 300,
            margin: 2,
            quality: 0.8
        });
        
        // Salvar dados do pet em memória
        memoryStorage.set(`pet_${petId}`, {
            nomeDono,
            nomePet,
            dataPet,
            fotos
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
        const petData = memoryStorage.get(`pet_${req.params.id}`);
        
        if (!petData) {
            return res.status(404).send('Perfil do pet não encontrado');
        }
        
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
