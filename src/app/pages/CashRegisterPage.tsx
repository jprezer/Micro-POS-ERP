import { CashRegisterDisplay } from '../components/CashRegisterDisplay';
import { useApp } from '../context/AppContext';

export function CashRegisterPage() {
  const { cashRegister, sales, handleOpenCashRegister, handleCloseCashRegister } = useApp();

  return (
    <div>
      <CashRegisterDisplay
        cashRegister={cashRegister}
        onOpen={handleOpenCashRegister}
        onClose={handleCloseCashRegister}
        sales={sales}
      />
    </div>
  );
}
