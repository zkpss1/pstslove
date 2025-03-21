const express = require('express');
const path = require('path');
const router = express.Router();
const Pet = require('../models/pet');
const qr = require('qrcode');

// Rota para servir a página inicial (formulário de cadastro)
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/petslove2/src/views/index.html'));
});

// Rota para processar o cadastro do pet e gerar o QR code
router.post('/cadastrar-pet', async (req, res) => {
    // Lógica para cadastrar pet e gerar o QR code (já descrita anteriormente)
});

module.exports = router;
