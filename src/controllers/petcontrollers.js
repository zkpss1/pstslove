const Pet = require('../database/Pet');  // Importa o modelo do pet
const qr = require('qrcode');  // Importa o gerador de QR code

// Função para criar um novo pet e gerar QR code
exports.createPet = async (req, res) => {
    const { nome, idade } = req.body;
    const fotos = req.files;  // Se estiver utilizando Multer para upload de arquivos

    try {
        // URLs das fotos (em produção, você pode usar um serviço como S3)
        const fotosUrls = fotos.map(foto => `/uploads/${foto.originalname}`);

        // Criar um novo pet
        const pet = new Pet({ nome, idade, fotos: fotosUrls });

        // Gerar a URL da página do pet
        const petPageUrl = `${req.protocol}://${req.get('host')}/pet/${pet._id}`;
        pet.petPageUrl = petPageUrl;

        // Gerar o QR code que aponta para a página do pet
        const qrCodeUrl = await qr.toDataURL(petPageUrl);
        pet.qrCodeUrl = qrCodeUrl;

        // Salvar o pet no banco de dados
        await pet.save();

        // Retornar o QR code gerado ao front-end
        res.json({ qrCodeUrl: pet.qrCodeUrl });
    } catch (error) {
        console.error('Erro ao criar pet:', error);
        res.status(500).json({ error: 'Erro ao criar pet' });
    }
};

// Função para obter a página personalizada do pet
exports.getPetPage = async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id);

        if (!pet) {
            return res.status(404).json({ error: 'Pet não encontrado' });
        }

        // Renderizar a página do pet usando EJS
        res.render('pet-page', { pet });
    } catch (error) {
        console.error('Erro ao carregar página do pet:', error);
        res.status(500).json({ error: 'Erro ao carregar página do pet' });
    }
};
