import React from 'react';
import axios from 'axios';

const MenuItems = ({ menuData, currentTab, quantities, updateQuantity, role, setMenuData }) => {
  const removeItem = async (itemName) => {
    if (!itemName) {
      alert('Erro: Nome do item não encontrado.');
      return;
    }

    const categoryData = menuData.find((cat) => cat.category === currentTab);
    if (!categoryData) {
      alert('Categoria atual não encontrada.');
      return;
    }

    const confirmRemoval = window.confirm(`Tem certeza de que deseja remover o item "${itemName}"?`);
    if (!confirmRemoval) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/menu/removeItem',
        { category: currentTab, item: itemName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Atualiza o estado local após a remoção
      setMenuData((prev) =>
        prev.map((cat) =>
          cat.category === currentTab
            ? {
                ...cat,
                items: cat.items.filter((item) => item.name !== itemName),
              }
            : cat
        )
      );

      alert(`Item "${itemName}" removido com sucesso!`);
    } catch (error) {
      console.error('Erro ao remover o item:', error);

      if (error.response) {
        alert(`Erro ao remover o item: ${error.response.data.message}`);
      } else {
        alert('Erro ao remover o item. Verifique sua conexão.');
      }
    }
  };

  return (
    <div className="menu-items-container">
      <div className="menu-items">
        {menuData
          .filter((cat) => cat.category === currentTab)
          .map((category) =>
            category.items.map((item) => (
              <div key={item._id} className="menu-item">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <p className="item-description">{item.description}</p>
                </div>
                <div className="item-controls">
                  <button onClick={() => updateQuantity(item._id, -1)}>-</button>
                  <span>{quantities[item._id] || 0}</span>
                  <button onClick={() => updateQuantity(item._id, 1)}>+</button>
                  {role === 'admin' && (
                    <button
                      className="remove-button"
                      onClick={() => removeItem(item.name)}
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
      </div>
    </div>
  );
};

export default MenuItems;
