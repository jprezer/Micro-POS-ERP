import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useSupabaseData } from '../hooks/useSupabaseData'
import type { Product, Customer, Sale, CashRegisterData, CashSession } from '../hooks/useSupabaseData'

// Re-exportar tipos para que os componentes existentes continuem funcionando
export type { Product, Customer, Sale, CashRegisterData, CashSession }

interface User {
  email: string
  name: string
}

interface AppContextType {
  products: Product[]
  customers: Customer[]
  sales: Sale[]
  cashRegister: CashRegisterData
  cashSessions: CashSession[]
  user: User | null
  darkMode: boolean
  loading: boolean
  // produtos
  handleAddProduct: (product: Omit<Product, 'id'>) => void
  handleUpdateProduct: (id: string, product: Omit<Product, 'id'>) => void
  handleDeleteProduct: (id: string) => void
  // clientes
  handleAddCustomer: (customer: Omit<Customer, 'id'>) => void
  handleUpdateCustomer: (id: string, customer: Omit<Customer, 'id'>) => void
  handleDeleteCustomer: (id: string) => void
  // vendas
  handleCompleteSale: (sale: Omit<Sale, 'id' | 'date'>) => void
  handleCancelSale: (saleId: string) => void
  handleMarkSaleAsPaid: (saleId: string) => void
  // caixa
  handleOpenCashRegister: (amount: number) => void
  handleCloseCashRegister: (amount: number) => void
  // auth
  handleLogin: (email: string, password: string) => Promise<boolean>
  handleLogout: () => void
  // ui
  toggleDarkMode: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  // ─── Auth ──────────────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          email: session.user.email ?? '',
          name: session.user.email?.split('@')[0] ?? 'Usuário',
        })
      }
      setAuthChecked(true)
    })

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email ?? '',
          name: session.user.email?.split('@')[0] ?? 'Usuário',
        })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ─── Dark mode ─────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('erp_darkMode')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('erp_darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // ─── Dados do Supabase ─────────────────────────────────────────────────────
  const db = useSupabaseData()

  // ─── Handlers com toast de erro ────────────────────────────────────────────
  const wrap = (fn: (...args: any[]) => Promise<void>) => (...args: any[]) => {
    fn(...args).catch((err: Error) => {
      console.error(err)
      // O toast de erro será exibido pelo componente que chamou a função
      // caso queira centralizar, importe toast aqui do 'sonner'
    })
  }

  // ─── Auth handlers ─────────────────────────────────────────────────────────
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      // Fallback para demo: tenta criar conta se não existir
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError || !signUpData.user) return false

      // Criar registro na tabela users + tenant se for primeiro acesso
      await bootstrapNewUser(signUpData.user.id, email)
      return true
    }

    return true
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // ─── Bootstrap para novos usuários (cria tenant + user) ───────────────────
  const bootstrapNewUser = async (authUserId: string, email: string) => {
    // Cria tenant
    const { data: tenant, error: tenantErr } = await supabase
      .from('tenants')
      .insert({
        name: email.split('@')[0] + ' Store',
        slug: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Date.now(),
      })
      .select()
      .single()

    if (tenantErr) {
      console.error('Erro ao criar tenant:', tenantErr)
      return
    }

    // Cria user vinculado ao tenant
    await supabase.from('users').insert({
      id: authUserId,
      tenant_id: tenant.id,
      name: email.split('@')[0],
      role: 'owner',
    })
  }

  // ─── Context value ─────────────────────────────────────────────────────────
  if (!authChecked) return null // Aguarda verificação de sessão

  return (
    <AppContext.Provider
      value={{
        products: db.products,
        customers: db.customers,
        sales: db.sales,
        cashRegister: db.cashRegister,
        cashSessions: db.cashSessions,
        user,
        darkMode,
        loading: db.loading,
        handleAddProduct: wrap(db.addProduct),
        handleUpdateProduct: wrap(db.updateProduct),
        handleDeleteProduct: wrap(db.deleteProduct),
        handleAddCustomer: wrap(db.addCustomer),
        handleUpdateCustomer: wrap(db.updateCustomer),
        handleDeleteCustomer: wrap(db.deleteCustomer),
        handleCompleteSale: wrap(db.completeSale),
        handleCancelSale: wrap(db.cancelSale),
        handleMarkSaleAsPaid: wrap(db.markSaleAsPaid),
        handleOpenCashRegister: wrap(db.openCashRegister),
        handleCloseCashRegister: wrap(db.closeCashRegister),
        handleLogin,
        handleLogout,
        toggleDarkMode: () => setDarkMode((prev: boolean) => !prev),
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
