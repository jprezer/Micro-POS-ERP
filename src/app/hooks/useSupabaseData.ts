/**
 * useSupabaseData
 * 
 * Hook que carrega todos os dados do tenant autenticado a partir do Supabase.
 * Retorna os dados no mesmo formato que o AppContext espera,
 * facilitando a transição do mock para o backend real.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type {
  DbProduct,
  DbCustomer,
  DbSale,
  DbSaleItem,
  DbCashRegister,
} from '../../lib/supabase'

// ─── Tipos do AppContext (formato frontend) ───────────────────────────────────

export interface Product {
  id: string
  name: string
  price: number
  cost: number
  stock: number
  category: string
  barcode: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  price: number
  cost: number
}

export interface Sale {
  id: string
  date: string
  customerId: string
  customerName: string
  items: SaleItem[]
  total: number
  discount: number
  paymentMethod: string
  paymentStatus: 'paid' | 'pending'
  cancelledAt?: string
}

export interface CashRegisterData {
  isOpen: boolean
  openingAmount: number
  openingTime: string | null
  closingTime: string | null
  sessionId?: string // id da sessão aberta no banco
}

export interface CashSession {
  id: string
  openingAmount: number
  closingAmount: number
  totalSales: number
  openingTime: string
  closingTime: string
}

// ─── Helpers de conversão banco → frontend ────────────────────────────────────

function dbProductToFrontend(p: DbProduct): Product {
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price),
    cost: Number(p.cost),
    stock: p.stock,
    category: p.category ?? '',
    barcode: p.sku ?? '',
  }
}

function dbCustomerToFrontend(c: DbCustomer): Customer {
  return {
    id: c.id,
    name: c.name,
    email: '',          // campo não existe no DB ainda — placeholder
    phone: c.phone ?? '',
    address: '',        // campo não existe no DB ainda — placeholder
  }
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useSupabaseData() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [cashRegister, setCashRegister] = useState<CashRegisterData>({
    isOpen: false,
    openingAmount: 0,
    openingTime: null,
    closingTime: null,
  })
  const [cashSessions, setCashSessions] = useState<CashSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 1. Descobrir tenant_id do usuário logado
  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (profile) setTenantId(profile.tenant_id)
    }

    getProfile()
  }, [])

  // 2. Carregar todos os dados quando tiver tenant_id
  const loadAll = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setError(null)

    try {
      // Produtos
      const { data: dbProducts, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('active', true)
        .order('name')

      if (prodErr) throw prodErr
      setProducts((dbProducts as DbProduct[]).map(dbProductToFrontend))

      // Clientes
      const { data: dbCustomers, error: custErr } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name')

      if (custErr) throw custErr

      const defaultCustomer: Customer = {
        id: 'default',
        name: 'CONSUMIDOR FINAL',
        email: '',
        phone: '',
        address: '',
      }
      setCustomers([defaultCustomer, ...(dbCustomers as DbCustomer[]).map(dbCustomerToFrontend)])

      // Vendas com itens
      const { data: dbSales, error: saleErr } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            product_id,
            quantity,
            unit_price,
            subtotal,
            products ( name, cost )
          ),
          customers ( name )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (saleErr) throw saleErr

      const frontendSales: Sale[] = (dbSales as any[]).map((s) => ({
        id: s.id,
        date: s.created_at,
        customerId: s.customer_id ?? 'default',
        customerName: s.customers?.name ?? 'CONSUMIDOR FINAL',
        items: (s.sale_items ?? []).map((item: any) => ({
          productId: item.product_id,
          productName: item.products?.name ?? '',
          quantity: item.quantity,
          price: Number(item.unit_price),
          cost: Number(item.products?.cost ?? 0),
        })),
        total: Number(s.total),
        discount: Number(s.discount),
        paymentMethod: s.payment_method,
        paymentStatus: s.status === 'pending' ? 'pending' : 'paid',
        cancelledAt: s.status === 'cancelled' ? s.created_at : undefined,
      }))
      setSales(frontendSales)

      // Caixa — sessão aberta
      const { data: openSession } = await supabase
        .from('cash_register')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'open')
        .maybeSingle()

      if (openSession) {
        const s = openSession as DbCashRegister
        setCashRegister({
          isOpen: true,
          openingAmount: Number(s.opening_balance),
          openingTime: s.opened_at,
          closingTime: null,
          sessionId: s.id,
        })
      } else {
        setCashRegister({ isOpen: false, openingAmount: 0, openingTime: null, closingTime: null })
      }

      // Histórico de caixa — sessões fechadas
      const { data: closedSessions } = await supabase
        .from('cash_register')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'closed')
        .order('closed_at', { ascending: false })

      if (closedSessions) {
        const sessions: CashSession[] = (closedSessions as DbCashRegister[]).map((s) => ({
          id: s.id,
          openingAmount: Number(s.opening_balance),
          closingAmount: Number(s.closing_balance ?? 0),
          totalSales: 0, // calculado separadamente se necessário
          openingTime: s.opened_at,
          closingTime: s.closed_at!,
        }))
        setCashSessions(sessions)
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!tenantId) return
    const { data, error } = await supabase
      .from('products')
      .insert({
        tenant_id: tenantId,
        name: product.name,
        sku: product.barcode || null,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        category: product.category || null,
        active: true,
      })
      .select()
      .single()

    if (error) throw error
    setProducts((prev) => [...prev, dbProductToFrontend(data as DbProduct)])
  }

  const updateProduct = async (id: string, product: Omit<Product, 'id'>) => {
    const { error } = await supabase
      .from('products')
      .update({
        name: product.name,
        sku: product.barcode || null,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        category: product.category || null,
      })
      .eq('id', id)

    if (error) throw error
    setProducts((prev) => prev.map((p) => p.id === id ? { ...product, id } : p))
  }

  const deleteProduct = async (id: string) => {
    // Soft delete — marca como inativo
    const { error } = await supabase
      .from('products')
      .update({ active: false })
      .eq('id', id)

    if (error) throw error
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const addCustomer = async (customer: Omit<Customer, 'id'>) => {
    if (!tenantId) return
    const { data, error } = await supabase
      .from('customers')
      .insert({
        tenant_id: tenantId,
        name: customer.name,
        phone: customer.phone || null,
      })
      .select()
      .single()

    if (error) throw error
    setCustomers((prev) => [...prev, dbCustomerToFrontend(data as DbCustomer)])
  }

  const updateCustomer = async (id: string, customer: Omit<Customer, 'id'>) => {
    if (id === 'default') return
    const { error } = await supabase
      .from('customers')
      .update({ name: customer.name, phone: customer.phone || null })
      .eq('id', id)

    if (error) throw error
    setCustomers((prev) =>
      prev.map((c) => c.id === id ? { ...customer, id } : c)
    )
  }

  const deleteCustomer = async (id: string) => {
    if (id === 'default') return
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) throw error
    setCustomers((prev) => prev.filter((c) => c.id !== id))
  }

  const completeSale = async (saleData: Omit<Sale, 'id' | 'date'>) => {
    if (!tenantId || !userId) return

    const status =
      saleData.paymentStatus === 'pending' ? 'pending' : 'completed'

    // 1. Inserir venda
    const { data: newSale, error: saleErr } = await supabase
      .from('sales')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        customer_id: saleData.customerId === 'default' ? null : saleData.customerId,
        total: saleData.total,
        discount: saleData.discount,
        payment_method: saleData.paymentMethod,
        status,
      })
      .select()
      .single()

    if (saleErr) throw saleErr

    // 2. Inserir itens
    const items = saleData.items.map((item) => ({
      sale_id: newSale.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.price,
    }))

    const { error: itemsErr } = await supabase.from('sale_items').insert(items)
    if (itemsErr) throw itemsErr

    // 3. Atualizar estoque
    for (const item of saleData.items) {
      await supabase.rpc('decrement_stock', {
        p_product_id: item.productId,
        p_quantity: item.quantity,
      }).then(({ error }) => {
        if (error) {
          // Fallback: atualiza diretamente se a RPC não existir ainda
          supabase
            .from('products')
            .update({ stock: products.find(p => p.id === item.productId)!.stock - item.quantity })
            .eq('id', item.productId)
        }
      })
    }

    // 4. Se pendente, criar conta a receber
    if (status === 'pending' && saleData.customerId !== 'default') {
      await supabase.from('accounts_receivable').insert({
        tenant_id: tenantId,
        customer_id: saleData.customerId,
        sale_id: newSale.id,
        amount: saleData.total,
        paid: 0,
        status: 'pending',
      })
    }

    // 5. Recarregar dados para manter estado sincronizado
    await loadAll()
  }

  const cancelSale = async (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId)
    if (!sale || sale.cancelledAt) return

    const { error } = await supabase
      .from('sales')
      .update({ status: 'cancelled' })
      .eq('id', saleId)

    if (error) throw error

    // Devolver estoque
    for (const item of sale.items) {
      const product = products.find((p) => p.id === item.productId)
      if (product) {
        await supabase
          .from('products')
          .update({ stock: product.stock + item.quantity })
          .eq('id', item.productId)
      }
    }

    await loadAll()
  }

  const markSaleAsPaid = async (saleId: string) => {
    const { error } = await supabase
      .from('sales')
      .update({ status: 'completed', payment_method: 'Dinheiro' })
      .eq('id', saleId)

    if (error) throw error

    // Atualizar conta a receber se existir
    await supabase
      .from('accounts_receivable')
      .update({ status: 'paid', paid_at: new Date().toISOString(), paid: sales.find(s => s.id === saleId)?.total ?? 0 })
      .eq('sale_id', saleId)

    await loadAll()
  }

  const openCashRegister = async (amount: number) => {
    if (!tenantId || !userId) return
    const { data, error } = await supabase
      .from('cash_register')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        opening_balance: amount,
        status: 'open',
      })
      .select()
      .single()

    if (error) throw error

    setCashRegister({
      isOpen: true,
      openingAmount: amount,
      openingTime: (data as DbCashRegister).opened_at,
      closingTime: null,
      sessionId: data.id,
    })
  }

  const closeCashRegister = async (amount: number) => {
    const { sessionId } = cashRegister
    if (!sessionId) return

    const { error } = await supabase
      .from('cash_register')
      .update({
        closing_balance: amount,
        closed_at: new Date().toISOString(),
        status: 'closed',
      })
      .eq('id', sessionId)

    if (error) throw error
    await loadAll()
  }

  return {
    tenantId,
    userId,
    products,
    customers,
    sales,
    cashRegister,
    cashSessions,
    loading,
    error,
    reload: loadAll,
    // mutations
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    completeSale,
    cancelSale,
    markSaleAsPaid,
    openCashRegister,
    closeCashRegister,
  }
}