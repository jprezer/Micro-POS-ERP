export function exportToCSV(data: any[], filename: string, headers: { [key: string]: string }) {
  if (data.length === 0) {
    alert('Não há dados para exportar');
    return;
  }

  // Criar cabeçalhos
  const headerKeys = Object.keys(headers);
  const headerLabels = Object.values(headers);
  
  // Criar linhas de dados
  const rows = data.map(item => {
    return headerKeys.map(key => {
      let value = item[key];
      
      // Formatar valores especiais
      if (value === null || value === undefined) {
        return '';
      }
      
      // Se for array (como items em vendas), converter para string
      if (Array.isArray(value)) {
        value = JSON.stringify(value);
      }
      
      // Escapar aspas e envolver em aspas se necessário
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  });

  // Combinar cabeçalhos e dados
  const csv = [headerLabels.join(','), ...rows].join('\n');

  // Criar e baixar arquivo
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatDateForExport(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
