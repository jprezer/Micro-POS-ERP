import { useState } from 'react';
import { Plus, Edit, Trash2, Search, Download, Barcode } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  barcode: string;
}

interface ProductsProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (id: string, product: Omit<Product, 'id'>) => void;
  onDeleteProduct: (id: string) => void;
}

export function Products({ products, onAddProduct, onUpdateProduct, onDeleteProduct }: ProductsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cost: '',
    stock: '',
    category: '',
    barcode: ''
  });

  // Obter categorias únicas
  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm);
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const price = parseFloat(formData.price);
    const cost = parseFloat(formData.cost);
    
    if (cost > price) {
      toast.error('O custo não pode ser maior que o preço de venda!');
      return;
    }

    const productData = {
      name: formData.name,
      price,
      cost,
      stock: parseInt(formData.stock),
      category: formData.category,
      barcode: formData.barcode
    };

    if (editingId) {
      onUpdateProduct(editingId, productData);
      toast.success('Produto atualizado com sucesso!');
      setEditingId(null);
    } else {
      onAddProduct(productData);
      toast.success('Produto cadastrado com sucesso!');
    }

    setFormData({ name: '', price: '', cost: '', stock: '', category: '', barcode: '' });
    setIsAdding(false);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      cost: product.cost.toString(),
      stock: product.stock.toString(),
      category: product.category,
      barcode: product.barcode
    });
    setEditingId(product.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      onDeleteProduct(id);
      toast.success('Produto excluído com sucesso!');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', price: '', cost: '', stock: '', category: '', barcode: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleExportProducts = () => {
    const exportData = filteredProducts.map(product => {
      const margin = ((product.price - product.cost) / product.price * 100).toFixed(1);
      return {
        nome: product.name,
        categoria: product.category,
        codigo_barras: product.barcode,
        custo: `R$ ${product.cost.toFixed(2)}`,
        preco: `R$ ${product.price.toFixed(2)}`,
        margem: `${margin}%`,
        estoque: product.stock
      };
    });

    exportToCSV(exportData, 'produtos', {
      nome: 'Nome',
      categoria: 'Categoria',
      codigo_barras: 'Código de Barras',
      custo: 'Custo',
      preco: 'Preço',
      margem: 'Margem',
      estoque: 'Estoque'
    });
    toast.success('Exportação concluída!');
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Produtos</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportProducts}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              <Plus className="w-5 h-5" />
              Adicionar Produto
            </button>
          )}
        </div>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome, categoria ou código de barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto shrink-0"
        >
          <option value="all">Todas Categorias</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Formulário */}
      {isAdding && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">
            {editingId ? 'Editar Produto' : 'Novo Produto'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Alimentos, Bebidas, etc"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                  <Barcode className="w-4 h-4" />
                  Código de Barras <span className="text-xs text-gray-500">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="7891234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço de Venda (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estoque</label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
            
            {/* Calcular margem de lucro */}
            {formData.price && formData.cost && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💰 <strong>Margem de Lucro:</strong> {
                    ((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.price) * 100).toFixed(1)
                  }% 
                  {' '}| Lucro unitário: R$ {(parseFloat(formData.price) - parseFloat(formData.cost)).toFixed(2)}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
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

      {/* Lista de produtos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Código de Barras
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Custo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Margem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estoque
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.map((product) => {
                const margin = ((product.price - product.cost) / product.price * 100).toFixed(1);
                return (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {product.barcode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      R$ {product.cost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                      R$ {product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded ${
                        parseFloat(margin) < 20 
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' 
                          : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      }`}>
                        {margin}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded ${
                        product.stock < 10 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                          : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      }`}>
                        {product.stock} un.
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Nenhum produto encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}