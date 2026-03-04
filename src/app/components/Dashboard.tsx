import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Package, ShoppingCart, Users, Calendar, Download, TrendingUp, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { exportToCSV, formatDateForExport } from '../utils/csvExport';

interface DashboardProps {
  salesData: any[];
  products: any[];
  customers: any[];
  cashRegister: {
    isOpen: boolean;
    openingAmount: number;
    openingTime: string | null;
  };
}

type PeriodFilter = '7' | '30' | '90' | '365' | 'all';

export function Dashboard({ salesData, products, customers, cashRegister }: DashboardProps) {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('30');

  // Garantir que temos arrays válidos
  const safeSales = salesData || [];
  const safeProducts = products || [];
  const safeCustomers = customers || [];

  // Filtrar vendas por período (apenas vendas pagas e não canceladas)
  const getFilteredSales = () => {
    const validSales = safeSales.filter((sale: any) => sale.paymentStatus === 'paid' && !sale.cancelledAt);
    
    if (periodFilter === 'all') return validSales;
    
    const daysAgo = parseInt(periodFilter);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    return validSales.filter((sale: any) => new Date(sale.date) >= cutoffDate);
  };

  const filteredSales = getFilteredSales();

  // Calcular métricas
  const totalRevenue = filteredSales.reduce((sum: number, sale: any) => sum + sale.total, 0);
  const totalCost = filteredSales.reduce((sum: number, sale: any) => {
    return sum + sale.items.reduce((itemSum: number, item: any) => itemSum + (item.cost * item.quantity), 0);
  }, 0);
  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;
  
  const totalSales = filteredSales.length;
  const totalProducts = safeProducts.length;
  const totalCustomers = safeCustomers.filter((c: any) => c.id !== 'default').length;
  const lowStockProducts = safeProducts.filter((p: any) => p.stock < 10).length;
  
  // Contas a receber
  const pendingSales = safeSales.filter((s: any) => s.paymentStatus === 'pending' && !s.cancelledAt);
  const totalReceivable = pendingSales.reduce((sum: number, sale: any) => sum + sale.total, 0);

  // Dados para gráfico de vendas por dia
  const salesByDay = filteredSales.reduce((acc: any, sale: any) => {
    const date = new Date(sale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const existing = acc.find((item: any) => item.date === date);
    const saleProfit = sale.items.reduce((sum: number, item: any) => sum + ((item.price - item.cost) * item.quantity), 0);
    
    if (existing) {
      existing.receita += sale.total;
      existing.lucro += saleProfit;
    } else {
      acc.push({ date, receita: sale.total, lucro: saleProfit });
    }
    return acc;
  }, []);

  // Produtos mais vendidos
  const productSales = filteredSales.reduce((acc: any, sale: any) => {
    sale.items.forEach((item: any) => {
      if (acc[item.productName]) {
        acc[item.productName] += item.quantity;
      } else {
        acc[item.productName] = item.quantity;
      }
    });
    return acc;
  }, {});

  const topProducts = Object.entries(productSales)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, 5);

  // Dados para gráfico de métodos de pagamento
  const paymentMethods = filteredSales.reduce((acc: any, sale: any) => {
    const method = sale.paymentMethod;
    if (acc[method]) {
      acc[method] += sale.total;
    } else {
      acc[method] = sale.total;
    }
    return acc;
  }, {});

  const paymentChartData = Object.entries(paymentMethods).map(([name, value]) => ({ name, value }));
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const handleExportSales = () => {
    const exportData = filteredSales.map((sale: any) => {
      const saleProfit = sale.items.reduce((sum: number, item: any) => sum + ((item.price - item.cost) * item.quantity), 0);
      return {
        data: formatDateForExport(sale.date),
        cliente: sale.customerName,
        metodoPagamento: sale.paymentMethod,
        total: `R$ ${sale.total.toFixed(2)}`,
        lucro: `R$ ${saleProfit.toFixed(2)}`,
        itens: sale.items.map((item: any) => 
          `${item.productName} (${item.quantity}x)`
        ).join('; ')
      };
    });

    exportToCSV(exportData, 'relatorio-vendas', {
      data: 'Data',
      cliente: 'Cliente',
      metodoPagamento: 'Método de Pagamento',
      total: 'Total',
      lucro: 'Lucro',
      itens: 'Itens'
    });
  };

  return (
    <div className="space-y-6">
      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<DollarSign className="w-6 h-6" />}
          title="Receita Total"
          value={`R$ ${totalRevenue.toFixed(2)}`}
          bgColor="bg-green-500"
        />
        <MetricCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Lucro Líquido"
          value={`R$ ${totalProfit.toFixed(2)}`}
          subtitle={`Margem: ${profitMargin.toFixed(1)}%`}
          bgColor="bg-emerald-600"
        />
        <MetricCard
          icon={<ShoppingCart className="w-6 h-6" />}
          title="Total de Vendas"
          value={totalSales.toString()}
          bgColor="bg-blue-500"
        />
        <MetricCard
          icon={<Package className="w-6 h-6" />}
          title="Produtos"
          value={totalProducts.toString()}
          subtitle={lowStockProducts > 0 ? `${lowStockProducts} com estoque baixo` : 'Estoque OK'}
          bgColor="bg-purple-500"
        />
      </div>

      {/* Cards secundários */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon={<Users className="w-6 h-6" />}
          title="Clientes"
          value={totalCustomers.toString()}
          bgColor="bg-orange-500"
        />
        <MetricCard
          icon={<AlertCircle className="w-6 h-6" />}
          title="Contas a Receber"
          value={`R$ ${totalReceivable.toFixed(2)}`}
          subtitle={`${pendingSales.length} venda${pendingSales.length !== 1 ? 's' : ''} pendente${pendingSales.length !== 1 ? 's' : ''}`}
          bgColor="bg-yellow-500"
        />
        <MetricCard
          icon={<Calendar className="w-6 h-6" />}
          title="Status do Caixa"
          value={cashRegister.isOpen ? "ABERTO" : "FECHADO"}
          subtitle={cashRegister.isOpen ? `Desde ${new Date(cashRegister.openingTime!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : undefined}
          bgColor={cashRegister.isOpen ? "bg-green-600" : "bg-red-600"}
        />
      </div>

      {/* Filtros de período */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Filtrar por período:</p>
          <div className="flex space-x-2">
            <PeriodButton
              period="7"
              active={periodFilter === '7'}
              onClick={() => setPeriodFilter('7')}
            />
            <PeriodButton
              period="30"
              active={periodFilter === '30'}
              onClick={() => setPeriodFilter('30')}
            />
            <PeriodButton
              period="90"
              active={periodFilter === '90'}
              onClick={() => setPeriodFilter('90')}
            />
            <PeriodButton
              period="365"
              active={periodFilter === '365'}
              onClick={() => setPeriodFilter('365')}
            />
            <PeriodButton
              period="all"
              active={periodFilter === 'all'}
              onClick={() => setPeriodFilter('all')}
            />
          </div>
        </div>
        <button
          onClick={handleExportSales}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar Vendas CSV
        </button>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas e Lucro ao longo do tempo */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Receita vs Lucro ao Longo do Tempo</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesByDay}>
              <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                formatter={(value: any) => `R$ ${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              />
              <Line type="monotone" dataKey="receita" stroke="#3b82f6" strokeWidth={2} name="Receita" />
              <Line type="monotone" dataKey="lucro" stroke="#10b981" strokeWidth={2} name="Lucro" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Produtos mais vendidos */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Produtos Mais Vendidos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
              <Bar dataKey="quantity" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Métodos de pagamento */}
        {paymentChartData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Distribuição por Método de Pagamento</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: { name: string; value: number }) => `${entry.name}: R$ ${entry.value.toFixed(2)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `R$ ${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Resumo de lucro */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-lg shadow text-white">
          <h3 className="text-lg font-semibold mb-4">💰 Análise de Lucratividade</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="opacity-90">Receita Total:</span>
              <span className="font-bold">R$ {totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-90">Custo Total:</span>
              <span className="font-bold">R$ {totalCost.toFixed(2)}</span>
            </div>
            <div className="border-t border-white/30 pt-3 flex justify-between text-xl">
              <span className="font-semibold">Lucro Líquido:</span>
              <span className="font-bold">R$ {totalProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between bg-white/20 rounded-lg p-3">
              <span>Margem de Lucro:</span>
              <span className="font-bold text-2xl">{profitMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {lowStockProducts > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Alerta de Estoque</h4>
          <p className="text-yellow-700 dark:text-yellow-300">
            {lowStockProducts} produto(s) com estoque abaixo de 10 unidades. Considere fazer reposição.
          </p>
        </div>
      )}

      {pendingSales.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">📋 Contas a Receber</h4>
          <p className="text-orange-700 dark:text-orange-300">
            Você tem {pendingSales.length} venda{pendingSales.length !== 1 ? 's' : ''} pendente{pendingSales.length !== 1 ? 's' : ''} no valor total de R$ {totalReceivable.toFixed(2)}. 
            <a href="/contas-receber" className="underline ml-1 font-medium">Ver detalhes</a>
          </p>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, title, value, subtitle, bgColor }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`${bgColor} text-white p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function PeriodButton({ period, active, onClick }: { period: PeriodFilter, active: boolean, onClick: () => void }) {
  return (
    <button
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        active 
          ? 'bg-blue-500 text-white shadow-md' 
          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
      }`}
      onClick={onClick}
    >
      {period === 'all' ? 'Todos' : `${period} dias`}
    </button>
  );
}
