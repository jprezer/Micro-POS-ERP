import { Products } from '../components/Products';
import { useApp } from '../context/AppContext';

export function ProductsPage() {
  const { products, handleAddProduct, handleUpdateProduct, handleDeleteProduct } = useApp();

  return (
    <div>
      <Products
        products={products}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
      />
    </div>
  );
}
