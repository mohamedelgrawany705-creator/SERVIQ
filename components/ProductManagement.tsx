import React, { useState } from 'react';
import { Product } from '../types';
import { PlusIcon, TrashIcon, PencilIcon } from './icons';
import { Modal } from './Modal';

interface ProductManagementProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ products, setProducts }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const openEditModal = (product: Product | null = null) => {
    setCurrentProduct(product);
    setProductName(product ? product.name : '');
    setProductPrice(product ? String(product.price) : '');
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentProduct(null);
    setProductName('');
    setProductPrice('');
  };

  const handleSave = () => {
    const price = parseFloat(productPrice);
    if (productName.trim() === '' || isNaN(price) || price < 0) {
        alert('الرجاء إدخال اسم وسعر صالح للمنتج.');
        return;
    }

    if (currentProduct) {
      setProducts(products.map(p => p.id === currentProduct.id ? { ...p, name: productName, price } : p));
    } else {
      setProducts([...products, { id: crypto.randomUUID(), name: productName, price }]);
    }
    closeEditModal();
  };
  
  const handleDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
        setProducts(products.filter(p => p.id !== productToDelete.id));
        setProductToDelete(null);
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white text-3d hologram-title">إدارة المنتجات</h1>
        <button
          onClick={() => openEditModal()}
          className="hologram-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg icon-glow"
        >
          <PlusIcon className="h-5 w-5" />
          إضافة منتج
        </button>
      </div>
      
       <div className="hologram-panel rounded-xl">
         <ul className="divide-y divide-cyan-500/10">
            {products.length > 0 ? products.map(product => (
                <li key={product.id} className="p-4 flex justify-between items-center hover:bg-purple-900/20 transition-colors">
                    <div>
                        <p className="text-lg font-semibold text-white text-3d">{product.name}</p>
                        <p className="text-sm text-purple-400 font-medium">{formatCurrency(product.price)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => openEditModal(product)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-cyan-500/10 transition-colors icon-glow">
                           <PencilIcon />
                        </button>
                         <button onClick={() => handleDelete(product)} className="p-2 text-red-400 hover:text-red-300 rounded-full hover:bg-cyan-500/10 transition-colors icon-glow icon-glow-red">
                           <TrashIcon />
                        </button>
                    </div>
                </li>
            )) : (
                <li className="p-8 text-center text-gray-400">
                    لم يتم إضافة أي منتجات بعد.
                </li>
            )}
         </ul>
       </div>

      {/* Reusable Modal for Delete Confirmation */}
      <Modal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        title="تأكيد حذف المنتج"
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
            <TrashIcon className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-white">هل أنت متأكد من حذف "{productToDelete?.name}"؟</h3>
          <p className="mt-2 text-sm text-gray-400">
            سيتم حذف هذا المنتج بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => setProductToDelete(null)}
              className="hologram-btn px-6 py-2.5 text-sm font-semibold rounded-lg !bg-gray-500/10 !border-gray-500/30 !text-gray-300 hover:!bg-gray-500/20"
            >
              إلغاء
            </button>
            <button
              onClick={handleConfirmDelete}
              className="hologram-btn px-6 py-2.5 text-sm font-semibold rounded-lg !bg-red-500/10 !border-red-500/40 !text-red-400 hover:!bg-red-500/20"
            >
              نعم، قم بالحذف
            </button>
          </div>
        </div>
      </Modal>

      {/* Reusable Modal for Add/Edit */}
      <Modal 
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title={currentProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
      >
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="productName" className="block text-sm font-medium text-gray-300 mb-1">اسم المنتج</label>
              <input type="text" id="productName" value={productName} onChange={e => setProductName(e.target.value)} className="hologram-input block w-full sm:text-sm text-white p-2" />
            </div>
            <div>
              <label htmlFor="productPrice" className="block text-sm font-medium text-gray-300 mb-1">السعر</label>
              <input type="number" id="productPrice" value={productPrice} onChange={e => setProductPrice(e.target.value)} min="0" step="0.01" className="hologram-input block w-full sm:text-sm text-white p-2" />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button onClick={closeEditModal} className="hologram-btn px-4 py-2 text-sm font-semibold rounded-lg !bg-gray-500/10 !border-gray-500/30 !text-gray-300 hover:!bg-gray-500/20">إلغاء</button>
            <button onClick={handleSave} className="hologram-btn px-4 py-2 text-sm font-semibold rounded-lg">حفظ</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};