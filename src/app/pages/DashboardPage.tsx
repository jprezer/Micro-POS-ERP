import { Dashboard } from '../components/Dashboard';
import { useApp } from '../context/AppContext';

export function DashboardPage() {
  const { sales, products, customers, cashRegister } = useApp();

  return (
    <div>
      <Dashboard 
        salesData={sales} 
        products={products}
        customers={customers}
        cashRegister={cashRegister}
      />
    </div>
  );
}