import { Customers } from '../components/Customers';
import { useApp } from '../context/AppContext';

export function CustomersPage() {
  const { customers, handleAddCustomer, handleUpdateCustomer, handleDeleteCustomer } = useApp();

  return (
    <div>
      <Customers
        customers={customers}
        onAddCustomer={handleAddCustomer}
        onUpdateCustomer={handleUpdateCustomer}
        onDeleteCustomer={handleDeleteCustomer}
      />
    </div>
  );
}
