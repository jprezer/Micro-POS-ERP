import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fvdwznudopawhbxkdvlh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2ZHd6bnVkb3Bhd2hieGtkdmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDIzNjQsImV4cCI6MjA4ODIxODM2NH0.Xze9_UNj2pBLLy8S0HK1fFITJSNHmMeOog6i0cqOKAE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Tipos do banco ───────────────────────────────────────────────────────────

export interface DbProduct {
  id: string
  tenant_id: string
  name: string
  sku: string | null
  price: number
  cost: number
  stock: number
  min_stock: number
  category: string | null
  image_url: string | null
  active: boolean
  created_at: string
}

export interface DbCustomer {
  id: string
  tenant_id: string
  name: string
  phone: string | null
  cpf: string | null
  credit_limit: number
  balance: number
  notes: string | null
  created_at: string
}

export interface DbSale {
  id: string
  tenant_id: string
  customer_id: string | null
  user_id: string | null
  total: number
  discount: number
  payment_method: string
  status: string
  notes: string | null
  created_at: string
}

export interface DbSaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface DbCashRegister {
  id: string
  tenant_id: string
  user_id: string | null
  opened_at: string
  closed_at: string | null
  opening_balance: number
  closing_balance: number | null
  status: 'open' | 'closed'
}

export interface DbAccountsReceivable {
  id: string
  tenant_id: string
  customer_id: string | null
  sale_id: string | null
  amount: number
  paid: number
  due_date: string | null
  paid_at: string | null
  status: 'pending' | 'paid' | 'overdue'
  created_at: string
}

export interface DbUser {
  id: string
  tenant_id: string
  name: string
  role: 'owner' | 'operator'
  created_at: string
}

export interface DbTenant {
  id: string
  name: string
  slug: string
  plan: string
  phone: string | null
  address: string | null
  created_at: string
}