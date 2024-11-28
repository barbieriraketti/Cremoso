# **Cremoso - Sistema de Pedidos de Sorveteria**

## **Descrição do Projeto**
O sistema "Cremoso" é uma solução completa para gerenciamento de pedidos de uma sorveteria, permitindo que os clientes criem pedidos personalizados, que sejam armazenados em um banco de dados MongoDB e enviados por e-mail com um arquivo CSV anexo. O projeto inclui um backend em **Node.js** com Express e MongoDB, e um frontend que permite interações dinâmicas para adicionar itens ao pedido.

---

## **Funcionalidades do Sistema**

### **Frontend**
1. **Interface de Pedidos**:
   - Criação de pedidos personalizados com opções de sabores, tamanhos e descrições.
   - Exibição do preço unitário e total do pedido.
   - Adição de múltiplos itens ao pedido.

2. **Gerenciamento de Itens no Pedido**:
   - Visualização de todos os itens adicionados ao pedido antes da submissão.
   - Alteração dinâmica do preço com base no tamanho, quantidade e tipo de item.

3. **Envio de Pedidos**:
   - Botão para enviar o pedido ao backend.
   - Redirecionamento para o painel principal após o envio bem-sucedido.

---

### **Backend**
1. **Gerenciamento de Usuários**:
   - Registro de novos usuários com validação de credenciais.
   - Login de usuários com autenticação JWT.
   - Suporte a diferentes níveis de permissão (usuário comum e administrador).

2. **Banco de Dados**:
   - MongoDB para armazenar:
     - Usuários.
     - Itens do menu (fixos e especiais).
     - Pedidos feitos pelos clientes.

3. **Pedidos Personalizados**:
   - Armazenamento de pedidos personalizados com informações detalhadas, incluindo:
     - Sabores.
     - Categoria.
     - Tamanho.
     - Preço unitário e total.
     - Notas adicionais.
   - Cálculo automático do preço total com base nos itens e quantidades selecionadas.

4. **Envio de Pedidos por E-mail**:
   - Envio automático de e-mails para o administrador com:
     - Um resumo detalhado do pedido em formato HTML.
     - Um arquivo CSV anexo contendo os detalhes do pedido.

5. **Geração de Arquivo CSV**:
   - Criação dinâmica de um arquivo CSV com informações do pedido:
     - Nome do item.
     - Categoria.
     - Sabores.
     - Quantidade.
     - Preço unitário e total.
   - Anexo do arquivo CSV ao e-mail enviado ao administrador.

6. **Rotas do Backend**:
   - `/register`: Cadastro de novos usuários.
   - `/login`: Autenticação de usuários com geração de tokens JWT.
   - `/api/menu`: Obtenção dos itens disponíveis no menu.
   - `/api/special-products`: Obtenção de itens especiais com preços dinâmicos.
   - `/api/order`: Criação de pedidos personalizados.
   - `/api/orders`: Recuperação do histórico de pedidos do usuário.

---

## **Fluxo do Sistema**
1. **Cadastro/Login**:
   - O usuário se cadastra ou faz login para acessar o sistema.

2. **Criação do Pedido**:
   - O usuário seleciona itens do menu e os adiciona ao pedido, personalizando sabores, tamanhos e notas adicionais.

3. **Envio do Pedido**:
   - Após finalizar o pedido, o usuário envia os detalhes para o backend.

4. **Armazenamento no Banco de Dados**:
   - O pedido é salvo no MongoDB com todos os detalhes.

5. **Envio por E-mail**:
   - O backend envia um e-mail ao administrador com:
     - Resumo do pedido em HTML.
     - Arquivo CSV com os detalhes anexado.

6. **Histórico de Pedidos**:
   - O usuário pode acessar seu histórico de pedidos a qualquer momento.

---

## **Estrutura de Arquivos**

### **Frontend**
- **`/src`**:
  - `App.js`: Configuração principal da aplicação React.
  - `Pedidos.js`: Tela de criação de pedidos especiais.
  - `Dashboard.js`: Tela inicial com navegação para funcionalidades do sistema.
  - `Pedidos.css`: Estilo da tela de pedidos.

### **Backend**
- **`server.js`**: Configuração do servidor e rotas principais.
- **`.env`**: Variáveis de ambiente para credenciais sensíveis.
- **`package.json`**: Dependências do projeto.
- **`/models`**:
  - `User.js`: Modelo de usuário.
  - `MenuItem.js`: Modelo para itens do menu.
  - `Order.js`: Modelo de pedidos.
  - `SpecialProduct.js`: Modelo para produtos especiais.

---

## **Tecnologias Utilizadas**

### **Frontend**
- React.js:
  - Gerenciamento de estados com hooks.
  - Rotas e navegação.

### **Backend**
- Node.js:
  - Framework **Express** para gerenciamento de rotas.
  - **Nodemailer** para envio de e-mails.
  - **JWT** para autenticação de usuários.
- MongoDB:
  - Armazenamento e gerenciamento de dados do sistema.
  - Modelos definidos com **Mongoose**.

---

## **Dependências do Backend**
- **Express**: Servidor HTTP.
- **Mongoose**: ODM para integração com MongoDB.
- **Nodemailer**: Envio de e-mails.
- **jsonwebtoken**: Autenticação baseada em tokens.
- **dotenv**: Gerenciamento de variáveis de ambiente.

Para instalar as dependências:
```bash
npm install
```

---

## **Como Configurar e Executar o Sistema**

### **Pré-requisitos**
- Node.js instalado na máquina.
- MongoDB em execução localmente ou em um servidor remoto.

### **Configuração**
1. Clone o repositório do projeto.
2. Configure as variáveis de ambiente no arquivo `.env`:
   ```
   EMAIL_USER=seu_email@gmail.com
   EMAIL_PASS=sua_senha_de_aplicativo
   EMAIL_TO=email_destinatario@gmail.com
   JWT_SECRET=seu_segredo_jwt
   ```
3. Instale as dependências no backend:
   ```bash
   npm install
   ```
4. Inicie o servidor:
   ```bash
   node server.js
   ```
5. No frontend, configure a URL do backend, instale as dependências e inicie a aplicação.

---

## **Principais Funcionalidades a Serem Adicionadas**
1. **Dashboard Administrativo**:
   - Permitir gerenciamento de itens do menu pelo administrador.
2. **Notificações de Pedido**:
   - Exibição de notificações para pedidos recebidos.
3. **Relatórios**:
   - Geração de relatórios detalhados de vendas.

---

Se tiver dúvidas ou problemas, não hesite em entrar em contato! 🚀
