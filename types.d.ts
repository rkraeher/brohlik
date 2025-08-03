// types.d.ts

type MessageAction = 'UPDATE_USER' | 'INJECT_BROHLIK_BUTTON';

interface CartItem {
  user?: string;
  price?: number;
  quantity?: number;
  productName?: string;
  productId?: number;
}

interface CartData {
  items: Object<number, CartItem>;
  notAvailableItems: Array<CartItem>;
}

type ShoppingCart = Record<number, CartItem>;
