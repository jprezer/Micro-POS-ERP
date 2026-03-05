import { createBrowserRouter, Navigate } from 'react-router'
import { Layout } from './layouts/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { ProductsPage } from './pages/ProductsPage'
import { SalesPage } from './pages/SalesPage'
import { CustomersPage } from './pages/CustomersPage'
import { CashRegisterPage } from './pages/CashRegisterPage'
import { CashHistoryPage } from './pages/CashHistoryPage'
import { LoginPage } from './pages/LoginPage'
import { AccountsReceivablePage } from './pages/AccountsReceivablePage'
import { useApp } from './context/AppContext'

// Componente para proteger rotas — usa o user do AppContext (Supabase auth)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useApp()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: DashboardPage },
      { path: 'produtos', Component: ProductsPage },
      { path: 'vendas', Component: SalesPage },
      { path: 'clientes', Component: CustomersPage },
      { path: 'caixa', Component: CashRegisterPage },
      { path: 'caixa/historico', Component: CashHistoryPage },
      { path: 'contas-receber', Component: AccountsReceivablePage },
    ],
  },
])
