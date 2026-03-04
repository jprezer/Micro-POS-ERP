import { useState } from 'react';
import { Plus, Edit, Trash2, Mail, Phone, MapPin, Download } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
  onUpdateCustomer: (id: string, customer: Omit<Customer, 'id'>) => void;
  onDeleteCustomer: (id: string) => void;
}

export function Customers({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer }: CustomersProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      onUpdateCustomer(editingId, formData);
      toast.success('Cliente atualizado com sucesso!');
      setEditingId(null);
    } else {
      onAddCustomer(formData);
      toast.success('Cliente cadastrado com sucesso!');
    }

    setFormData({ name: '', email: '', phone: '', address: '' });
    setIsAdding(false);
  };

  const handleEdit = (customer: Customer) => {
    // Não permitir editar o cliente padrão
    if (customer.id === 'default') {
      toast.error('Não é possível editar o cliente padrão');
      return;
    }
    
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address
    });
    setEditingId(customer.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    // Não permitir deletar o cliente padrão
    if (id === 'default') {
      toast.error('Não é possível excluir o cliente padrão');
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      onDeleteCustomer(id);
      toast.success('Cliente excluído com sucesso!');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', email: '', phone: '', address: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleExportCustomers = () => {
    const exportData = customers.map(customer => ({
      nome: customer.name,
      email: customer.email,
      telefone: customer.phone,
      endereco: customer.address
    }));

    exportToCSV(exportData, 'clientes', {
      nome: 'Nome',
      email: 'Email',
      telefone: 'Telefone',
      endereco: 'Endereço'
    });
    toast.success('Exportação concluída!');
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Clientes</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportCustomers}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
            >
              <Plus className="w-5 h-5" />
              Adicionar Cliente
            </button>
          )}
        </div>
      </div>

      {/* Formulário */}
      {isAdding && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">
            {editingId ? 'Editar Cliente' : 'Novo Cliente'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
              >
                {editingId ? 'Atualizar' : 'Adicionar'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <div key={customer.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{customer.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(customer)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(customer.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{customer.address}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {customers.length === 0 && !isAdding && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>Nenhum cliente cadastrado ainda.</p>
          <p className="text-sm mt-2">Clique em "Adicionar Cliente" para começar.</p>
        </div>
      )}
    </div>
  );
}