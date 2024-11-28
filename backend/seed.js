// seed.js
const mongoose = require('mongoose');

mongoose
  .connect('mongodb://localhost:27017/cremoso')
  .then(() => console.log('Conectado ao MongoDB'))
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

const specialProductSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  basePrice: { type: Number },
  sizes: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true },
    },
  ],
});

const SpecialProduct = mongoose.model('SpecialProduct', specialProductSchema);

const products = [
  {
    name: 'Bolo',
    sizes: [
      { name: 'mini', price: 10 },
      { name: 'pequeno', price: 12 },
      { name: 'medio', price: 15 },
      { name: 'grande', price: 20 },
    ],
  },
  { name: 'Brownie', basePrice: 5 },
  { name: 'Petit Gateau', basePrice: 25 },
  { name: 'Diversos', basePrice: 0 },
];

SpecialProduct.deleteMany({})
  .then(() => SpecialProduct.insertMany(products))
  .then(() => {
    console.log('Produtos inseridos com sucesso!');
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error('Erro ao inserir produtos:', err);
    mongoose.connection.close();
  });
