import { NavLink, useNavigate } from 'react-router';
import { LayoutDashboard, Package, ShoppingCart, Users, Wallet, History, Store, Plus, DollarSign, Moon, Sun, LogOut, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Sidebar() {
  const { user, darkMode, toggleDarkMode, handleLogout, sales, products } = useApp();
  const navigate = useNavigate();

  // Calcular notificações
  const pendingSalesCount = sales.filter(s => s.paymentStatus === 'pending' && !s.cancelledAt).length;
  const lowStockCount = products.filter(p => p.stock < 10).length;
  const totalNotifications = pendingSalesCount + lowStockCount;

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { path: '/produtos', label: 'Produtos', icon: Package, end: false, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { path: '/vendas', label: 'Vendas', icon: ShoppingCart, end: false },
    { path: '/clientes', label: 'Clientes', icon: Users, end: false },
    { path: '/contas-receber', label: 'Contas a Receber', icon: DollarSign, end: false, badge: pendingSalesCount > 0 ? pendingSalesCount : undefined },
    { path: '/caixa', label: 'Controle de Caixa', icon: Wallet, end: true },
    { path: '/caixa/historico', label: 'Histórico de Caixa', icon: History, end: false },
  ];

  const handleLogoutClick = () => {
    handleLogout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 dark:from-gray-900 dark:to-gray-800 text-white min-h-screen fixed left-0 top-0 shadow-xl z-40">
      {/* Logo/Header */}
      <div className="p-6 border-b border-blue-500 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Store className="w-8 h-8" />
          <div className="flex-1">
            <h1 className="font-bold text-xl">ERP Comércio</h1>
            <p className="text-xs text-blue-200 dark:text-gray-400">Sistema de Gestão</p>
          </div>
          {totalNotifications > 0 && (
            <div className="relative">
              <Bell className="w-5 h-5 text-yellow-300" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {totalNotifications}
              </span>
            </div>
          )}
        </div>
        {user && (
          <div className="mt-3 pt-3 border-t border-blue-500 dark:border-gray-700">
            <p className="text-sm text-blue-100 dark:text-gray-300 truncate">
              👤 {user.name}
            </p>
            <p className="text-xs text-blue-200 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        )}
      </div>

      {/* Botão Nova Venda em Destaque */}
      <div className="p-4">
        <NavLink
          to="/vendas?action=new"
          className="flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-all shadow-lg font-semibold"
        >
          <Plus className="w-5 h-5" />
          Nova Venda
        </NavLink>
      </div>

      {/* Menu Items */}
      <nav className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative ${
                  isActive
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-md'
                    : 'text-blue-100 dark:text-gray-300 hover:bg-blue-700 dark:hover:bg-gray-700'
                }`
              }
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-white' : 'text-blue-200 dark:text-gray-400'}`} />
                  <span className="font-medium flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer com controles */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-500 dark:border-gray-700 space-y-3">
        {/* Toggle Dark Mode */}
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-center gap-2 bg-blue-700 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 dark:hover:bg-gray-600 transition-colors"
        >
          {darkMode ? (
            <>
              <Sun className="w-4 h-4" />
              <span className="text-sm">Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" />
              <span className="text-sm">Modo Escuro</span>
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center justify-center gap-2 bg-red-500 dark:bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sair</span>
        </button>

        <p className="text-xs text-blue-200 dark:text-gray-400 text-center">
          © 2026 ERP Comércio
        </p>
      </div>
    </aside>
  );
}