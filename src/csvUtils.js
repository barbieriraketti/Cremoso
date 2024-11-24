const generateCSV = (orderDetails, totalPrice, user) => {
  const csvSeparator = ';'; // Use ';' para compatibilidade com Excel em português
  const csvHeader = ['Item', 'Categoria', 'Quantidade', 'Preço Unitário', 'Preço Total'];

  // Mapeia os dados para formato CSV
  const csvRows = orderDetails.map((detail) =>
    [
      `"${detail.item}"`,
      `"${detail.category}"`,
      `"${detail.qty}"`,
      `"R$${detail.pricePerUnit.toFixed(2).replace('.', ',')}"`,
      `"R$${detail.totalPrice.toFixed(2).replace('.', ',')}"`,
    ].join(csvSeparator)
  );

  // Adiciona a linha do total ao CSV
  csvRows.push(
    ['', '', '', '', ''], // Linha em branco
    [`"Total"`, '', '', '', `"R$${totalPrice.toFixed(2).replace('.', ',')}"`]
  );

  // Adiciona o cabeçalho e as linhas ao conteúdo CSV
  const csvContent = [
    csvHeader.map((header) => `"${header}"`).join(csvSeparator), // Cabeçalho
    ...csvRows, // Linhas de dados
  ].join('\n');

  // Adiciona BOM para compatibilidade com Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Cria o nome do arquivo com a data e usuário
  const currentDate = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  const filename = `pedido_${user || 'usuario'}_${currentDate}.csv`;

  // Cria e aciona o link para download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
