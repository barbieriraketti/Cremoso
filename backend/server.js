const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Importa variáveis de ambiente

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com o MongoDB
mongoose
  .connect('mongodb://localhost:27017/cremoso', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado ao MongoDB'))
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// Definição do Schema e Modelo para Usuários
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
});

const User = mongoose.model('Usuarios', userSchema);

// Definição do Schema e Modelo para o Menu
const menuItemSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  items: [
    {
      name: { type: String, required: true },
      description: { type: String, default: '' },
    },
  ],
  price: { type: Number, required: true },
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// Definição do Schema e Modelo para Produtos Especiais
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

// Schema para detalhes do pedido
const orderDetailSchema = new mongoose.Schema({
  item: { type: String, required: true },
  qty: { type: Number, required: true },
  category: { type: String, required: true },
  pricePerUnit: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  details: {
    size: { type: String },
    flavor1: { type: String },
    flavor2: { type: String },
    topping: { type: String },
    description: { type: String }, // Para "Diversos"
    additionalNotes: { type: String },
  },
});

// Schema para pedidos
const orderSchema = new mongoose.Schema({
  user: { type: String, required: true },
  orderDetails: [orderDetailSchema],
  totalPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', orderSchema);

// Configuração do transporte de e-mail
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Ou outro serviço de e-mail
  auth: {
    user: process.env.EMAIL_USER, // Seu e-mail (definido em .env)
    pass: process.env.EMAIL_PASS, // Sua senha de app (definida em .env)
  },
});

// Middleware para autenticação
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  jwt.verify(token, 'secreto', (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido.' });
    }
    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    next();
  });
};

// Rota de Cadastro
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username e senha são obrigatórios.' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já existe.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();

    res.status(201).json({ message: 'Usuário registrado com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno ao registrar usuário.', error });
  }
});

// Rota de Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Senha incorreta.' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      'secreto',
      { expiresIn: '1h' }
    );
    res.json({ token, username: user.username, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno ao realizar login.', error });
  }
});

// Rota para obter o menu
app.get('/api/menu', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({});
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar o menu.', error });
  }
});

// Rota para adicionar item ao menu (apenas para administradores)
app.post('/api/menu/addItem', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  const { category, item, description, price } = req.body;

  try {
    const menuItem = await MenuItem.findOne({ category });

    if (menuItem) {
      if (menuItem.items.some((i) => i.name === item)) {
        return res.status(400).json({
          message: `O item "${item}" já existe na categoria "${category}".`,
        });
      }

      menuItem.items.push({ name: item, description });
      await menuItem.save();

      return res.status(200).json({ message: 'Item adicionado com sucesso!' });
    }

    const newMenuItem = new MenuItem({
      category,
      items: [{ name: item, description }],
      price,
    });
    await newMenuItem.save();

    res
      .status(201)
      .json({ message: 'Nova categoria criada e item adicionado com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar item.', error });
  }
});

// Rota para remover item do menu (apenas para administradores)
app.post('/api/menu/removeItem', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  const { category, item } = req.body;

  try {
    const menuItem = await MenuItem.findOne({ category });

    if (!menuItem) {
      return res
        .status(404)
        .json({ message: `Categoria "${category}" não encontrada.` });
    }

    const itemIndex = menuItem.items.findIndex((i) => i.name === item);
    if (itemIndex === -1) {
      return res.status(404).json({
        message: `Item "${item}" não encontrado na categoria "${category}".`,
      });
    }

    menuItem.items.splice(itemIndex, 1);
    await menuItem.save();

    res.status(200).json({
      message: `Item "${item}" removido com sucesso da categoria "${category}".`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover item.', error });
  }
});

// Rota para obter produtos especiais
app.get('/api/special-products', async (req, res) => {
  try {
    const products = await SpecialProduct.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar produtos especiais.', error });
  }
});

// Função para gerar o conteúdo do CSV
function generateCSV(order) {
  const headers = [
    'Item',
    'Categoria',
    'Sabores',
    'Quantidade',
    'Preço Unitário',
    'Preço Total',
  ];
  const rows = order.orderDetails.map((detail) => {
    const sabores = detail.details
      ? [detail.details.flavor1, detail.details.flavor2].filter(Boolean).join(', ')
      : '';
    return [
      detail.item,
      detail.category,
      sabores || '',
      detail.qty,
      detail.pricePerUnit.toFixed(2).replace('.', ','),
      detail.totalPrice.toFixed(2).replace('.', ','),
    ];
  });

  // Adiciona o total do pedido no final
  rows.push(['', '', '', '', 'Total:', order.totalPrice.toFixed(2).replace('.', ',')]);

  // Cria o CSV em formato de string com BOM UTF-8
  const csvContent =
    '\uFEFF' +
    [
      headers.join(';'), // Header
      ...rows.map((row) => row.join(';')), // Rows
    ].join('\n');

  return csvContent;
}

// Função para gerar o conteúdo do e-mail
function generateOrderEmail(order) {
  let emailContent = `<h2>Novo Pedido de ${order.user}</h2>`;
  emailContent += `<p>Data do Pedido: ${new Date(order.createdAt).toLocaleString(
    'pt-BR'
  )}</p>`;
  emailContent += `<p>Total do Pedido: R$${order.totalPrice
    .toFixed(2)
    .replace('.', ',')}</p>`;
  emailContent += `<h3>Detalhes do Pedido:</h3>`;
  emailContent += `<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">`;
  emailContent += `<tr>`;
  emailContent += `<th>Item</th>`;
  emailContent += `<th>Categoria</th>`;
  emailContent += `<th>Sabores</th>`;
  emailContent += `<th>Quantidade</th>`;
  emailContent += `<th>Preço Unitário</th>`;
  emailContent += `<th>Preço Total</th>`;
  emailContent += `</tr>`;

  order.orderDetails.forEach((detail) => {
    let sabores = '';
    if (detail.details) {
      if (detail.details.flavor1) sabores += detail.details.flavor1;
      if (detail.details.flavor2) sabores += `, ${detail.details.flavor2}`;
    }

    emailContent += `<tr>`;
    emailContent += `<td>${detail.item}</td>`;
    emailContent += `<td>${detail.category}</td>`;
    emailContent += `<td>${sabores}</td>`;
    emailContent += `<td>${detail.qty}</td>`;
    emailContent += `<td>R$${detail.pricePerUnit.toFixed(2).replace('.', ',')}</td>`;
    emailContent += `<td>R$${detail.totalPrice.toFixed(2).replace('.', ',')}</td>`;
    emailContent += `</tr>`;

    if (detail.details) {
      let detalhesExtras = '';
      if (detail.details.size) {
        detalhesExtras += `<strong>Tamanho:</strong> ${detail.details.size}<br>`;
      }
      if (detail.details.topping) {
        detalhesExtras += `<strong>Cobertura:</strong> ${detail.details.topping}<br>`;
      }
      if (detail.details.description) {
        detalhesExtras += `<strong>Descrição:</strong> ${detail.details.description}<br>`;
      }
      if (detail.details.additionalNotes) {
        detalhesExtras += `<strong>Notas:</strong> ${detail.details.additionalNotes}<br>`;
      }

      if (detalhesExtras) {
        emailContent += `<tr>`;
        emailContent += `<td colspan="6">${detalhesExtras}</td>`;
        emailContent += `</tr>`;
      }
    }
  });

  emailContent += `</table>`;
  emailContent += `<p>O arquivo CSV com os detalhes do pedido está anexado a este e-mail.</p>`;
  return emailContent;
}

// Rota para criar pedidos
app.post('/api/order', authMiddleware, async (req, res) => {
  const { user, orderDetails } = req.body;

  if (!user || !orderDetails || orderDetails.length === 0) {
    return res.status(400).json({ message: 'Dados do pedido estão incompletos.' });
  }

  const totalPrice = orderDetails.reduce((sum, item) => sum + item.totalPrice, 0);

  try {
    const newOrder = new Order({ user, orderDetails, totalPrice });
    await newOrder.save();

    // Gerar o CSV
    const csvContent = generateCSV(newOrder);
    const csvFilename = `pedido_${user}_${Date.now()}.csv`;

    // Enviar e-mail após salvar o pedido
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO, // E-mail do destinatário (definido em .env)
      subject: `Novo Pedido de ${user}`,
      html: generateOrderEmail(newOrder),
      attachments: [
        {
          filename: csvFilename,
          content: csvContent, // Conteúdo do CSV
          contentType: 'text/csv; charset=utf-8',
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Erro ao enviar e-mail:', error);
      } else {
        console.log('E-mail enviado:', info.response);
      }
    });

    res.status(201).json({ message: 'Pedido salvo com sucesso!', order: newOrder });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao salvar o pedido.', error });
  }
});

// Rota para buscar histórico de pedidos do usuário
app.get('/api/orders', authMiddleware, async (req, res) => {
  const username = req.query.username || req.user.username;

  try {
    const orders = await Order.find({ user: username }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar histórico de pedidos.', error });
  }
});

// Rota para obter a lista de sabores disponíveis
app.get('/api/flavors', authMiddleware, async (req, res) => {
  try {
    // Busca todos os itens do menu
    const menuItems = await MenuItem.find({});
    const flavorsSet = new Set();

    // Extrai os nomes dos itens (sabores) de cada categoria
    menuItems.forEach((menuItem) => {
      menuItem.items.forEach((item) => {
        flavorsSet.add(item.name);
      });
    });

    const flavorList = Array.from(flavorsSet);
    res.json(flavorList);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar sabores.', error });
  }
});

// Rota para obter a lista de categorias disponíveis
app.get('/api/categories', authMiddleware, async (req, res) => {
  try {
    const categories = await MenuItem.distinct('category');
    res.status(200).json(categories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ message: 'Erro ao buscar categorias.', error });
  }
});

// Iniciar o servidor
app.listen(5000, () => {
  console.log('Servidor rodando em http://localhost:5000');
});
