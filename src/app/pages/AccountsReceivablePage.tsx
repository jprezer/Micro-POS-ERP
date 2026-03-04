import { AccountsReceivable } from '../components/AccountsReceivable';
import { useApp } from '../context/AppContext';

export function AccountsReceivablePage() {
  const { sales, customers, handleMarkSaleAsPaid } = useApp();

  return (
    <div>
      <AccountsReceivable
        sales={sales}
        customers={customers}
        onMarkAsPaid={handleMarkSaleAsPaid}
      />
    </div>
  );
}
