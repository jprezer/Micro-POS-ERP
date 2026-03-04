import { useState } from 'react';
import { DollarSign, User, Calendar, CheckCircle, Download } from 'lucide-react';

interface Sale {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    cost: number;
  }>;
  total: number;
  discount: number;
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending';
  cancelledAt?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface AccountsReceivableProps {
  sales: Sale[];
  customers: Customer[];
  onMarkAsPaid: (saleId: string) => void;
}

export function AccountsReceivable({ sales, customers, onMarkAsPaid }: AccountsReceivableProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');

  // Filtrar vendas pendentes e não canceladas
  const pendingSales = sales.filter(
    sale => sale.paymentStatus === 'pending' && !sale.cancelledAt
  );

  // Filtrar por cliente selecionado
  const filteredSales = selectedCustomer === 'all'
    ? pendingSales
    : pendingSales.filter(sale => sale.customerId === selectedCustomer);

  // Calcular total a receber
  const totalReceivable = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

  // Agrupar por cliente
  const customerDebts = pendingSales.reduce((acc, sale) => {
    const existing = acc.find(item => item.customerId === sale.customerId);
    if (existing) {
      existing.total += sale.total;
      existing.salesCount += 1;
    } else {
      acc.push({
        customerId: sale.customerId,
        customerName: sale.customerName,
        total: sale.total,
        salesCount: 1
      });
    }
    return acc;
  }, [] as Array<{ customerId: string; customerName: string; total: number; salesCount: number }>);

  // Exportar CSV
  const exportToCSV = () => {
    const headers = ['Data', 'Cliente', 'Total', 'Método de Pagamento'];
    const rows = filteredSales.map(sale => [
      new Date(sale.date).toLocaleString('pt-BR'),
      sale.customerName,
      `R$ ${sale.total.toFixed(2)}`,
      sale.paymentMethod
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contas_receber_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Contas a Receber</h2>
          <p className="text-gray-600 dark:text-gray-400">Gerencie pagamentos pendentes</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Exportar CSV
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-orange-100">Total a Receber</span>
            <DollarSign className="w-8 h-8 text-orange-200" />
          </div>
          <p className="text-3xl font-bold">R$ {totalReceivable.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100">Vendas Pendentes</span>
            <Calendar className="w-8 h-8 text-blue-200" />
          </div>
          <p className="text-3xl font-bold">{filteredSales.length}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-100">Clientes com Débito</span>
            <User className="w-8 h-8 text-purple-200" />
          </div>
          <p className="text-3xl font-bold">{customerDebts.length}</p>
        </div>
      </div>

      {/* Filtro por cliente */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Filtrar por Cliente
        </label>
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos os Clientes</option>
          {customerDebts.map(debt => (
            <option key={debt.customerId} value={debt.customerId}>
              {debt.customerName} - R$ {debt.total.toFixed(2)} ({debt.salesCount} venda{debt.salesCount > 1 ? 's' : ''})
            </option>
          ))}
        </select>
      </div>

      {/* Lista de vendas pendentes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Produtos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma venda pendente encontrada
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {new Date(sale.date).toLocaleDateString('pt-BR')}
                      <br />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                          {sale.customerName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="text-xs">
                          {item.quantity}x {item.productName}
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                        R$ {sale.total.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onMarkAsPaid(sale.id)}
                        className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Marcar como Pago
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
