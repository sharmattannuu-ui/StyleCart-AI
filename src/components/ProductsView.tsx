import React, { useState } from 'react';
import {
  Shirt,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  PackageX,
  X,
  AlertCircle,
  Tag,
  Filter
} from 'lucide-react';
import { Product, ProductCategory, AvailabilityStatus } from '../types/index.js';

interface ProductsViewProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'inStock' | 'lowStock' | 'outOfStock'>('All');
  const [priceFilter, setPriceFilter] = useState<number | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    category: ProductCategory;
    description: string;
    price: string;
    availableStock: string;
    sizes: string;
    imageUrl: string;
  }>({
    name: '',
    category: 'Shirts',
    description: '',
    price: '',
    availableStock: '15',
    sizes: 'S, M, L, XL',
    imageUrl: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesStock =
      stockFilter === 'All'
        ? true
        : stockFilter === 'inStock'
        ? p.availableStock > 8
        : stockFilter === 'lowStock'
        ? p.availableStock > 0 && p.availableStock <= 8
        : p.availableStock === 0 || p.availabilityStatus === 'Out of Stock';

    const matchesPrice = priceFilter === null || p.price <= priceFilter;

    return matchesSearch && matchesCategory && matchesStock && matchesPrice;
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category: 'Shirts',
      description: '',
      price: '',
      availableStock: '15',
      sizes: 'S, M, L, XL',
      imageUrl: ''
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      description: p.description,
      price: p.price.toString(),
      availableStock: p.availableStock.toString(),
      sizes: p.sizes ? p.sizes.join(', ') : 'S, M, L, XL',
      imageUrl: p.imageUrl || ''
    });
    setFormError(null);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price.trim()) {
      setFormError('Please enter product name and price.');
      return;
    }
    const numPrice = parseFloat(formData.price);
    const numStock = parseInt(formData.availableStock, 10);
    if (isNaN(numPrice) || numPrice < 0) {
      setFormError('Please enter a valid price in INR.');
      return;
    }
    if (isNaN(numStock) || numStock < 0) {
      setFormError('Please enter a valid stock quantity.');
      return;
    }

    setIsSubmitting(true);
    try {
      const sizesArray = formData.sizes
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      let status: AvailabilityStatus = 'In Stock';
      if (numStock === 0) status = 'Out of Stock';
      else if (numStock <= 8) status = 'Low Stock';

      await onAddProduct({
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        price: numPrice,
        availableStock: numStock,
        availabilityStatus: status,
        sizes: sizesArray.length > 0 ? sizesArray : ['S', 'M', 'L'],
        imageUrl: formData.imageUrl.trim() || undefined
      });
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!formData.name.trim() || !formData.price.trim()) {
      setFormError('Please enter product name and price.');
      return;
    }
    const numPrice = parseFloat(formData.price);
    const numStock = parseInt(formData.availableStock, 10);
    if (isNaN(numPrice) || numPrice < 0) {
      setFormError('Please enter a valid price in INR.');
      return;
    }
    if (isNaN(numStock) || numStock < 0) {
      setFormError('Please enter a valid stock quantity.');
      return;
    }

    setIsSubmitting(true);
    try {
      const sizesArray = formData.sizes
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      let status: AvailabilityStatus = 'In Stock';
      if (numStock === 0) status = 'Out of Stock';
      else if (numStock <= 8) status = 'Low Stock';

      await onUpdateProduct(editingProduct.id, {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        price: numPrice,
        availableStock: numStock,
        availabilityStatus: status,
        sizes: sizesArray,
        imageUrl: formData.imageUrl.trim() || undefined
      });
      setEditingProduct(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStockAdjust = async (product: Product, delta: number) => {
    const newStock = Math.max(0, product.availableStock + delta);
    await onUpdateProduct(product.id, { availableStock: newStock });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await onDeleteProduct(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(`Error deleting product: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#EFE9DF] shadow-xs">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">Clothing Inventory</h1>
          <p className="text-sm text-stone-500">
            Catalog of shirts, jeans, dresses, jackets, stock levels, and INR pricing.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-100 rounded-lg text-sm font-medium shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#EFE9DF] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by name, category, or description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-[#FAF8F5] border border-[#EFE9DF] rounded-lg focus:outline-none focus:border-stone-400 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-stone-400 font-medium">Price:</span>
            {[
              { label: 'All', value: null },
              { label: '< ₹1,000', value: 1000 },
              { label: '< ₹2,000', value: 2000 }
            ].map(p => (
              <button
                key={p.label}
                onClick={() => setPriceFilter(p.value)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  priceFilter === p.value
                    ? 'bg-stone-900 text-amber-100'
                    : 'bg-[#FAF8F5] text-stone-600 hover:bg-[#F2ECE1] border border-[#EFE9DF]'
                }`}
              >
                {p.label}
              </button>
            ))}

            <div className="h-4 w-px bg-stone-200 mx-1" />

            <span className="text-stone-400 font-medium">Stock:</span>
            {[
              { label: 'All', value: 'All' as const },
              { label: 'In Stock', value: 'inStock' as const },
              { label: 'Low Stock', value: 'lowStock' as const },
              { label: 'Out of Stock', value: 'outOfStock' as const }
            ].map(s => (
              <button
                key={s.label}
                onClick={() => setStockFilter(s.value)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  stockFilter === s.value
                    ? 'bg-stone-900 text-amber-100'
                    : 'bg-[#FAF8F5] text-stone-600 hover:bg-[#F2ECE1] border border-[#EFE9DF]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
          {['All', 'Shirts', 'Jeans', 'Dresses', 'Jackets', 'Accessories'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#F4EFE6] text-stone-950 border border-[#DED3BD]'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-[#FAF8F5]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List / Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center text-stone-400 rounded-xl border border-[#EFE9DF]">
            No clothing items found matching your filters.
          </div>
        ) : (
          filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-[#EFE9DF] shadow-xs p-4 flex flex-col justify-between hover:border-[#D5C7B0] transition-all group"
            >
              <div className="space-y-3">
                {/* Header: Category and Status Pill */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F4EFE6] text-stone-800 border border-[#E8DEC8]">
                    {product.category}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                      product.availabilityStatus === 'In Stock'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : product.availabilityStatus === 'Low Stock'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {product.availabilityStatus === 'In Stock' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : product.availabilityStatus === 'Low Stock' ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : (
                      <PackageX className="w-3 h-3" />
                    )}
                    {product.availabilityStatus}
                  </span>
                </div>

                {/* Name & Price */}
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 group-hover:text-amber-950 transition-colors">
                    {product.name}
                  </h3>
                  <div className="text-lg font-bold text-stone-950 mt-1">
                    ₹{product.price.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>

                {/* Sizes */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] text-stone-400 font-medium">Sizes:</span>
                    {product.sizes.map(s => (
                      <span
                        key={s}
                        className="text-[10px] px-1.5 py-0.5 bg-stone-100 rounded text-stone-700 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom stock adjustment and actions */}
              <div className="mt-4 pt-3 border-t border-[#EFE9DF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500">Stock:</span>
                  <button
                    onClick={() => handleQuickStockAdjust(product, -1)}
                    disabled={product.availableStock <= 0}
                    title="Decrease stock"
                    className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center cursor-pointer disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-stone-900 px-1">
                    {product.availableStock}
                  </span>
                  <button
                    onClick={() => handleQuickStockAdjust(product, 1)}
                    title="Increase stock"
                    className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(product)}
                    title="Edit Product"
                    className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-[#F4EFE6] rounded transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(product.id)}
                    title="Delete Product"
                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#EFE9DF] shadow-xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="font-serif text-lg font-bold text-stone-900">
                {editingProduct ? 'Edit Product' : 'Add Clothing Product'}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={editingProduct ? handleSubmitEdit : handleSubmitAdd} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Slim Fit Indigo Denim Jeans"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900 bg-white"
                  >
                    <option value="Shirts">Shirts</option>
                    <option value="Jeans">Jeans</option>
                    <option value="Dresses">Dresses</option>
                    <option value="Jackets">Jackets</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Activewear">Activewear</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Price in INR (₹) *</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    placeholder="e.g. 1499"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Available Stock *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 20"
                    value={formData.availableStock}
                    onChange={e => setFormData({ ...formData, availableStock: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Available Sizes</label>
                  <input
                    type="text"
                    placeholder="e.g. S, M, L, XL"
                    value={formData.sizes}
                    onChange={e => setFormData({ ...formData, sizes: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  placeholder="Fabric composition, fit, wash care, and styling advice..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium bg-stone-900 hover:bg-stone-800 text-amber-100 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#EFE9DF] shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-serif text-base font-bold text-stone-900">Confirm Product Deletion</h3>
            <p className="text-xs text-stone-600">
              Are you sure you want to delete this clothing item from your catalog? Existing sales enquiries will preserve their record.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
