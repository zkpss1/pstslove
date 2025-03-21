const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  idade: { type: Number, required: true },
  fotos: [String], // URLs das fotos do pet
  qrCodeUrl: { type: String }, // URL do QR code gerado
  petPageUrl: { type: String }, // URL da página personalizada do pet
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Pet', petSchema);
