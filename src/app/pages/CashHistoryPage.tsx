import { CashHistory } from '../components/CashHistory';
import { useApp } from '../context/AppContext';

export function CashHistoryPage() {
  const { cashSessions } = useApp();

  return (
    <div>
      <CashHistory cashSessions={cashSessions} />
    </div>
  );
}
