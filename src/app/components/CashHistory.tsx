import { Calendar, DollarSign, TrendingUp, TrendingDown, Filter, Download } from 'lucide-react';
import { useState } from 'react';
import { exportToCSV, formatDateForExport } from '../utils/csvExport';

interface CashSession {
  id: string;
  openingAmount: number;
  closingAmount: number;
  totalSales: number;
  openingTime: string;
  closingTime: string;
}

interface CashHistoryProps {
  cashSessions: CashSession[];
}

export function CashHistory({ cashSessions }: CashHistoryProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtrar sessões por período
  const getFilteredSessions = () => {
    let filtered = [...cashSessions];

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(session => 
        new Date(session.closingTime) >= start
      );
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(session => 
        new Date(session.closingTime) <= end
      );
    }

    return filtered;
  };

  // Ordenar do mais recente para o mais antigo
  const filteredSessions = getFilteredSessions();
  const sortedSessions = filteredSessions.sort((a, b) => 
    new Date(b.closingTime).getTime() - new Date(a.closingTime).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (start: string, end: string) => {
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };

  const totalOpened = sortedSessions.reduce((sum, s) => sum + s.openingAmount, 0);
  const totalClosed = sortedSessions.reduce((sum, s) => sum + s.closingAmount, 0);
  const totalSales = sortedSessions.reduce((sum, s) => sum + s.totalSales, 0);

  const handleExportCashHistory = () => {
    const exportData = sortedSessions.map(session => {
      const difference = session.closingAmount - session.openingAmount;
      const isDifferent = Math.abs(difference - session.totalSales) > 0.01;
      
      return {
        data: formatDate(session.closingTime),
        abertura: formatTime(session.openingTime),
        fechamento: formatTime(session.closingTime),
        duracao: formatDuration(session.openingTime, session.closingTime),
        valorAbertura: `R$ ${session.openingAmount.toFixed(2)}`,
        vendas: `R$ ${session.totalSales.toFixed(2)}`,
        valorFechamento: `R$ ${session.closingAmount.toFixed(2)}`,
        esperado: `R$ ${(session.openingAmount + session.totalSales).toFixed(2)}`,
        status: isDifferent ? 'Com divergência' : 'Correto',
        divergencia: isDifferent ? `R$ ${Math.abs(difference - session.totalSales).toFixed(2)}` : '-'
      };
    });

    exportToCSV(exportData, 'historico-caixa', {
      data: 'Data',
      abertura: 'Abertura',
      fechamento: 'Fechamento',
      duracao: 'Duração',
      valorAbertura: 'Valor Abertura',
      vendas: 'Vendas',
      valorFechamento: 'Valor Fechamento',
      esperado: 'Esperado',
      status: 'Status',
      divergencia: 'Divergência'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Histórico de Caixa</h2>
        
        {/* Filtro de período */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div className="flex items-center gap-2">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="mt-5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">Total Aberturas</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">R$ {totalOpened.toFixed(2)}</p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{sortedSessions.length} sessões</p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-900 dark:text-green-200">Total Vendas</span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">R$ {totalSales.toFixed(2)}</p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-200">Total Fechamentos</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">R$ {totalClosed.toFixed(2)}</p>
        </div>
      </div>

      {/* Lista de Sessões */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold dark:text-white">Sessões de Caixa</h3>
        </div>
        
        {sortedSessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
            <p>Nenhuma sessão de caixa registrada.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedSessions.map((session) => {
              const difference = session.closingAmount - session.openingAmount;
              const isDifferent = Math.abs(difference - session.totalSales) > 0.01;

              return (
                <div key={session.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Data e Horários */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatDate(session.closingTime)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>
                          <span className="font-medium">Abertura:</span> {formatTime(session.openingTime)}
                        </p>
                        <p>
                          <span className="font-medium">Fechamento:</span> {formatTime(session.closingTime)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Duração: {formatDuration(session.openingTime, session.closingTime)}
                        </p>
                      </div>
                    </div>

                    {/* Valores */}
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Abertura</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          R$ {session.openingAmount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vendas</p>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          + R$ {session.totalSales.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Fechamento */}
                    <div className="flex-1 text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fechamento</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        R$ {session.closingAmount.toFixed(2)}
                      </p>
                      {isDifferent && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          ⚠️ Divergência: R$ {Math.abs(difference - session.totalSales).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Indicador de Status */}
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Esperado: R$ {(session.openingAmount + session.totalSales).toFixed(2)}
                      </span>
                      {isDifferent ? (
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          Fechamento com divergência
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          ✓ Fechamento correto
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Botão de exportação */}
      {sortedSessions.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleExportCashHistory}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      )}
    </div>
  );
}