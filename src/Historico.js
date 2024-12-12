import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Historico.css';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Autocomplete, TextField, Box, Grid, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

ChartJS.register(...registerables);

function fixEncoding(str) {
  if (!str) return str;
  try {
    return decodeURIComponent(escape(str));
  } catch (e) {
    return str;
  }
}

const Historico = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [user, setUser] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchCategory, setSearchCategory] = useState('Todos');
  const [searchFlavor, setSearchFlavor] = useState('');

  const [flavorSuggestions, setFlavorSuggestions] = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);

  const [salesData, setSalesData] = useState(null);
  const [topItemsData, setTopItemsData] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = localStorage.getItem('username');
    const token = localStorage.getItem('token');

    setUser(loggedInUser || 'Usuário Anônimo');

    if (!loggedInUser || !token) {
      console.warn('Usuário não autenticado ou token ausente. Não será possível carregar histórico.');
      return;
    }

    const fetchData = async () => {
      try {
        const [ordersResponse, flavorsResponse, categoriesResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/orders', {
            headers: { Authorization: `Bearer ${token}` },
            params: { username: loggedInUser },
          }),
          axios.get('http://localhost:5000/api/flavors', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/categories', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const ordersData = ordersResponse.data || [];
        const flavorsData = flavorsResponse.data || [];
        let categoriesData = categoriesResponse.data || [];

        if (!categoriesData.includes('Todos')) {
          categoriesData = ['Todos', ...categoriesData];
        }

        if (!categoriesData.includes('Pedido Especial')) {
          categoriesData.push('Pedido Especial');
        }

        setOrders(ordersData);
        setFilteredOrders(ordersData);
        setFlavorSuggestions(flavorsData);
        setCategorySuggestions(categoriesData);

        processSalesData(ordersData);
        processTopItemsData(ordersData);
      } catch (error) {
        console.error('Erro ao buscar histórico e dados:', error);
      }
    };

    fetchData();
  }, []);

  const filterOrders = () => {
    let filtered = [...orders];

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= start && orderDate <= end;
      });
    }

    if (searchCategory && searchCategory !== 'Todos') {
      filtered = filtered.filter((order) =>
        order.orderDetails.some((detail) => detail.category === searchCategory)
      );
    }

    if (searchFlavor.trim() !== '') {
      const flavorToSearch = searchFlavor.trim().toLowerCase();
      filtered = filtered.filter((order) =>
        order.orderDetails.some((detail) => {
          const itemName = detail.item.toLowerCase();
          const f1 = detail.details?.flavor1?.toLowerCase() || '';
          const f2 = detail.details?.flavor2?.toLowerCase() || '';

          return itemName.includes(flavorToSearch) || f1.includes(flavorToSearch) || f2.includes(flavorToSearch);
        })
      );
    }

    setFilteredOrders(filtered);
    processSalesData(filtered);
    processTopItemsData(filtered);
  };

  const processSalesData = (ordersData) => {
    if (!ordersData || ordersData.length === 0) {
      setSalesData(null);
      return;
    }

    const salesPerDay = {};

    ordersData.forEach((order) => {
      const date = new Date(order.createdAt);
      const dateString = date.toLocaleDateString('pt-BR');
      if (!salesPerDay[dateString]) {
        salesPerDay[dateString] = 0;
      }
      salesPerDay[dateString] += order.totalPrice;
    });

    const sortedSales = Object.entries(salesPerDay).sort((a, b) => {
      const [diaA, mesA, anoA] = a[0].split('/');
      const [diaB, mesB, anoB] = b[0].split('/');
      const dateA = new Date(+anoA, mesA - 1, +diaA);
      const dateB = new Date(+anoB, mesB - 1, +diaB);
      return dateA - dateB;
    });

    const labels = sortedSales.map((entry) => entry[0]);
    const data = sortedSales.map((entry) => entry[1]);

    setSalesData({
      labels,
      datasets: [
        {
          label: 'Total de Vendas (R$)',
          data,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          borderWidth: 1,
        },
      ],
    });
  };

  const processTopItemsData = (ordersData) => {
    if (!ordersData || ordersData.length === 0) {
      setTopItemsData(null);
      return;
    }

    const itemQuantities = {};

    ordersData.forEach((order) => {
      order.orderDetails.forEach((detail) => {
        const itemKey = `${detail.item} (${detail.category})`;
        itemQuantities[itemKey] = (itemQuantities[itemKey] || 0) + detail.qty;
      });
    });

    const sortedItems = Object.entries(itemQuantities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const labels = sortedItems.map((item) => item[0]);
    const data = sortedItems.map((item) => item[1]);

    setTopItemsData({
      labels,
      datasets: [
        {
          label: 'Quantidade Vendida',
          data,
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        },
      ],
    });
  };

  const downloadSummary = () => {
    if (filteredOrders.length === 0) {
      alert('Nenhum pedido filtrado para gerar o resumo.');
      return;
    }

    const summaryMap = new Map();
    filteredOrders.forEach((order) => {
      order.orderDetails.forEach((detail) => {
        const key = `${detail.category}|||${detail.item}`;
        const prev = summaryMap.get(key) || 0;
        summaryMap.set(key, prev + detail.qty);
      });
    });

    const summaryArray = Array.from(summaryMap.entries()).map(([key, qty]) => {
      const [category, item] = key.split('|||');
      return { category, item, qty };
    });

    summaryArray.sort((a, b) => b.qty - a.qty);

    const headers = ['Categoria', 'Sabor', 'Quantidade'];
    const rows = summaryArray.map(({ category, item, qty }) => [
      fixEncoding(category),
      fixEncoding(item),
      qty
    ]);

    // Data do download
    const downloadDate = new Date().toLocaleString('pt-BR');
    // Período selecionado
    const periodo = (startDate && endDate) 
      ? `Período: ${startDate} - ${endDate}`
      : 'Período: Não especificado';

    const csvLines = [
      `Data do Download: ${downloadDate}`,
      periodo,
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ];

    const csvContent = '\uFEFF' + csvLines.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'resumo.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="historico">
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        Histórico de Pedidos de {user}
      </Typography>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </div>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} justifyContent="center" alignItems="flex-end">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              label="Data Inicial"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              label="Data Final"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Autocomplete
              fullWidth
              options={categorySuggestions}
              value={searchCategory}
              onChange={(event, newValue) => setSearchCategory(newValue || 'Todos')}
              openOnFocus
              clearOnEscape
              getOptionLabel={(option) => option || ''}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Categoria"
                  variant="outlined"
                  size="small"
                  placeholder="Selecione a categoria"
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Autocomplete
              fullWidth
              options={flavorSuggestions}
              value={searchFlavor}
              onChange={(event, newValue) => setSearchFlavor(newValue || '')}
              openOnFocus
              clearOnEscape
              getOptionLabel={(option) => option || ''}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Sabor"
                  variant="outlined"
                  size="small"
                  placeholder="Digite ou selecione o sabor"
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2} textAlign="center">
            <Button
              variant="contained"
              color="primary"
              onClick={filterOrders}
              startIcon={<span role="img" aria-label="search">🔍</span>}
              sx={{ mt: { xs: 2, sm: 0 } }}
            >
              Filtrar
            </Button>
          </Grid>
        </Grid>
      </Box>

      {filteredOrders.length > 0 && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Button variant="contained" color="secondary" onClick={downloadSummary}>
            Download Resumo
          </Button>
        </div>
      )}

      {salesData && (
        <div className="chart-container">
          <h2>Total de Vendas no Período Selecionado</h2>
          <Bar data={salesData} />
        </div>
      )}

      {topItemsData && (
        <div className="chart-container">
          <h2>Top 5 Tipos de Sorvetes Mais Pedidos</h2>
          <Pie data={topItemsData} />
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <Typography variant="body1" align="center">
          Nenhum pedido encontrado para os filtros selecionados.
        </Typography>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Total (R$)</th>
              <th>Detalhes do Pedido</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, index) => (
              <tr key={index}>
                <td>{new Date(order.createdAt).toLocaleString('pt-BR')}</td>
                <td>{order.totalPrice.toFixed(2).replace('.', ',')}</td>
                <td>
                  <ul>
                    {order.orderDetails.map((detail, i) => (
                      <li key={i} style={{ marginBottom: '10px' }}>
                        <strong>{detail.qty}x</strong> {detail.category} - {detail.item} - R$
                        {detail.totalPrice.toFixed(2).replace('.', ',')}
                        {detail.details && (
                          <ul style={{ marginTop: '5px', marginLeft: '15px' }}>
                            {detail.details.size && <li>Tamanho: {detail.details.size}</li>}
                            {detail.details.flavor1 && <li>Sabor 1: {detail.details.flavor1}</li>}
                            {detail.details.flavor2 && <li>Sabor 2: {detail.details.flavor2}</li>}
                            {detail.details.topping && <li>Cobertura: {detail.details.topping}</li>}
                            {detail.details.description && (
                              <li>Descrição: {detail.details.description}</li>
                            )}
                            {detail.details.additionalNotes && (
                              <li>Notas: {detail.details.additionalNotes}</li>
                            )}
                          </ul>
                        )}
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
