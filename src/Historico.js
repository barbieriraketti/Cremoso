import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Historico.css';

const Historico = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [user, setUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const loggedInUser = localStorage.getItem('username');
    setUser(loggedInUser);

    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
          params: { username: loggedInUser },
        });
        setOrders(response.data);
        setFilteredOrders(response.data); // Inicialmente, todos os pedidos são exibidos
      } catch (error) {
        console.error('Erro ao buscar histórico de pedidos:', error);
      }
    };

    fetchOrders();
  }, []);

  const filterOrdersByDate = () => {
    if (!startDate || !endDate) {
      alert('Por favor, selecione ambas as datas para filtrar.');
      return;
    }

    const filtered = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      const start = new Date(startDate);
      const end = new Date(endDate);

      return orderDate >= start && orderDate <= end;
    });

    setFilteredOrders(filtered);
  };

  return (
    <div className="historico">
      <h1>Histórico de Pedidos de {user}</h1>

      <div className="filter-container">
        <label>
          Data Inicial:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          Data Final:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <button onClick={filterOrdersByDate}>Filtrar</button>
      </div>

      {filteredOrders.length === 0 ? (
        <p>Nenhum pedido encontrado para o período selecionado.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Total</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, index) => (
              <tr key={index}>
                <td>{new Date(order.createdAt).toLocaleString('pt-BR')}</td>
                <td>R${order.totalPrice.toFixed(2).replace('.', ',')}</td>
                <td>
                  <ul>
                    {order.orderDetails.map((detail, i) => (
                      <li key={i}>
                        {detail.qty}x {detail.item} - R${detail.totalPrice.toFixed(2).replace('.', ',')}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Historico;
