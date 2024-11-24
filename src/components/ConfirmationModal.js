import React from 'react';

const ConfirmationModal = ({ orderDetails, totalPrice, confirmOrder, closeModal }) => (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Confirmação do Pedido</h2>
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
      <h3>Total: R${totalPrice}</h3>
      <button onClick={confirmOrder}>Confirmar Pedido</button>
      <button onClick={closeModal}>Cancelar</button>
    </div>
  </div>
);

export default ConfirmationModal;
