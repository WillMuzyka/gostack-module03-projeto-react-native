import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Partial<Product>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:cart',
      );
      if (storagedProducts) setProducts(JSON.parse(storagedProducts));
    }

    loadProducts();
  }, []);

  const saveStorage = useCallback(productsToSave => {
    return AsyncStorage.setItem(
      '@GoMarketplace:cart',
      JSON.stringify(productsToSave),
    );
  }, []);

  const changeQuantity = useCallback(
    (index: number, quantity: number) => {
      const newProducts = [...products];
      newProducts[index].quantity += quantity;
      setProducts([...newProducts]);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const findedProductIndex = products.findIndex(
        prod => prod.id === product.id,
      );
      if (findedProductIndex !== -1) {
        changeQuantity(findedProductIndex, 1);
      } else {
        const newProduct = { ...product, quantity: 1 };
        setProducts([...products, newProduct]);
      }

      await saveStorage([...products]);
    },
    [changeQuantity, products, saveStorage],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);
      if (productIndex === -1) return;

      changeQuantity(productIndex, 1);

      await saveStorage([...products]);
    },
    [products, changeQuantity, saveStorage],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);
      if (productIndex !== -1) {
        if (products[productIndex].quantity === 1) {
          const newProducts = [...products];
          newProducts.splice(productIndex, 1);
          setProducts([...newProducts]);
        } else {
          changeQuantity(productIndex, -1);
        }

        await saveStorage([...products]);
      }
    },
    [products, changeQuantity, saveStorage],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
