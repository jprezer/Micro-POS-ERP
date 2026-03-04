import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number; // NOVO: Custo do produto
  stock: number;
  category: string;
  barcode: string; // NOVO: Código de barras
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Sale {
  id: string;
  date: string;
  customerId: string; // Mudei de customerName para customerId
  customerName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    cost: number; // NOVO: Custo para calcular lucro
  }>;
  total: number;
  discount: number; // NOVO: Desconto aplicado
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending'; // NOVO: Status do pagamento
  cancelledAt?: string; // NOVO: Data de cancelamento
}

interface CashRegisterData {
  isOpen: boolean;
  openingAmount: number;
  openingTime: string | null;
  closingTime: string | null;
}

interface CashSession {
  id: string;
  openingAmount: number;
  closingAmount: number;
  totalSales: number;
  openingTime: string;
  closingTime: string;
}

interface User {
  email: string;
  name: string;
}

interface AppContextType {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  cashRegister: CashRegisterData;
  cashSessions: CashSession[];
  user: User | null;
  darkMode: boolean;
  handleAddProduct: (product: Omit<Product, 'id'>) => void;
  handleUpdateProduct: (id: string, product: Omit<Product, 'id'>) => void;
  handleDeleteProduct: (id: string) => void;
  handleAddCustomer: (customer: Omit<Customer, 'id'>) => void;
  handleUpdateCustomer: (id: string, customer: Omit<Customer, 'id'>) => void;
  handleDeleteCustomer: (id: string) => void;
  handleCompleteSale: (sale: Omit<Sale, 'id' | 'date'>) => void;
  handleCancelSale: (saleId: string) => void; // NOVO
  handleMarkSaleAsPaid: (saleId: string) => void; // NOVO
  handleOpenCashRegister: (amount: number) => void;
  handleCloseCashRegister: (amount: number) => void;
  handleLogin: (email: string, password: string) => boolean;
  handleLogout: () => void;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Cliente padrão "Consumidor Final"
const DEFAULT_CUSTOMER_ID = 'default';
const DEFAULT_CUSTOMER: Customer = {
  id: DEFAULT_CUSTOMER_ID,
  name: 'CONSUMIDOR FINAL',
  email: '',
  phone: '',
  address: ''
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Café Premium 500g', price: 29.90, cost: 18.00, stock: 45, category: 'Alimentos', barcode: '7891234567890' },
    { id: '2', name: 'Açúcar Cristal 1kg', price: 4.50, cost: 2.80, stock: 120, category: 'Alimentos', barcode: '7891234567891' },
    { id: '3', name: 'Arroz Integral 1kg', price: 8.90, cost: 5.50, stock: 85, category: 'Alimentos', barcode: '7891234567892' },
    { id: '4', name: 'Feijão Preto 1kg', price: 7.20, cost: 4.50, stock: 65, category: 'Alimentos', barcode: '7891234567893' },
    { id: '5', name: 'Macarrão Espaguete 500g', price: 5.40, cost: 3.20, stock: 8, category: 'Alimentos', barcode: '7891234567894' },
    { id: '6', name: 'Óleo de Soja 900ml', price: 6.80, cost: 4.00, stock: 95, category: 'Alimentos', barcode: '7891234567895' },
    { id: '7', name: 'Leite Integral 1L', price: 4.90, cost: 3.50, stock: 6, category: 'Laticínios', barcode: '7891234567896' },
    { id: '8', name: 'Sabonete Dove 90g', price: 3.50, cost: 2.00, stock: 150, category: 'Higiene', barcode: '7891234567897' },
  ]);

  const [customers, setCustomers] = useState<Customer[]>([
    DEFAULT_CUSTOMER, // Cliente padrão sempre presente
    { id: '1', name: 'João Silva', email: 'joao@email.com', phone: '(11) 98765-4321', address: 'Rua A, 123 - São Paulo' },
    { id: '2', name: 'Maria Santos', email: 'maria@email.com', phone: '(11) 97654-3210', address: 'Av. B, 456 - São Paulo' },
    { id: '3', name: 'Pedro Oliveira', email: 'pedro@email.com', phone: '(11) 96543-2109', address: 'Rua C, 789 - São Paulo' },
    { id: '4', name: 'Ana Costa', email: 'ana@email.com', phone: '(11) 95432-1098', address: 'Av. D, 321 - São Paulo' },
  ]);

  const [sales, setSales] = useState<Sale[]>([
    {
      id: '1',
      date: new Date(2026, 1, 3, 10, 30).toISOString(),
      customerId: '1',
      customerName: 'João Silva',
      items: [
        { productId: '1', productName: 'Café Premium 500g', quantity: 2, price: 29.90, cost: 18.00 },
        { productId: '2', productName: 'Açúcar Cristal 1kg', quantity: 3, price: 4.50, cost: 2.80 },
      ],
      total: 73.30,
      discount: 0,
      paymentMethod: 'Dinheiro',
      paymentStatus: 'paid'
    },
    {
      id: '2',
      date: new Date(2026, 1, 3, 14, 15).toISOString(),
      customerId: '2',
      customerName: 'Maria Santos',
      items: [
        { productId: '3', productName: 'Arroz Integral 1kg', quantity: 5, price: 8.90, cost: 5.50 },
        { productId: '4', productName: 'Feijão Preto 1kg', quantity: 3, price: 7.20, cost: 4.50 },
      ],
      total: 66.10,
      discount: 0,
      paymentMethod: 'Cartão',
      paymentStatus: 'paid'
    },
    {
      id: '3',
      date: new Date(2026, 1, 4, 9, 45).toISOString(),
      customerId: '3',
      customerName: 'Pedro Oliveira',
      items: [
        { productId: '8', productName: 'Sabonete Dove 90g', quantity: 10, price: 3.50, cost: 2.00 },
        { productId: '6', productName: 'Óleo de Soja 900ml', quantity: 2, price: 6.80, cost: 4.00 },
      ],
      total: 48.60,
      discount: 0,
      paymentMethod: 'Dinheiro',
      paymentStatus: 'paid'
    },
    {
      id: '4',
      date: new Date(2026, 1, 4, 16, 20).toISOString(),
      customerId: '4',
      customerName: 'Ana Costa',
      items: [
        { productId: '1', productName: 'Café Premium 500g', quantity: 1, price: 29.90, cost: 18.00 },
        { productId: '5', productName: 'Macarrão Espaguete 500g', quantity: 4, price: 5.40, cost: 3.20 },
        { productId: '7', productName: 'Leite Integral 1L', quantity: 6, price: 4.90, cost: 3.50 },
      ],
      total: 80.90,
      discount: 0,
      paymentMethod: 'Cartão',
      paymentStatus: 'paid'
    },
    {
      id: '5',
      date: new Date(2026, 1, 5, 11, 0).toISOString(),
      customerId: '1',
      customerName: 'João Silva',
      items: [
        { productId: '2', productName: 'Açúcar Cristal 1kg', quantity: 2, price: 4.50, cost: 2.80 },
        { productId: '3', productName: 'Arroz Integral 1kg', quantity: 3, price: 8.90, cost: 5.50 },
      ],
      total: 35.70,
      discount: 0,
      paymentMethod: 'Pendente',
      paymentStatus: 'pending' // Venda pendente
    },
  ]);

  const [cashRegister, setCashRegister] = useState<CashRegisterData>({
    isOpen: false,
    openingAmount: 0,
    openingTime: null,
    closingTime: null
  });

  const [cashSessions, setCashSessions] = useState<CashSession[]>([
    {
      id: '1',
      openingAmount: 100.00,
      closingAmount: 368.90,
      totalSales: 268.90,
      openingTime: new Date(2026, 1, 3, 8, 0).toISOString(),
      closingTime: new Date(2026, 1, 3, 18, 0).toISOString()
    },
    {
      id: '2',
      openingAmount: 100.00,
      closingAmount: 229.50,
      totalSales: 129.50,
      openingTime: new Date(2026, 1, 4, 8, 0).toISOString(),
      closingTime: new Date(2026, 1, 4, 18, 0).toISOString()
    },
    {
      id: '3',
      openingAmount: 100.00,
      closingAmount: 135.70,
      totalSales: 35.70,
      openingTime: new Date(2026, 1, 5, 8, 0).toISOString(),
      closingTime: new Date(2026, 1, 5, 18, 0).toISOString()
    }
  ]);

  // Estado de autenticação
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('erp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Estado de modo escuro
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('erp_darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Salvar darkMode no localStorage
  useEffect(() => {
    localStorage.setItem('erp_darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Funções de gerenciamento de produtos
  const handleAddProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Date.now().toString() };
    setProducts([...products, newProduct]);
  };

  const handleUpdateProduct = (id: string, product: Omit<Product, 'id'>) => {
    setProducts(products.map(p => p.id === id ? { ...product, id } : p));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  // Funções de gerenciamento de clientes
  const handleAddCustomer = (customer: Omit<Customer, 'id'>) => {
    const newCustomer = { ...customer, id: Date.now().toString() };
    setCustomers([...customers, newCustomer]);
  };

  const handleUpdateCustomer = (id: string, customer: Omit<Customer, 'id'>) => {
    // Não permitir editar o cliente padrão
    if (id === DEFAULT_CUSTOMER_ID) return;
    setCustomers(customers.map(c => c.id === id ? { ...customer, id } : c));
  };

  const handleDeleteCustomer = (id: string) => {
    // Não permitir deletar o cliente padrão
    if (id === DEFAULT_CUSTOMER_ID) return;
    setCustomers(customers.filter(c => c.id !== id));
  };

  // Função de completar venda
  const handleCompleteSale = (saleData: Omit<Sale, 'id' | 'date'>) => {
    const newSale: Sale = {
      ...saleData,
      id: Date.now().toString(),
      date: new Date().toISOString()
    };
    
    setSales([...sales, newSale]);
    
    // Atualizar estoque apenas se pagamento não for pendente ou for pago
    if (saleData.paymentStatus === 'paid') {
      saleData.items.forEach(item => {
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p.id === item.productId
              ? { ...p, stock: p.stock - item.quantity }
              : p
          )
        );
      });
    } else {
      // Para vendas pendentes, também diminui o estoque
      saleData.items.forEach(item => {
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p.id === item.productId
              ? { ...p, stock: p.stock - item.quantity }
              : p
          )
        );
      });
    }
  };

  // NOVO: Função para cancelar venda
  const handleCancelSale = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale || sale.cancelledAt) return;

    // Devolver produtos ao estoque
    sale.items.forEach(item => {
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === item.productId
            ? { ...p, stock: p.stock + item.quantity }
            : p
        )
      );
    });

    // Marcar venda como cancelada
    setSales(sales.map(s =>
      s.id === saleId
        ? { ...s, cancelledAt: new Date().toISOString() }
        : s
    ));
  };

  // NOVO: Função para marcar venda como paga
  const handleMarkSaleAsPaid = (saleId: string) => {
    setSales(sales.map(s =>
      s.id === saleId
        ? { ...s, paymentStatus: 'paid' as const, paymentMethod: s.paymentMethod === 'Pendente' ? 'Dinheiro' : s.paymentMethod }
        : s
    ));
  };

  // Funções de caixa
  const handleOpenCashRegister = (amount: number) => {
    setCashRegister({
      isOpen: true,
      openingAmount: amount,
      openingTime: new Date().toISOString(),
      closingTime: null
    });
  };

  const handleCloseCashRegister = (amount: number) => {
    if (!cashRegister.openingTime) return;

    const closingTime = new Date().toISOString();
    
    // Calcular vendas do período (apenas vendas pagas e não canceladas)
    const salesInPeriod = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const openDate = new Date(cashRegister.openingTime!);
      return saleDate >= openDate && sale.paymentStatus === 'paid' && !sale.cancelledAt;
    });
    
    const totalSales = salesInPeriod.reduce((sum, sale) => sum + sale.total, 0);

    // Criar nova sessão
    const newSession: CashSession = {
      id: Date.now().toString(),
      openingAmount: cashRegister.openingAmount,
      closingAmount: amount,
      totalSales,
      openingTime: cashRegister.openingTime,
      closingTime
    };

    setCashSessions([...cashSessions, newSession]);
    setCashRegister({
      isOpen: false,
      openingAmount: 0,
      openingTime: null,
      closingTime
    });
  };

  // Funções de autenticação
  const handleLogin = (email: string, password: string): boolean => {
    // Login simples - aceita qualquer email/senha para demonstração
    if (email && password) {
      const newUser = {
        email,
        name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)
      };
      setUser(newUser);
      localStorage.setItem('erp_user', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('erp_user');
  };

  // Função de toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <AppContext.Provider
      value={{
        products,
        customers,
        sales,
        cashRegister,
        cashSessions,
        user,
        darkMode,
        handleAddProduct,
        handleUpdateProduct,
        handleDeleteProduct,
        handleAddCustomer,
        handleUpdateCustomer,
        handleDeleteCustomer,
        handleCompleteSale,
        handleCancelSale,
        handleMarkSaleAsPaid,
        handleOpenCashRegister,
        handleCloseCashRegister,
        handleLogin,
        handleLogout,
        toggleDarkMode
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
