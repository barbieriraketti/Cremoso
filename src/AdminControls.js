import React from 'react';
import axios from 'axios';

const AdminControls = ({ menuData, setMenuData, currentTab }) => {
  const addNewItem = async () => {
    const categoryData = menuData.find((cat) => cat.category === currentTab);

    // Verifica se a categoria é válida
    if (!categoryData && !window.confirm(`A categoria "${currentTab}" não existe. Deseja criar uma nova categoria?`)) {
      return;
    }

    const newItemName = prompt('Digite o nome do novo sabor:');
    if (!newItemName || newItemName.trim() === '') {
      alert('O nome do sabor é obrigatório.');
      return;
    }

    const newItemDescription = prompt('Digite a descrição do novo sabor:');
    if (!newItemDescription || newItemDescription.trim() === '') {
      alert('A descrição do sabor é obrigatória.');
      return;
    }

    let price = null;
    if (!categoryData) {
      price = prompt('Digite o preço da nova categoria:');
      if (!price || isNaN(price) || Number(price) <= 0) {
        alert('O preço deve ser um número válido maior que zero.');
        return;
      }
      price = parseFloat(price);
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/menu/addItem',
        {
          category: currentTab,
          item: newItemName,
          description: newItemDescription,
          price,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Atualiza o estado do menu localmente
      setMenuData((prev) =>
        prev.map((cat) =>
          cat.category === currentTab
            ? {
                ...cat,
                items: [...cat.items, { name: newItemName, description: newItemDescription }],
              }
            : cat
        ).concat(
          !categoryData
            ? [{ category: currentTab, items: [{ name: newItemName, description: newItemDescription }], price }]
            : []
        )
      );

      alert(`Novo item "${newItemName}" adicionado com sucesso!`);
    } catch (error) {
      console.error('Erro ao adicionar novo item:', error);
      alert(error.response?.data?.message || 'Erro ao adicionar novo item.');
    }
  };

  return (
    <div className="admin-controls">
      <h3>Administração</h3>
      <button onClick={addNewItem}>Adicionar Novo Item</button>
    </div>
  );
};

export default AdminControls;
