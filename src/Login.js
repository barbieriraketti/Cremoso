import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/login', {
        username,
        password,
      });

      console.log('Resposta do servidor:', response.data);

      // Obter token, username e role da resposta
      const { token, username: responseUsername, role } = response.data;

      // Verificar se o username está definido
      if (!responseUsername) {
        console.error('Username não está presente na resposta do servidor.');
      }

      // Armazenar os dados no localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('username', responseUsername);
      localStorage.setItem('role', role);

      // Redirecionar para o dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao fazer login');
    }
  };

  return (
    <div className="container">
      {/* Substituímos o texto pela logo */}
      <img 
        src="/assets/logo.png" 
        alt="Logo da Sorveteria Cremoso" 
        className="logo"
      />
      <h2>A Delícia Que Alimenta!</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Digite seu usuário"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Digite sua senha"
        />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
};

export default Login;
