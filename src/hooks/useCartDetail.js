'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { cartsAPI } from '@/lib/api';
import { recalculateCart } from '@/utils/cartUtils';

/**
 * useCartDetail — manages a single cart, inline item quantity updates,
 * optimistic UI, remove/clear/status update actions.
 */
export function useCartDetail(id) {
  const [cart,        setCart]        = useState(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState('');
  const [summaryBusy, setSummaryBusy] = useState(false);

  // Track in-flight debounce timers per cart item
  const debounceMap = useRef({});

  // ── Load cart ─────────────────────────────────────────────────────────────
  const normalizeCart = (raw) => {
    if (!raw) return null;
    // API returns items[].productVariant — normalize to items[].variant
    // Also handle empty-cart shape: { cart: null, items: [] }
    const cartData = raw?.cart ?? raw;
    if (!cartData || !cartData.id) return null;
    return {
      ...cartData,
      items: (cartData.items ?? []).map((item) => ({
        ...item,
        variant: item.variant ?? item.productVariant ?? null,
      })),
    };
  };

  const loadCart = useCallback(() => {
    if (!id) return;
    setIsLoading(true);
    setError('');
    cartsAPI.getById(id)
      .then((res) => {
        const raw = res?.data ?? res;
        setCart(normalizeCart(raw));
      })
      .catch((err) => {
        const msg = typeof err === 'string' ? err : 'Failed to load cart.';
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  // ── Optimistic quantity update (debounced 500ms) ──────────────────────────
  const handleQuantityChange = useCallback((cartItemId, newQty) => {
    if (newQty < 1) return; // use remove instead

    // Optimistic update — update local items list immediately
    setCart((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((item) =>
        item.id === cartItemId
          ? { ...item, quantity: newQty, total_price: (parseFloat(item.unit_price) * newQty).toFixed(2) }
          : item
      );
      const { subtotal, total_items } = recalculateCart(updatedItems);
      return {
        ...prev,
        items: updatedItems,
        total_items,
        subtotal_amount: subtotal.toFixed(2),
      };
    });

    // Debounce the API call
    if (debounceMap.current[cartItemId]) clearTimeout(debounceMap.current[cartItemId]);

    debounceMap.current[cartItemId] = setTimeout(() => {
      setSummaryBusy(true);
      cartsAPI.updateItem(cartItemId, { quantity: newQty })
        .then((res) => {
          // Replace with authoritative server values
          const serverCart = res?.data ?? null;
          if (serverCart) setCart(normalizeCart(serverCart));
        })
        .catch((err) => {
          toast.error(typeof err === 'string' ? err : 'Failed to update item.');
          loadCart(); // revert on error
        })
        .finally(() => setSummaryBusy(false));
    }, 500);
  }, [loadCart]);

  // ── Remove item ───────────────────────────────────────────────────────────
  const handleRemoveItem = useCallback((cartItemId, onDone) => {
    cartsAPI.removeItem(cartItemId)
      .then((res) => {
        toast.success('Item removed from cart.');
        const serverCart = res?.data ?? null;
        if (serverCart) setCart(normalizeCart(serverCart));
        else loadCart();
        onDone?.();
      })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Failed to remove item.'));
  }, [loadCart]);

  // ── Clear cart ────────────────────────────────────────────────────────────
  const handleClearCart = useCallback((onDone) => {
    if (!cart?.id) return;
    cartsAPI.clear(cart.id)
      .then(() => {
        toast.success('Cart cleared successfully.');
        loadCart();
        onDone?.();
      })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Failed to clear cart.'));
  }, [cart, loadCart]);

  // ── Update status ─────────────────────────────────────────────────────────
  const handleUpdateStatus = useCallback((status, onDone) => {
    if (!cart?.id) return;
    cartsAPI.updateStatus(cart.id, { status })
      .then((res) => {
        toast.success('Cart status updated.');
        const serverCart = res?.data ?? null;
        if (serverCart) setCart(normalizeCart(serverCart));
        else setCart((prev) => prev ? { ...prev, status } : prev);
        onDone?.();
      })
      .catch((err) => toast.error(typeof err === 'string' ? err : 'Failed to update cart status.'));
  }, [cart]);

  return {
    cart,
    setCart,
    isLoading,
    error,
    summaryBusy,
    loadCart,
    handleQuantityChange,
    handleRemoveItem,
    handleClearCart,
    handleUpdateStatus,
  };
}
