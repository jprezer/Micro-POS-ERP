import { CashRegisterDisplay } from './CashRegisterDisplay';

interface CashRegisterData {
  isOpen: boolean;
  openingAmount: number;
  openingTime: string | null;
  closingTime: string | null;
}

interface Sale {
  id: string;
  date: string;
  total: number;
}

interface CashRegisterProps {
  cashRegister: CashRegisterData;
  sales: Sale[];
  onOpenRegister: (openingAmount: number) => void;
  onCloseRegister: () => void;
}

export function CashRegister({ cashRegister, sales, onOpenRegister, onCloseRegister }: CashRegisterProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Controle de Caixa</h2>
      <CashRegisterDisplay
        cashRegister={cashRegister}
        sales={sales}
        onOpen={onOpenRegister}
        onClose={onCloseRegister}
      />
    </div>
  );
}
