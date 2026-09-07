import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts, Product } from '../hooks/useProducts';
import { useCreateOrder, CreateOrderPayload } from '../hooks/useCreateOrder';
import { useCustomerAuth } from '../hooks/useCustomerAuth';
import { SmartSection } from './SmartSection/SmartSection';
import styles from './CreateOrderForm.module.css';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CreatedOrderSummary {
  orderNumber: string;
  total: number;
  deliveryDate: string;
}

export function CreateOrderForm() {
  const navigate = useNavigate();
  const { customer, token } = useCustomerAuth();
  const {
    products,
    loading: productsLoading,
    refreshing: productsRefreshing,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts();
  const { createOrder, loading: orderLoading, error: orderError } = useCreateOrder();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedQuantityInput, setSelectedQuantityInput] = useState<string>('');

  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [deliveryAddressText, setDeliveryAddressText] = useState<string>('');
  const [openSection, setOpenSection] = useState<string | null>('products');
  const [cartFeedback, setCartFeedback] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrderSummary | null>(null);
  const [financial, setFinancial] = useState<{
    limit: number;
    used: number;
    available: number;
  } | null>(null);
  const cartSectionRef = useRef<HTMLDivElement>(null);

  const paymentMethod = 'CREDIT';

  const buildAddressText = (source?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  }) => {
    if (!source) {
      return '';
    }

    return [
      source.street,
      source.number,
      source.complement,
      source.neighborhood,
      source.city,
      source.state,
      source.zip_code,
    ]
      .filter(Boolean)
      .join(', ');
  };

  const parseDeliveryAddress = (value: string) => {
    const parts = value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length < 6) {
      return null;
    }

    const hasComplement = parts.length >= 7;
    return {
      shipping_street: parts[0],
      shipping_number: parts[1],
      shipping_complement: hasComplement ? parts.slice(2, parts.length - 4).join(', ') : '',
      shipping_neighborhood: parts[parts.length - 4],
      shipping_city: parts[parts.length - 3],
      shipping_state: parts[parts.length - 2],
      shipping_zip_code: parts[parts.length - 1].replace(/\D/g, ''),
    };
  };

  const toggleSection = (sectionId: string) => {
    setOpenSection((prev) => (prev === sectionId ? null : sectionId));
  };

  useEffect(() => {
    // Regra operacional: pedido feito hoje entrega no dia seguinte (D+1).
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setDeliveryDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  useEffect(() => {
    if (!customer) {
      return;
    }

    setDeliveryAddressText(buildAddressText(customer));
  }, [customer]);

  useEffect(() => {
    const cartSection = cartSectionRef.current;
    if (
      openSection === 'cart' &&
      cartItems.length > 0 &&
      typeof cartSection?.scrollIntoView === 'function'
    ) {
      cartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [cartItems.length, openSection]);

  const parsePositiveInteger = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  };

  const handleAddToCart = () => {
    if (!selectedProductId) {
      alert('Selecione um produto');
      return;
    }

    const selectedQuantity = parsePositiveInteger(selectedQuantityInput);
    if (!selectedQuantity) {
      alert('Informe uma quantidade válida (ex: 10)');
      return;
    }

    const product = products.find((p) => p.id === parseInt(selectedProductId));
    if (!product) return;
    setCreatedOrder(null);

    // Verificar se já está no carrinho
    const existingItem = cartItems.find((item) => item.product.id === product.id);
    if (existingItem) {
      // Incrementar quantidade
      setCartItems(
        cartItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + selectedQuantity }
            : item
        )
      );
    } else {
      // Adicionar novo item
      setCartItems([...cartItems, { product, quantity: selectedQuantity }]);
    }

    // Resetar seleção
    setSelectedProductId('');
    setSelectedQuantityInput('');
    setCartFeedback(`${product.name} adicionado ao carrinho.`);
    setOpenSection('cart');
  };

  const handleRemoveFromCart = (product: Product) => {
    if (!window.confirm(`Remover ${product.name} deste pedido?`)) {
      return;
    }
    setCartItems((items) => items.filter((item) => item.product.id !== product.id));
    setCartFeedback(`${product.name} removido do carrinho.`);
  };

  const calculateTotal = (): number => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.product.price);
      return total + price * item.quantity;
    }, 0);
  };

  const parseMoney = (value?: string) => {
    const parsed = Number.parseFloat(String(value ?? '0'));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  useEffect(() => {
    const bootstrapFinancial = async () => {
      if (!token) {
        return;
      }

      try {
        const response = await fetch('/api/v1/bakery/customers/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const data = Array.isArray(payload)
          ? payload[0]
          : Array.isArray(payload?.results)
            ? payload.results[0]
            : payload;
        if (!data) {
          return;
        }
        setFinancial({
          limit: parseMoney(data.financial_limit ?? data.credit_limit),
          used: parseMoney(data.financial_used ?? data.current_balance),
          available: parseMoney(data.financial_available ?? data.available_credit),
        });
      } catch (err) {
        console.error('Erro ao carregar resumo financeiro do cliente:', err);
      }
    };

    void bootstrapFinancial();
    const refreshFinancial = () => void bootstrapFinancial();
    const refreshVisibleFinancial = () => {
      if (document.visibilityState === 'visible') {
        refreshFinancial();
      }
    };
    window.addEventListener('bakery:customer-data-changed', refreshFinancial);
    window.addEventListener('focus', refreshFinancial);
    document.addEventListener('visibilitychange', refreshVisibleFinancial);
    return () => {
      window.removeEventListener('bakery:customer-data-changed', refreshFinancial);
      window.removeEventListener('focus', refreshFinancial);
      document.removeEventListener('visibilitychange', refreshVisibleFinancial);
    };
  }, [token]);

  const financialLimit =
    financial?.limit ?? parseMoney(customer?.financial_limit ?? customer?.credit_limit);
  const financialUsed =
    financial?.used ?? parseMoney(customer?.financial_used ?? customer?.current_balance);
  const availableCredit =
    financial?.available ?? parseMoney(customer?.financial_available ?? customer?.available_credit);

  const orderTotal = calculateTotal();
  const exceedsAvailableCredit = paymentMethod === 'CREDIT' && orderTotal > availableCredit;
  const projectedAvailable = Math.max(
    0,
    availableCredit - (paymentMethod === 'CREDIT' ? orderTotal : 0)
  );
  const isSubmitDisabled = orderLoading || cartItems.length === 0 || exceedsAvailableCredit;

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatDeliveryDateLabel = (value: string) => {
    if (!value) {
      return '';
    }
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
      .format(date)
      .replace('.', '');
    const dd = String(day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    const yy = String(year).slice(-2);
    return `${weekday}, ${dd}/${mm}/${yy}`;
  };

  const handleSubmitOrder = async (e: FormEvent) => {
    e.preventDefault();

    if (!customer) {
      alert('Sessão do cliente não disponível. Faça login novamente.');
      return;
    }

    // Validações
    if (cartItems.length === 0) {
      alert('Adicione pelo menos um item ao carrinho');
      return;
    }

    if (!deliveryDate) {
      alert('Defina a data de entrega');
      return;
    }

    if (exceedsAvailableCredit) {
      alert(
        `Pedido excede o limite disponível. Total: R$ ${orderTotal.toFixed(2)} | Disponível: R$ ${availableCredit.toFixed(2)}`
      );
      return;
    }

    const parsedDeliveryAddress = parseDeliveryAddress(deliveryAddressText);
    if (!parsedDeliveryAddress) {
      alert(
        'Revise o endereço de entrega. Use o formato: Rua, Número, Complemento opcional, Bairro, Cidade, UF, CEP.'
      );
      return;
    }

    if (parsedDeliveryAddress.shipping_zip_code.length !== 8) {
      alert('O CEP do endereço de entrega deve conter 8 dígitos.');
      return;
    }

    // Preparar payload
    const [year, month, day] = deliveryDate.split('-').map(Number);
    const scheduledDelivery = new Date(year, month - 1, day, 8, 0, 0);

    const payload: CreateOrderPayload = {
      customer_id: customer.id,
      delivery_date: scheduledDelivery.toISOString(),
      payment_method: paymentMethod,
      notes,
      ...parsedDeliveryAddress,
      items: cartItems.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
    };

    // Criar pedido
    const result = await createOrder(payload);
    if (result) {
      setCreatedOrder({
        orderNumber: result.order_number,
        total: orderTotal,
        deliveryDate,
      });
      setFinancial((current) =>
        current
          ? {
              ...current,
              used: current.used + orderTotal,
              available: Math.max(0, current.available - orderTotal),
            }
          : current
      );
      setCartItems([]);
      setCartFeedback(null);
      setSelectedProductId('');
      setSelectedQuantityInput('');
      setNotes('');
      setOpenSection('products');
      window.dispatchEvent(new Event('bakery:customer-data-changed'));
    }
  };

  if (productsLoading) {
    return <div className={styles.container}>Carregando produtos...</div>;
  }

  if (productsError && products.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Erro: {productsError}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {createdOrder && (
          <div className={styles.orderSuccess} role="status">
            <strong>Pedido #{createdOrder.orderNumber} criado com sucesso.</strong>
            <span>
              Total {formatCurrency(createdOrder.total)} · Entrega{' '}
              {formatDeliveryDateLabel(createdOrder.deliveryDate)}
            </span>
          </div>
        )}
        <SmartSection
          title="Resumo Financeiro"
          isOpen={openSection === 'financial'}
          onToggle={() => toggleSection('financial')}
        >
          <div className={styles.financialSection}>
            <div className={styles.financialGrid}>
              <div className={styles.financialCard}>
                <label>Saldo Limite</label>
                <p>{formatCurrency(financialLimit)}</p>
              </div>
              <div className={styles.financialCard}>
                <label>Saldo Utilizado</label>
                <p>{formatCurrency(financialUsed)}</p>
              </div>
              <div className={styles.financialCard}>
                <label>Saldo Disponível</label>
                <p>{formatCurrency(availableCredit)}</p>
              </div>
            </div>
            {paymentMethod === 'CREDIT' && cartItems.length > 0 && (
              <p className={styles.financialProjection}>
                Após este pedido: <strong>{formatCurrency(projectedAvailable)}</strong>
              </p>
            )}
          </div>
        </SmartSection>

        <SmartSection
          title="Selecionar Produtos"
          isOpen={openSection === 'products'}
          onToggle={() => toggleSection('products')}
        >
          <div className={styles.section}>
            <div className={styles.productSelector}>
              <button
                type="button"
                className={styles.refreshButton}
                onClick={() => void refetchProducts()}
                disabled={productsRefreshing}
              >
                {productsRefreshing ? 'Atualizando...' : 'Atualizar catálogo'}
              </button>
              {productsError && <div className={styles.catalogError}>{productsError}</div>}
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className={styles.select}
              >
                <option value="">Escolha um produto...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - R$ {parseFloat(product.price).toFixed(2)}
                  </option>
                ))}
              </select>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={selectedQuantityInput}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, '');
                  setSelectedQuantityInput(next);
                }}
                onFocus={(e) => e.currentTarget.select()}
                className={styles.quantitySelectorInput}
                placeholder="Ex: 10"
                aria-label="Quantidade"
              />

              <button onClick={handleAddToCart} className={styles.buttonAdd} type="button">
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </SmartSection>

        <div ref={cartSectionRef}>
          <SmartSection
            title={`Carrinho (${cartItems.length} itens)`}
            isOpen={openSection === 'cart'}
            onToggle={() => toggleSection('cart')}
          >
            {cartFeedback && (
              <p className={styles.cartFeedback} role="status">
                {cartFeedback}
              </p>
            )}
            <div className={styles.section}>
              {cartItems.length === 0 ? (
                <p className={styles.emptyMessage}>Carrinho vazio. Adicione produtos acima.</p>
              ) : (
                <div className={styles.cartItems}>
                  {cartItems.map((item) => (
                    <div key={item.product.id} className={styles.cartItem}>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{item.product.name}</span>
                        <span className={styles.itemPrice}>
                          R$ {parseFloat(item.product.price).toFixed(2)} cada
                        </span>
                      </div>

                      <div className={styles.itemQuantity}>
                        <span className={styles.quantityLabel}>Quantidade</span>
                        <strong>{item.quantity}</strong>
                      </div>

                      <div className={styles.itemSubtotal}>
                        R$ {(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                      </div>

                      <button
                        onClick={() => handleRemoveFromCart(item.product)}
                        className={styles.buttonRemove}
                        type="button"
                        aria-label={`Remover ${item.product.name} do carrinho`}
                      >
                        Remover
                      </button>
                    </div>
                  ))}

                  <div className={styles.cartTotal}>
                    <strong>Total:</strong>
                    <strong className={styles.totalAmount}>R$ {calculateTotal().toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </div>
          </SmartSection>
        </div>

        {/* Dados de entrega e pagamento */}
        <form onSubmit={handleSubmitOrder} className={styles.formSection}>
          <SmartSection
            title="Dados de Entrega"
            isOpen={openSection === 'delivery'}
            onToggle={() => toggleSection('delivery')}
          >
            <div className={styles.section}>
              <div className={styles.formGroup}>
                <label>Data de Entrega *</label>
                <input
                  type="text"
                  value={formatDeliveryDateLabel(deliveryDate)}
                  className={styles.dateAutoInput}
                  readOnly
                  aria-label="Data de entrega automática"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Endereço de Entrega *</label>
                <textarea
                  value={deliveryAddressText}
                  onChange={(e) => setDeliveryAddressText(e.target.value)}
                  className={styles.textarea}
                  placeholder="Rua, Número, Complemento opcional, Bairro, Cidade, UF, CEP"
                  rows={4}
                />
                <small className={styles.helperText}>
                  Padrão do cadastro. Se precisar, edite o texto no formato: Rua, Número,
                  Complemento opcional, Bairro, Cidade, UF, CEP.
                </small>
              </div>

              <div className={styles.formGroup}>
                <label>Notas (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={styles.textarea}
                  placeholder="Ex: Entregar na portaria"
                  rows={3}
                />
              </div>
            </div>
          </SmartSection>

          {/* Erro de criação */}
          {orderError && <div className={styles.error}>Erro: {orderError}</div>}

          {exceedsAvailableCredit && (
            <div className={styles.error}>
              Limite insuficiente para este pedido. Disponível: R$ {availableCredit.toFixed(2)} |
              Total: R$ {orderTotal.toFixed(2)}
            </div>
          )}

          {/* Botões de ação */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => navigate('/customer/dashboard')}
              className={styles.buttonCancel}
            >
              Cancelar
            </button>

            <button type="submit" className={styles.buttonSubmit} disabled={isSubmitDisabled}>
              {orderLoading ? 'Criando pedido...' : 'Criar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
