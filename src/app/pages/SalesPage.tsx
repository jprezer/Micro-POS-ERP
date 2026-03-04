import { Sales } from '../components/Sales';
import { useApp } from '../context/AppContext';
import { useSearchParams } from 'react-router';

export function SalesPage() {
  const { products, customers, cashRegister, sales, handleCompleteSale, handleCancelSale } = useApp();
  const [searchParams] = useSearchParams();
  const shouldOpenNew = searchParams.get('action') === 'new';

  return (
    <div>
      <Sales
        sales={sales}
        products={products}
        customers={customers}
        onAddSale={handleCompleteSale}
        onCancelSale={handleCancelSale}
        cashRegisterOpen={cashRegister.isOpen}
        autoOpen={shouldOpenNew}
      />
    </div>
  );
}