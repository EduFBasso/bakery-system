import React, { useState } from 'react';
import { useProducts, Product } from '../hooks/useProducts';
import { useCreateProduct, CreateProductInput } from '../hooks/useCreateProduct';
import { useUpdateProduct } from '../hooks/useUpdateProduct';
import { useDeleteProduct } from '../hooks/useDeleteProduct';
import styles from './ProductsPanel.module.css';

interface ProductsPanelProps {
  onRefresh?: () => void;
}

export function ProductsPanel({ onRefresh }: ProductsPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateProductInput>({
    name: '',
    description: '',
    price: '',
    is_active: true,
  });

  const { products, loading, error, refetch } = useProducts();
  const { createProduct, loading: createLoading } = useCreateProduct();
  const { updateProduct, loading: updateLoading } = useUpdateProduct();
  const { deleteProduct } = useDeleteProduct();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (!formData.name.trim() || !formData.price.trim()) {
      alert('Nome e preço são obrigatórios');
      return;
    }

    try {
      if (editingId) {
        // Atualizar
        const result = await updateProduct(editingId, formData);
        if (result) {
          setShowForm(false);
          setEditingId(null);
          setFormData({ name: '', description: '', price: '', is_active: true });
          await refetch();
          onRefresh?.();
        }
      } else {
        // Criar novo
        const result = await createProduct(formData);
        if (result) {
          setShowForm(false);
          setFormData({ name: '', description: '', price: '', is_active: true });
          await refetch();
          onRefresh?.();
        }
      }
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      is_active: product.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (productId: number, productName: string) => {
    if (confirm(`Tem certeza que deseja deletar o produto "${productName}"?`)) {
      const success = await deleteProduct(productId);
      if (success) {
        await refetch();
        onRefresh?.();
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', price: '', is_active: true });
  };

  if (loading && products.length === 0) {
    return <div className={styles.loading}>Carregando produtos...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header com botão de criar */}
      <div className={styles.header}>
        <h2>📦 Gerenciamento de Produtos</h2>
        <button
          className={styles.createBtn}
          onClick={() => setShowForm(true)}
          disabled={createLoading || updateLoading}
        >
          ➕ Novo Produto
        </button>
      </div>

      {error && <div className={styles.error}>Erro: {error}</div>}

      {/* Formulário de Criação/Edição */}
      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <h3>{editingId ? '✏️ Editar Produto' : '➕ Novo Produto'}</h3>

          <div className={styles.formGroup}>
            <label htmlFor="name">Nome do Produto *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Pão Francês"
              disabled={createLoading || updateLoading}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Descrição</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Pão fresco, feito diariamente"
              disabled={createLoading || updateLoading}
              rows={3}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="price">Preço (R$) *</label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                disabled={createLoading || updateLoading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="is_active">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  disabled={createLoading || updateLoading}
                />{' '}
                Produto Ativo
              </label>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={createLoading || updateLoading}
            >
              {createLoading || updateLoading
                ? '⏳ Processando...'
                : editingId
                  ? '💾 Atualizar'
                  : '➕ Criar'}
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleCancel}
              disabled={createLoading || updateLoading}
            >
              ✕ Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de Produtos */}
      <div className={styles.productsList}>
        {products.length === 0 ? (
          <p className={styles.emptyState}>Nenhum produto cadastrado</p>
        ) : (
          <div className={styles.grid}>
            {products.map((product) => (
              <div
                key={product.id}
                className={`${styles.productCard} ${!product.is_active ? styles.inactive : ''}`}
              >
                <div className={styles.cardHeader}>
                  <h3>{product.name}</h3>
                  <span
                    className={`${styles.status} ${product.is_active ? styles.active : styles.disabled}`}
                  >
                    {product.is_active ? '✅ Ativo' : '⛔ Inativo'}
                  </span>
                </div>

                <p className={styles.description}>{product.description || 'Sem descrição'}</p>

                <div className={styles.price}>
                  <strong>R$ {parseFloat(product.price).toFixed(2)}</strong>
                </div>

                <div className={styles.actions}>
                  <button
                    className={styles.editBtn}
                    onClick={() => handleEdit(product)}
                    title="Editar produto"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(product.id, product.name)}
                    title="Deletar produto"
                  >
                    🗑️ Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
