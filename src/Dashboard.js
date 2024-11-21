import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import axios from 'axios';

const Dashboard = () => {
  const [currentTab, setCurrentTab] = useState(''); // Aba ativa
  const [menuData, setMenuData] = useState([]); // Dados do menu vindos do servidor
  const [quantities, setQuantities] = useState({}); // Quantidade por item
  const [user, setUser] = useState(''); // Nome do usuário logado
  const [role, setRole] = useState('user'); // Papel do usuário
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // Controle do modal
  const [orderDetails, setOrderDetails] = useState([]); // Detalhes do pedido
  const [totalPrice, setTotalPrice] = useState(0); // Preço total do pedido

  // Obter o usuário logado e o papel
  useEffect(() => {
    const loggedInUser = localStorage.getItem('username');
    const userRole = localStorage.getItem('role') || 'user';
    setUser(loggedInUser);
    setRole(userRole);
  }, []);

  // Buscar os dados do menu do servidor
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/menu');
        const data = response.data;
        setMenuData(data);

        // Define a primeira categoria como aba ativa
        if (data.length > 0) {
          setCurrentTab(data[0].category);
        }
      } catch (error) {
        console.error('Erro ao buscar os dados do menu:', error);
      }
    };

    fetchMenuData();
  }, []);

  // Atualiza a quantidade de itens
  const updateQuantity = (itemName, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [itemName]: Math.max((prev[itemName] || 0) + delta, 0),
    }));
  };

  // Preparar dados do pedido para confirmação
  const prepareOrder = () => {
    const selectedItems = Object.entries(quantities).filter(
      ([_, qty]) => qty > 0
    );
    if (selectedItems.length === 0) {
      alert('Nenhum item selecionado!');
    } else {
      let total = 0;
      const details = selectedItems.map(([itemName, qty]) => {
        // Encontrar a categoria e o preço do item
        let itemCategory = '';
        let pricePerUnit = 0;
        for (const categoryData of menuData) {
          const foundItem = categoryData.items.find((i) => i.name === itemName);
          if (foundItem) {
            itemCategory = categoryData.category;
            pricePerUnit = categoryData.price;
            break;
          }
        }
        const itemPrice = pricePerUnit * qty;
        total += itemPrice;
        return {
          item: itemName,
          qty,
          category: itemCategory,
          pricePerUnit: pricePerUnit,
          totalPrice: itemPrice,
        };
      });

      setOrderDetails(details);
      setTotalPrice(total);
      setShowConfirmationModal(true);
    }
  };

  // Função para confirmar o pedido e gerar o arquivo CSV
  const confirmOrder = () => {
    // Preparar dados para o arquivo
    const fileData = orderDetails.map((detail) => ({
      Item: detail.item,
      Categoria: detail.category,
      Quantidade: detail.qty,
      'Preço Unitário': detail.pricePerUnit,
      'Preço Total': detail.totalPrice,
    }));

    // Converter dados para CSV com BOM
    const csvSeparator = ';'; // Use ';' se necessário
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

    // Adicionar a linha do preço total ao CSV
    csvRows.push(`"","","","",""`);
    csvRows.push(`"Total","","","",${totalPrice}`);

    const csvContent =
      '\uFEFF' + [csvHeader.join(csvSeparator), ...csvRows].join('\n');

    // Obter a data atual e o nome do usuário para o nome do arquivo
    const currentDate = new Date()
      .toLocaleDateString('pt-BR')
      .replace(/\//g, '-');
    const username = user || 'usuario';

    const filename = `pedido_${username}_${currentDate}.csv`;

    // Criar link para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link); // Requerido para Firefox

    link.click(); // Baixar o arquivo CSV

    document.body.removeChild(link); // Limpar

    // Fechar o modal e resetar as quantidades
    setShowConfirmationModal(false);
    setQuantities({});
    alert('Pedido confirmado! Obrigado pela preferência.');
  };

  // Funções de administrador
  const addNewItem = async (category) => {
    const categoryData = menuData.find((cat) => cat.category === category);
    if (!categoryData) return;

    const newItemName = prompt('Digite o nome do novo sabor:');
    if (newItemName) {
      const newItemDescription = prompt('Digite a descrição do novo sabor:');
      try {
        const token = localStorage.getItem('token');
        await axios.post(
          'http://localhost:5000/api/menu/addItem',
          { category, item: newItemName, description: newItemDescription },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // Atualiza o estado local
        setMenuData((prev) =>
          prev.map((cat) =>
            cat.category === category
              ? {
                  ...cat,
                  items: [
                    ...cat.items,
                    { name: newItemName, description: newItemDescription },
                  ],
                }
              : cat
          )
        );
        alert(
          `Novo item "${newItemName}" adicionado à categoria "${category}"!`
        );
      } catch (error) {
        console.error('Erro ao adicionar novo item:', error);
        alert('Erro ao adicionar novo item.');
      }
    } else {
      alert('Nenhum nome fornecido. Operação cancelada.');
    }
  };

  const removeItem = async (category, itemToRemove) => {
    const categoryData = menuData.find((cat) => cat.category === category);
    if (!categoryData) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/menu/removeItem',
        { category, item: itemToRemove },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Atualiza o estado local
      setMenuData((prev) =>
        prev.map((cat) =>
          cat.category === category
            ? {
                ...cat,
                items: cat.items.filter((item) => item.name !== itemToRemove),
              }
            : cat
        )
      );
      alert(
        `Item "${itemToRemove}" removido da categoria "${category}"!`
      );
    } catch (error) {
      console.error('Erro ao remover item:', error);
      alert('Erro ao remover item.');
    }
  };

  return (
    <div className="dashboard">
      {/* Barra Lateral */}
      <div className="sidebar">
        <img
          src="/assets/logo.png"
          alt="Logo da Sorveteria Cremoso"
          className="logo"
        />
        <h2>Sorveteria Cremoso</h2>
        <h3>{user}</h3>
        <h3>{role === 'admin' ? 'Modo Administrador' : 'Modo Usuário'}</h3>
      </div>

      {/* Conteúdo Principal */}
      <div className="main-content">
        {/* Navegação por Abas */}
        <nav className="tabs">
          {menuData.map((category) => (
            <button
              key={category.category}
              className={`tab-button ${
                category.category === currentTab ? 'active' : ''
              }`}
              onClick={() => setCurrentTab(category.category)}
            >
              {category.category} - R${category.price}
            </button>
          ))}
        </nav>

        {/* Área Scrollável dos Produtos */}
        <div className="menu-items-container">
          <div className="menu-items">
            {menuData
              .filter((cat) => cat.category === currentTab)
              .map((category) =>
                category.items.map((item) => (
                  <div key={item.name} className="menu-item">
                    <span className="item-name">{item.name}</span>
                    <p className="item-description">{item.description}</p>
                    <div className="item-controls">
                      <button onClick={() => updateQuantity(item.name, -1)}>
                        -
                      </button>
                      <span>{quantities[item.name] || 0}</span>
                      <button onClick={() => updateQuantity(item.name, 1)}>
                        +
                      </button>
                    </div>
                    {/* Botão de Remover visível apenas para o administrador */}
                    {role === 'admin' && (
                      <button
                        className="remove-button"
                        onClick={() => removeItem(currentTab, item.name)}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))
              )}
          </div>
        </div>

        {/* Exibir controles de administrador somente se o papel for 'admin' */}
        {role === 'admin' && (
          <div className="admin-controls">
            <h3>Administração</h3>
            <button onClick={() => addNewItem(currentTab)}>
              Adicionar Novo Item
            </button>
          </div>
        )}

        {/* Rodapé */}
        <footer className="footer">
          <button className="confirm-button" onClick={prepareOrder}>
            Confirmar Pedido
          </button>
        </footer>
      </div>

      {/* Modal de Confirmação */}
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
                      <td>R${detail.pricePerUnit}</td>
                      <td>R${detail.totalPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3>Total: R${totalPrice}</h3>
            <div className="modal-buttons">
              <button onClick={confirmOrder}>Confirmar Pedido</button>
              <button onClick={() => setShowConfirmationModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Dashboard;
