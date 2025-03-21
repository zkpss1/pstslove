const express = require('express');
const multer = require('multer');
const path = require('path');
const QRCode = require('qrcode');
const fs = require('fs');
const moment = require('moment');
require('moment/locale/pt-br');
moment.locale('pt-br');

const app = express();
let port = process.env.PORT || 3000;

// Configuração do Multer para armazenamento em memória
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        files: 5,
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato de arquivo inválido. Use apenas JPG, PNG ou GIF.'));
        }
    }
});

// Configurações do Express
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Criação do diretório de uploads se não existir
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Rota principal
app.get('/', (req, res) => {
    res.render('index');
});

// Rota para criar perfil do pet
app.post('/criar-pet', upload.array('fotos', 5), async (req, res) => {
    try {
        const { nomeDono, nomePet, dataPet } = req.body;
        const fotos = req.files;

        // Salvar as fotos e gerar URLs
        const fotoUrls = [];
        for (const foto of fotos) {
            const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(foto.originalname);
            const filepath = path.join(uploadDir, filename);
            fs.writeFileSync(filepath, foto.buffer);
            fotoUrls.push('/uploads/' + filename);
        }

        // Gerar ID único para o pet
        const petId = Date.now().toString(36) + Math.random().toString(36).substr(2);

        // Criar URL do perfil
        const profileUrl = `${req.protocol}://${req.get('host')}/pet/${petId}`;

        // Gerar QR Code
        const qrCode = await QRCode.toDataURL(profileUrl, {
            errorCorrectionLevel: 'H',
            margin: 2,
            color: {
                dark: '#FF69B4',
                light: '#FFFFFF'
            }
        });

        // Salvar dados do pet (em produção, use um banco de dados)
        const petData = {
            id: petId,
            nomeDono,
            nomePet,
            dataPet,
            fotos: fotoUrls,
            createdAt: new Date()
        };

        // Em produção, salve no banco de dados
        if (!app.locals.pets) app.locals.pets = {};
        app.locals.pets[petId] = petData;

        // Renderizar página de sucesso
        res.render('sucesso', {
            nomeDono,
            nomePet,
            dataPet,
            fotos: fotoUrls,
            qrCode,
            petId
        });

    } catch (error) {
        console.error('Erro ao criar perfil:', error);
        res.status(500).send('Erro ao criar perfil do pet: ' + error.message);
    }
});

// Rota para visualizar perfil do pet
app.get('/pet/:id', (req, res) => {
    const petId = req.params.id;
    const pet = app.locals.pets?.[petId];

    if (!pet) {
        return res.status(404).send('Perfil não encontrado');
    }

    // Calcular idade/tempo
    const inicio = moment(pet.dataPet);
    const agora = moment();
    const idade = {
        anos: agora.diff(inicio, 'years'),
        meses: agora.diff(inicio, 'months') % 12,
        dias: agora.diff(inicio, 'days') % 30
    };

    res.render('perfil', { 
        pet,
        idade,
        moment 
    });
});

// Função para tentar iniciar o servidor em uma porta disponível
function startServer(initialPort) {
    const server = app.listen(initialPort)
        .on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Porta ${initialPort} em uso, tentando próxima porta...`);
                startServer(initialPort + 1);
            } else {
                console.error('Erro ao iniciar servidor:', err);
            }
        })
        .on('listening', () => {
            const actualPort = server.address().port;
            console.log(`Servidor rodando em http://localhost:${actualPort}`);
        });
}

// Iniciar servidor
startServer(port);
