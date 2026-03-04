import { useState } from 'react';
import { Plus, Trash2, ShoppingCart, Search, X, Percent, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  barcode: string;
}

interface Customer {
  id: string;
  name: string;
}

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

interface SalesProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  onAddSale: (sale: Omit<Sale, 'id' | 'date'>) => void;
  onCancelSale: (saleId: string) => void;
  cashRegisterOpen: boolean;
  autoOpen?: boolean;
}

export function Sales({ sales, products, customers, onAddSale, onCancelSale, cashRegisterOpen, autoOpen }: SalesProps) {
  const [isAdding, setIsAdding] = useState(autoOpen || false);
  const [selectedCustomer, setSelectedCustomer] = useState('default'); // Padrão: CONSUMIDOR FINAL
  const [cartItems, setCartItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');

  // Garantir que temos arrays válidos
  const safeSales = sales || [];
  const safeProducts = products || [];
  const safeCustomers = customers || [];

  // Filtrar produtos pela busca (nome ou código de barras)
  const filteredProducts = safeProducts.filter(p => 
    p.stock > 0 && (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery)
    )
  );

  const handleAddToCart = (productId: string) => {
    const product = safeProducts.find(p => p.id === productId);
    if (!product) return;

    const existing = cartItems.find(item => item.productId === productId);
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty >= product.stock) {
      toast.error('Estoque insuficiente');
      return;
    }

    if (existing) {
      setCartItems(cartItems.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { productId, quantity: 1 }]);
    }
    toast.success('Adicionado ao carrinho', { duration: 1500 });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const product = safeProducts.find(p => p.id === productId);
    if (!product) return;

    if (quantity > product.stock) {
      toast.error('Quantidade maior que o estoque disponível');
      return;
    }

    if (quantity <= 0) {
      setCartItems(cartItems.filter(item => item.productId !== productId));
    } else {
      setCartItems(cartItems.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const calculateCartSubtotal = () => {
    return cartItems.reduce((sum, cartItem) => {
      const product = safeProducts.find(p => p.id === cartItem.productId);
      return sum + (product ? product.price * cartItem.quantity : 0);
    }, 0);
  };

  const calculateDiscount = (subtotal: number) => {
    if (discountType === 'percent') {
      return (subtotal * discount) / 100;
    }
    return discount;
  };

  const cartSubtotal = calculateCartSubtotal();
  const discountAmount = calculateDiscount(cartSubtotal);
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);

  const changeAmount = paymentMethod === 'Dinheiro' && cashAmount 
    ? parseFloat(cashAmount) - cartTotal 
    : 0;

  const handleSubmitSale = () => {
    if (!cashRegisterOpen && paymentMethod !== 'Pendente') {
      toast.error('Caixa fechado', { description: 'É necessário abrir o caixa antes de registrar vendas.' });
      return;
    }

    if (cartItems.length === 0) {
      toast.warning('Atenção', { description: 'Adicione produtos ao carrinho.' });
      return;
    }

    if (!paymentMethod) {
      toast.warning('Atenção', { description: 'Selecione o método de pagamento.' });
      return;
    }

    // Validar pagamento pendente
    if (paymentMethod === 'Pendente' && selectedCustomer === 'default') {
      toast.error('Erro', { description: 'Vendas pendentes só são permitidas para clientes cadastrados.' });
      return;
    }

    // Validar valor em dinheiro
    if (paymentMethod === 'Dinheiro') {
      const cashValue = parseFloat(cashAmount);
      if (!cashAmount || isNaN(cashValue)) {
        toast.warning('Atenção', { description: 'Informe o valor pago em dinheiro pelo cliente.' });
        return;
      }
      if (cashValue < cartTotal) {
        toast.error('Valor Insuficiente', { description: 'O valor pago é menor que o total da venda.' });
        return;
      }
    }

    const customer = safeCustomers.find(c => c.id === selectedCustomer);
    const items = cartItems.map(cartItem => {
      const product = safeProducts.find(p => p.id === cartItem.productId)!;
      return {
        productId: product.id,
        productName: product.name,
        quantity: cartItem.quantity,
        price: product.price,
        cost: product.cost
      };
    });

    onAddSale({
      customerId: customer?.id || 'default',
      customerName: customer?.name || 'CONSUMIDOR FINAL',
      items,
      total: cartTotal,
      discount: discountAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'Pendente' ? 'pending' : 'paid'
    });

    toast.success(paymentMethod === 'Pendente' ? 'Venda registrada como pendente!' : 'Venda finalizada com sucesso!');
    setCartItems([]);
    setSelectedCustomer('default');
    setIsAdding(false);
    setPaymentMethod('');
    setCashAmount('');
    setDiscount(0);
    setSearchQuery('');
  };

  const handleCancelSale = (saleId: string) => {
    if (window.confirm('Tem certeza que deseja cancelar esta venda? O estoque será devolvido.')) {
      onCancelSale(saleId);
      toast.success('Venda cancelada com sucesso!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Vendas - PDV</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {safeSales.filter(s => !s.cancelledAt).length} venda{safeSales.filter(s => !s.cancelledAt).length !== 1 ? 's' : ''} realizada{safeSales.filter(s => !s.cancelledAt).length !== 1 ? 's' : ''}
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              if(!cashRegisterOpen) {
                toast.error('Caixa fechado', { description: 'Abra o caixa no menu de Controle de Caixa primeiro.'});
                return;
              }
              setIsAdding(true);
            }}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          >
            <Plus className="w-5 h-5" />
            Nova Venda
          </button>
        )}
      </div>

      {/* Formulário de nova venda */}
      {isAdding && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seleção de produtos */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
            <h3 className="text-lg font-semibold dark:text-white">Selecionar Produtos</h3>
            
            {/* Seleção de cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cliente {paymentMethod === 'Pendente' && <span className="text-red-600">*</span>}
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {safeCustomers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
              {selectedCustomer === 'default' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Cliente padrão selecionado. Vendas pendentes requerem cliente cadastrado.
                </p>
              )}
            </div>

            {/* Barra de busca de produtos */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou código de barras..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            {/* Lista de produtos disponíveis */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
                </p>
              ) : (
                filteredProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        R$ {product.price.toFixed(2)} • Estoque: {product.stock}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        {product.barcode}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                    >
                      Adicionar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Carrinho */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 dark:text-white" />
              <h3 className="text-lg font-semibold dark:text-white">Carrinho</h3>
            </div>

            {cartItems.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Carrinho vazio</p>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cartItems.map(cartItem => {
                    const product = safeProducts.find(p => p.id === cartItem.productId)!;
                    const itemTotal = product.price * cartItem.quantity;
                    const itemProfit = (product.price - product.cost) * cartItem.quantity;
                    return (
                      <div key={cartItem.productId} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              R$ {product.price.toFixed(2)} cada
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Lucro: R$ {itemProfit.toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleUpdateQuantity(cartItem.productId, 0)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <input
                            type="number"
                            min="1"
                            max={product.stock}
                            value={cartItem.quantity}
                            onChange={(e) => handleUpdateQuantity(cartItem.productId, parseInt(e.target.value) || 1)}
                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-center"
                          />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            R$ {itemTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}</div>

                <div className="border-t dark:border-gray-700 pt-4 space-y-3">
                  {/* Desconto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Desconto
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="percent">%</option>
                        <option value="fixed">R$</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  {/* Método de pagamento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Método de Pagamento</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Selecione o método</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="PIX">PIX</option>
                      {selectedCustomer !== 'default' && (
                        <option value="Pendente">Pendente (A Prazo)</option>
                      )}
                    </select>
                  </div>

                  {paymentMethod === 'Dinheiro' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Pago (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}

                  {/* Totais */}
                  <div className="space-y-1 text-sm dark:text-gray-300">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>R$ {cartSubtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-red-600 dark:text-red-400">
                        <span>Desconto:</span>
                        <span>- R$ {discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-lg font-bold pt-2 dark:text-white">
                    <span>Total:</span>
                    <span>R$ {cartTotal.toFixed(2)}</span>
                  </div>

                  {paymentMethod === 'Dinheiro' && cashAmount && !isNaN(parseFloat(cashAmount)) && (
                    <div className={`flex justify-between text-xl font-bold p-3 rounded-lg ${
                      changeAmount >= 0 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      <span>Troco:</span>
                      <span>R$ {changeAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {paymentMethod === 'Pendente' && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Esta venda será registrada como pendente e aparecerá em "Contas a Receber"
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleSubmitSale}
                      className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                    >
                      {paymentMethod === 'Pendente' ? 'Registrar Pendente' : 'Finalizar Venda'}
                    </button>
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setCartItems([]);
                        setSelectedCustomer('default');
                        setPaymentMethod('');
                        setCashAmount('');
                        setDiscount(0);
                        setSearchQuery('');
                      }}
                      className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Histórico de vendas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold dark:text-white">Histórico de Vendas</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {safeSales.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Nenhuma venda registrada.
            </div>
          ) : (
            safeSales.slice().reverse().map((sale) => {
              const saleProfit = sale.items.reduce((sum, item) => sum + ((item.price - item.cost) * item.quantity), 0);
              return (
                <div key={sale.id} className={`p-6 ${sale.cancelledAt ? 'bg-red-50 dark:bg-red-900/10 opacity-60' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">{sale.customerName}</p>
                        {sale.cancelledAt && (
                          <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs px-2 py-1 rounded">
                            CANCELADA
                          </span>
                        )}
                        {sale.paymentStatus === 'pending' && !sale.cancelledAt && (
                          <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs px-2 py-1 rounded">
                            PENDENTE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(sale.date).toLocaleString('pt-BR')}
                      </p>
                      {sale.paymentMethod && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          💳 {sale.paymentMethod}
                        </p>
                      )}
                      {saleProfit > 0 && !sale.cancelledAt && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          💰 Lucro: R$ {saleProfit.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        R$ {sale.total.toFixed(2)}
                      </p>
                      {!sale.cancelledAt && sale.paymentStatus === 'paid' && (
                        <button
                          onClick={() => handleCancelSale(sale.id)}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Cancelar Venda
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {sale.items.map((item, idx) => (
                      <p key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                        • {item.quantity}x {item.productName} - R$ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    ))}
                    {sale.discount > 0 && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        • Desconto aplicado: R$ {sale.discount.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
