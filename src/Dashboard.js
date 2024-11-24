import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import MenuItems from './MenuItems';
import AdminControls from './AdminControls';
import axios from 'axios';

const Dashboard = () => {
  const [currentTab, setCurrentTab] = useState('');
  const [menuData, setMenuData] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [user, setUser] = useState('');
  const [role, setRole] = useState('user');
  const [orderDetails, setOrderDetails] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const navigate = useNavigate();

  // Obtém o usuário logado e o papel (role) do localStorage
  useEffect(() => {
    const loggedInUser = localStorage.getItem('username');
    const userRole = localStorage.getItem('role') || 'user';
    setUser(loggedInUser);
    setRole(userRole);
  }, []);

  // Busca os dados do menu da API quando o componente é montado
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/menu');
        const sanitizedData = response.data.map((category) => ({
          ...category,
          items: category.items.map((item) => ({
            ...item,
          })),
        }));
        setMenuData(sanitizedData);

        if (sanitizedData.length > 0) {
          setCurrentTab(sanitizedData[0].category);
        }
      } catch (error) {
        console.error('Erro ao buscar os dados do menu:', error);
      }
    };

    fetchMenuData();
  }, []);

  // Função para atualizar a quantidade de um item específico
  const updateQuantity = (itemId, delta) => {
    setQuantities((prev) => {
      const updated = {
        ...prev,
        [itemId]: Math.max((prev[itemId] || 0) + delta, 0),
      };
      return updated;
    });
  };

  // Prepara os detalhes do pedido para revisão antes de enviar
  const prepareOrder = () => {
    const selectedItems = Object.entries(quantities).filter(
      ([_, qty]) => qty > 0
    );

    if (selectedItems.length === 0) {
      alert('Nenhum item selecionado!');
      return;
    }

    let total = 0;
    const details = selectedItems.map(([itemId, qty]) => {
      let itemFound = null;
      let categoryPrice = 0; // Adiciona variável para o preço da categoria

      for (const category of menuData) {
        const item = category.items.find((itm) => itm._id === itemId);
        if (item) {
          itemFound = { ...item, category: category.category };
          categoryPrice = category.price || 0; // Pega o preço da categoria
          break;
        }
      }

      if (itemFound) {
        const itemPrice = categoryPrice * qty; // Usa o preço da categoria
        total += itemPrice;

        return {
          item: itemFound.name || 'Desconhecido',
          qty,
          category: itemFound.category || 'Não especificado',
          pricePerUnit: categoryPrice || 0, // Preço da categoria
          totalPrice: itemPrice || 0,
        };
      }

      return null;
    });

    setOrderDetails(details.filter((d) => d !== null));
    setTotalPrice(total);
    setShowConfirmationModal(true);
  };

  // Gera um arquivo CSV com os detalhes do pedido
  const generateCSV = () => {
    const fileData = orderDetails.map((detail) => ({
      Item: detail.item,
      Categoria: detail.category,
      Quantidade: detail.qty,
      'Preço Unitário': `R$${detail.pricePerUnit?.toFixed(2).replace('.', ',')}`,
      'Preço Total': `R$${detail.totalPrice?.toFixed(2).replace('.', ',')}`,
    }));

    const csvSeparator = ';';
    const csvHeader = [
      'Item',
      'Categoria',
      'Quantidade',
      'Preço Unitário',
      'Preço Total',
    ].map((header) => `"${header}"`);

    const csvRows = fileData.map((row) =>
      [
        row.Item,
        row.Categoria,
        row.Quantidade,
        row['Preço Unitário'],
        row['Preço Total'],
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(csvSeparator)
    );

    csvRows.push(`"","","","",""`);
    csvRows.push(
      `"Total","","","",${`"R$${totalPrice.toFixed(2).replace('.', ',')}"`}`
    );

    const csvContent =
      '\uFEFF' + [csvHeader.join(csvSeparator), ...csvRows].join('\n');

    const currentDate = new Date()
      .toLocaleDateString('pt-BR')
      .replace(/\//g, '-');
    const filename = `pedido_${user || 'usuario'}_${currentDate}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Envia o pedido para a API
  const sendOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        user: user || 'Usuário Anônimo',
        orderDetails,
        totalPrice,
      };

      const response = await axios.post(
        'http://localhost:5000/api/order',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 201) {
        alert('Pedido enviado com sucesso! Obrigado pela preferência.');
        generateCSV();
        setShowConfirmationModal(false);
        setQuantities({});
        setOrderDetails([]);
      } else {
        alert('Erro ao enviar o pedido. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao enviar o pedido:', error);
      alert('Erro ao enviar o pedido. Tente novamente.');
    }
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <img
          src="/assets/logo.png"
          alt="Logo da Sorveteria Cremoso"
          className="logo"
        />
        <h2>Sorveteria Cremoso</h2>
        <h3>{user}</h3>
        <h3>{role === 'admin' ? 'Modo Administrador' : 'Modo Usuário'}</h3>
        <button onClick={() => navigate('/historico')} className="historico-button">
          Ver Histórico
        </button>
      </div>

      <div className="main-content">
      <nav className="tabs">
        {menuData.map((category) => (
          <button
            key={category.category}
            className={`tab-button ${
              category.category === currentTab ? 'active' : ''
            }`}
            onClick={() => setCurrentTab(category.category)}
          >
            {`${category.category} - R$${category.price?.toFixed(2).replace('.', ',')}`}
          </button>
        ))}
      </nav>


        <MenuItems
          menuData={menuData}
          currentTab={currentTab}
          quantities={quantities}
          updateQuantity={updateQuantity}
          role={role}
          setMenuData={setMenuData}
        />

        {role === 'admin' && (
          <AdminControls
            menuData={menuData}
            setMenuData={setMenuData}
            currentTab={currentTab}
          />
        )}
      </div>

      <footer className="footer">
        <button className="confirm-button" onClick={prepareOrder}>
          Enviar Pedido
        </button>
      </footer>

      {showConfirmationModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Confirmação do Pedido</h2>
            <div className="modal-content">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Categoria</th>
                    <th>Quantidade</th>
                    <th>Preço Unitário</th>
                    <th>Preço Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetails.map((detail, index) => (
                    <tr key={index}>
                      <td>{detail.item}</td>
                      <td>{detail.category}</td>
                      <td>{detail.qty}</td>
                      <td>R${detail.pricePerUnit?.toFixed(2).replace('.', ',') || '0,00'}</td>
                      <td>R${detail.totalPrice?.toFixed(2).replace('.', ',') || '0,00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3>Total: R${totalPrice.toFixed(2).replace('.', ',')}</h3>
            <div className="modal-buttons">
              <button onClick={sendOrder}>Confirmar Pedido</button>
              <button onClick={() => setShowConfirmationModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
