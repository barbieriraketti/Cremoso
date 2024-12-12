// Pedidos.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Pedidos.css';
import { useNavigate } from 'react-router-dom';

const Pedidos = () => {
  const [size, setSize] = useState('');
  const [item, setItem] = useState('');
  const [flavor1, setFlavor1] = useState('');
  const [flavor2, setFlavor2] = useState('');
  const [topping, setTopping] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [price, setPrice] = useState(0);
  const [user, setUser] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [totalOrderPrice, setTotalOrderPrice] = useState(0);
  const [products, setProducts] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    // Obter produtos do backend
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/special-products');
        setProducts(response.data);
      } catch (error) {
        console.error('Erro ao buscar produtos especiais:', error);
      }
    };

    fetchProducts();

    const loggedInUser = localStorage.getItem('username');
    setUser(loggedInUser || 'Usuário Anônimo');
  }, []);

  // Ao montar, tenta carregar o pedido salvo no localStorage
  useEffect(() => {
    const savedOrderItems = JSON.parse(localStorage.getItem('orderItems')) || [];
    const savedTotalPrice = parseFloat(localStorage.getItem('totalOrderPrice')) || 0;
    setOrderItems(savedOrderItems);
    setTotalOrderPrice(savedTotalPrice);
  }, []);

  // Sempre que orderItems ou totalOrderPrice mudar, salva no localStorage
  useEffect(() => {
    localStorage.setItem('orderItems', JSON.stringify(orderItems));
    localStorage.setItem('totalOrderPrice', totalOrderPrice.toString());
  }, [orderItems, totalOrderPrice]);

  // Atualizar tamanhos disponíveis quando o item muda
  useEffect(() => {
    const selectedProduct = products.find((p) => p.name === item);
    if (selectedProduct && selectedProduct.sizes) {
      setAvailableSizes(selectedProduct.sizes);
    } else {
      setAvailableSizes([]);
    }
    // Resetar o tamanho selecionado
    setSize('');
  }, [item, products]);

  // Função para calcular o preço com base nos inputs
  useEffect(() => {
    const selectedProduct = products.find((p) => p.name === item);
    let basePrice = 0;

    if (selectedProduct) {
      if (item === 'Bolo' && size) {
        // Encontrar o preço do tamanho selecionado
        const sizeObj = selectedProduct.sizes.find((s) => s.name === size);
        if (sizeObj) {
          basePrice = sizeObj.price;
        }
      } else {
        basePrice = selectedProduct.basePrice || 0;
      }
    }

    // Multiplicar pela quantidade
    const totalPrice = basePrice * quantity;
    setPrice(totalPrice);
  }, [size, item, quantity, products]);

  // Função para adicionar item ao pedido
  const handleAddItem = (e) => {
    e.preventDefault();

    // Verifica se o item foi selecionado
    if (!item) {
      alert('Por favor, selecione um item.');
      return;
    }

    // Prepare details object
    let details = {};

    if (item === 'Bolo') {
      details.size = size;
      details.flavor1 = flavor1;
      if (flavor2) details.flavor2 = flavor2;
      if (topping) details.topping = topping;
      if (additionalNotes) details.additionalNotes = additionalNotes;
    } else if (item === 'Diversos') {
      details.description = additionalNotes; // Usamos additionalNotes como descrição
    } else {
      // Para outros itens, como Brownie, Petit Gateau
      if (additionalNotes) details.additionalNotes = additionalNotes;
    }

    const category = "Pedido Especial"; // Manter categoria fixa conforme solicitado

    // Prepare orderDetail
    const orderDetail = {
      item: item,
      qty: quantity,
      category: category, 
      pricePerUnit: price / quantity || 0,
      totalPrice: price || 0,
      details: Object.keys(details).length > 0 ? details : undefined,
    };

    // Adicionar item à lista de itens do pedido
    setOrderItems((prevItems) => [...prevItems, orderDetail]);

    // Atualizar o preço total do pedido
    setTotalOrderPrice((prevTotal) => prevTotal + price);

    // Limpar os campos do formulário para o próximo item
    setSize('');
    setItem('');
    setFlavor1('');
    setFlavor2('');
    setTopping('');
    setQuantity(1);
    setAdditionalNotes('');
    setPrice(0);
  };

  // Função para gerar o CSV do pedido (usada no envio do pedido)
  const generateCSV = () => {
    const fileData = orderItems.map((detail) => {
      const details = detail.details || {};
      return {
        Item: detail.item,
        Categoria: detail.category,
        Quantidade: detail.qty,
        'Preço Unitário': `R$${detail.pricePerUnit?.toFixed(2).replace('.', ',')}`,
        'Preço Total': `R$${detail.totalPrice?.toFixed(2).replace('.', ',')}`,
        Tamanho: details.size || '',
        'Sabor 1': details.flavor1 || '',
        'Sabor 2': details.flavor2 || '',
        Cobertura: details.topping || '',
        Descrição: details.description || '',
        'Notas Adicionais': details.additionalNotes || '',
      };
    });

    const csvSeparator = ';';
    const csvHeader = [
      'Item',
      'Categoria',
      'Quantidade',
      'Preço Unitário',
      'Preço Total',
      'Tamanho',
      'Sabor 1',
      'Sabor 2',
      'Cobertura',
      'Descrição',
      'Notas Adicionais',
    ].map((header) => `"${header}"`);

    const csvRows = fileData.map((row) =>
      [
        row.Item,
        row.Categoria,
        row.Quantidade,
        row['Preço Unitário'],
        row['Preço Total'],
        row.Tamanho,
        row['Sabor 1'],
        row['Sabor 2'],
        row.Cobertura,
        row.Descrição,
        row['Notas Adicionais'],
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(csvSeparator)
    );

    csvRows.push(`"","","","",""`);
    csvRows.push(
      `"Total","","","",${`"R$${totalOrderPrice.toFixed(2).replace('.', ',')}"`}`
    );

    const csvContent =
      '\uFEFF' + [csvHeader.join(csvSeparator), ...csvRows].join('\n');

    const currentDate = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const filename = `pedido_especial_${user || 'usuario'}_${currentDate}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para enviar o pedido completo
  const submitOrder = async () => {
    if (orderItems.length === 0) {
      alert('Nenhum item no pedido. Adicione itens antes de enviar.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        user,
        orderDetails: orderItems,
        totalPrice: totalOrderPrice,
      };

      const response = await axios.post('http://localhost:5000/api/order', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 201) {
        alert('Pedido especial enviado com sucesso!');
        generateCSV(); // Gera o CSV após enviar o pedido

        // Limpa o pedido após o envio
        setOrderItems([]);
        setTotalOrderPrice(0);
        localStorage.removeItem('orderItems');
        localStorage.removeItem('totalOrderPrice');

        navigate('/dashboard'); // Redireciona de volta para o dashboard
      } else {
        alert('Erro ao enviar o pedido. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao enviar o pedido:', error);
      alert('Erro ao enviar o pedido. Tente novamente.');
    }
  };

  return (
    <div className="pedidos-container">
      <h1>Fazer Pedido Especial</h1>
      <form onSubmit={handleAddItem} className="pedido-form">
        {/* Seleção de Item */}
        <label>
          Item:
          <select value={item} onChange={(e) => setItem(e.target.value)} required>
            <option value="">Selecione um item</option>
            {products.map((product) => (
              <option key={product.name} value={product.name}>
                {product.name}
              </option>
            ))}
          </select>
        </label>

        {/* Seleção de Tamanho (apenas para Bolo) */}
        {item === 'Bolo' && (
          <label>
            Tamanho:
            <select value={size} onChange={(e) => setSize(e.target.value)} required>
              <option value="">Selecione um tamanho</option>
              {availableSizes.map((sizeOption) => (
                <option key={sizeOption.name} value={sizeOption.name}>
                  {sizeOption.name} - R${sizeOption.price.toFixed(2).replace('.', ',')}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Campos específicos para Bolo */}
        {item === 'Bolo' && (
          <>
            <label>
              Sabor 1:
              <input
                type="text"
                value={flavor1}
                onChange={(e) => setFlavor1(e.target.value)}
                required
              />
            </label>
            <label>
              Sabor 2:
              <input
                type="text"
                value={flavor2}
                onChange={(e) => setFlavor2(e.target.value)}
              />
            </label>
            <label>
              Cobertura:
              <input
                type="text"
                value={topping}
                onChange={(e) => setTopping(e.target.value)}
              />
            </label>
            <label>
              Notas Adicionais:
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Alguma observação?"
              ></textarea>
            </label>
          </>
        )}

        {/* Campo de descrição para Diversos */}
        {item === 'Diversos' && (
          <>
            <label>
              Descrição do Produto:
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Descreva o produto"
                required
              ></textarea>
            </label>
          </>
        )}

        {/* Quantidade */}
        <label>
          Quantidade:
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            required
          />
        </label>

        {/* Exibição do Preço */}
        <h3>Preço do Item: R${price.toFixed(2).replace('.', ',')}</h3>

        {/* Botões */}
        <div className="buttons">
          <button type="submit">Adicionar Item</button>
          {/* Botão Voltar (mantém o pedido) */}
          <button type="button" onClick={() => navigate(-1)}>
            Voltar
          </button>
          {/* Botão Cancelar (termina o pedido) */}
          <button
            type="button"
            onClick={() => {
              // Cancelar: limpa estado e localStorage e volta ao dashboard
              setOrderItems([]);
              setTotalOrderPrice(0);
              localStorage.removeItem('orderItems');
              localStorage.removeItem('totalOrderPrice');
              navigate('/dashboard');
            }}
          >
            Cancelar
          </button>
        </div>
      </form>

      {/* Lista de itens adicionados */}
      {orderItems.length > 0 && (
        <div className="order-summary">
          <h2>Itens do Pedido</h2>
          <ul>
            {orderItems.map((orderItem, index) => (
              <li key={index}>
                {orderItem.qty}x {orderItem.item} - R$
                {orderItem.totalPrice.toFixed(2).replace('.', ',')}
                {/* Mostrar detalhes adicionais */}
                {orderItem.details && (
                  <ul>
                    {orderItem.details.size && <li>Tamanho: {orderItem.details.size}</li>}
                    {orderItem.details.flavor1 && (
                      <li>Sabor 1: {orderItem.details.flavor1}</li>
                    )}
                    {orderItem.details.flavor2 && (
                      <li>Sabor 2: {orderItem.details.flavor2}</li>
                    )}
                    {orderItem.details.topping && (
                      <li>Cobertura: {orderItem.details.topping}</li>
                    )}
                    {orderItem.details.description && (
                      <li>Descrição: {orderItem.details.description}</li>
                    )}
                    {orderItem.details.additionalNotes && (
                      <li>Notas: {orderItem.details.additionalNotes}</li>
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <h3>Total do Pedido: R${totalOrderPrice.toFixed(2).replace('.', ',')}</h3>
          <button className="submit-order-button" onClick={submitOrder}>
            Enviar Pedido
          </button>
        </div>
      )}
    </div>
  );
};

export default Pedidos;
