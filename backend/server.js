const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com o MongoDB
mongoose.connect('mongodb://localhost:27017/cremoso')
  .then(() => console.log('Conectado ao MongoDB'))
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erro na conexão com o MongoDB:'));

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

// Schema para pedidos
const orderSchema = new mongoose.Schema({
  user: { type: String, required: true },
  orderDetails: [
    {
      item: { type: String, required: true },
      qty: { type: Number, required: true },
      category: { type: String, required: true },
      pricePerUnit: { type: Number, required: true },
      totalPrice: { type: Number, required: true },
    },
  ],
  totalPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

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

// Rota para obter os sabores
app.get('/api/menu', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({});
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar o menu.', error });
  }
});

// Rota para adicionar item ao menu
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

    res.status(201).json({ message: 'Nova categoria criada e item adicionado com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao adicionar item.', error });
  }
});

// Rota para remover item do menu
app.post('/api/menu/removeItem', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  const { category, item } = req.body;

  try {
    const menuItem = await MenuItem.findOne({ category });

    if (!menuItem) {
      return res.status(404).json({ message: `Categoria "${category}" não encontrada.` });
    }

    const itemIndex = menuItem.items.findIndex((i) => i.name === item);
    if (itemIndex === -1) {
      return res.status(404).json({ message: `Item "${item}" não encontrado na categoria "${category}".` });
    }

    menuItem.items.splice(itemIndex, 1);
    await menuItem.save();

    res.status(200).json({ message: `Item "${item}" removido com sucesso da categoria "${category}".` });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover item.', error });
  }
});

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

// Iniciar o servidor
app.listen(5000, () => {
  console.log('Servidor rodando em http://localhost:5000');
});
