import { useState } from 'react';
import { DollarSign, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

interface CashRegisterData {
  isOpen: boolean;
  openingAmount: number;
  openingTime: string | null;
  closingTime: string | null;
}

interface Sale {
  id: string;
  date: string;
  total: number;
}

interface CashRegisterDisplayProps {
  cashRegister: CashRegisterData;
  onOpen: (openingAmount: number) => void;
  onClose: (closingAmount: number) => void;
  sales: Sale[];
}

export function CashRegisterDisplay({ cashRegister, onOpen, onClose, sales }: CashRegisterDisplayProps) {
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Calcular vendas desde a abertura do caixa
  const todaySales = cashRegister.isOpen && cashRegister.openingTime
    ? sales
        .filter(sale => {
          const saleDate = new Date(sale.date);
          const openDate = new Date(cashRegister.openingTime!);
          return saleDate >= openDate;
        })
        .reduce((sum, sale) => sum + sale.total, 0)
    : 0;

  const handleOpen = () => {
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Valor inválido', { description: 'Por favor, insira um valor válido de abertura.' });
      return;
    }
    onOpen(amount);
    toast.success('Caixa aberto com sucesso!', { description: `Valor inicial: R$ ${amount.toFixed(2)}` });
    setOpeningAmount('');
    setShowOpenForm(false);
  };

  const handleClose = () => {
    const amount = parseFloat(closingAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Valor inválido', { description: 'Por favor, insira o valor de fechamento.' });
      return;
    }
    onClose(amount);
    toast.success('Caixa fechado com sucesso!', { description: 'O resumo foi enviado para o Histórico de Caixa.' });
    setClosingAmount('');
    setShowCloseConfirm(false);
  };

  const expectedTotal = cashRegister.openingAmount + todaySales;

  if (!cashRegister.isOpen && !showOpenForm) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Caixa Fechado</h3>
              <p className="text-sm text-red-700">É necessário abrir o caixa para registrar vendas</p>
            </div>
          </div>
          <button
            onClick={() => setShowOpenForm(true)}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium"
          >
            Abrir Caixa
          </button>
        </div>
      </div>
    );
  }

  if (showOpenForm) {
    return (
      <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Abertura de Caixa</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor inicial em caixa (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleOpen}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Confirmar Abertura
            </button>
            <button
              onClick={() => {
                setShowOpenForm(false);
                setOpeningAmount('');
              }}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showCloseConfirm) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">Fechamento de Caixa</h3>
        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Valor de Abertura:</span>
            <span className="font-medium">R$ {cashRegister.openingAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Vendas do Período:</span>
            <span className="font-medium text-green-600">+ R$ {todaySales.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="font-semibold text-gray-900">Total Esperado:</span>
            <span className="font-bold text-lg">R$ {expectedTotal.toFixed(2)}</span>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor real em caixa (R$) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={closingAmount}
            onChange={(e) => setClosingAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            autoFocus
          />
        </div>
        {closingAmount && parseFloat(closingAmount) !== expectedTotal && (
          <div className="bg-red-100 border border-red-300 rounded p-3 mb-4">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ Divergência de R$ {Math.abs(parseFloat(closingAmount) - expectedTotal).toFixed(2)}
              {parseFloat(closingAmount) > expectedTotal ? ' (Sobra)' : ' (Falta)'}
            </p>
          </div>
        )}
        <p className="text-sm text-yellow-800 mb-4">
          ⚠️ Confirme o valor real em caixa antes de fechar.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Confirmar Fechamento
          </button>
          <button
            onClick={() => {
              setShowCloseConfirm(false);
              setClosingAmount('');
            }}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Unlock className="w-8 h-8 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-green-900">Caixa Aberto</h3>
            <p className="text-sm text-green-700">
              Aberto às {cashRegister.openingTime ? new Date(cashRegister.openingTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-600">Valor Inicial</p>
            <p className="text-xl font-bold text-gray-900">R$ {cashRegister.openingAmount.toFixed(2)}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-600">Vendas no Período</p>
            <p className="text-xl font-bold text-green-600">R$ {todaySales.toFixed(2)}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-600">Total Esperado</p>
            <p className="text-2xl font-bold text-gray-900">R$ {expectedTotal.toFixed(2)}</p>
          </div>
          <button
            onClick={() => setShowCloseConfirm(true)}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-medium whitespace-nowrap"
          >
            Fechar Caixa
          </button>
        </div>
      </div>
    </div>
  );
}