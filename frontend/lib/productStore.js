import { create } from "zustand";
import { devtools } from "zustand/middleware";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const useProductStore = create(
  devtools((set, get) => ({
    // State
    products: [],
    loading: false,
    error: null,

    // Actions
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    /**
     * Fetch all products from API.
     * Requires authentication.
     */
    fetchProducts: async () => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const products = await response.json();
          set({ products, error: null });
        } else if (response.status === 401) {
          set({ products: [], error: "Unauthorized" });
        } else {
          set({ error: "Failed to fetch products" });
        }
      } catch (error) {
        console.error("Fetch products error:", error);
        set({ error: error.message });
      } finally {
        set({ loading: false });
      }
    },

    /**
     * Create a new product.
     * Requires authentication.
     */
    createProduct: async (productData) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        });

        if (response.ok) {
          const newProduct = await response.json();
          const products = get().products;
          set({ products: [newProduct, ...products], error: null });
          return newProduct;
        } else if (response.status === 401) {
          set({ error: "Unauthorized" });
        } else {
          const data = await response.json();
          set({ error: data.detail || "Failed to create product" });
        }
      } catch (error) {
        console.error("Create product error:", error);
        set({ error: error.message });
      } finally {
        set({ loading: false });
      }
    },

    /**
     * Update an existing product.
     * Requires authentication and must be the creator.
     */
    updateProduct: async (productId, productData) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/products/${productId}/`,
          {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(productData),
          }
        );

        if (response.ok) {
          const updatedProduct = await response.json();
          const products = get().products.map((p) =>
            p.id === productId ? updatedProduct : p
          );
          set({ products, error: null });
          return updatedProduct;
        } else if (response.status === 401) {
          set({ error: "Unauthorized" });
        } else if (response.status === 403) {
          set({ error: "You can only update your own products" });
        } else {
          const data = await response.json();
          set({ error: data.detail || "Failed to update product" });
        }
      } catch (error) {
        console.error("Update product error:", error);
        set({ error: error.message });
      } finally {
        set({ loading: false });
      }
    },

    /**
     * Delete a product.
     * Requires authentication and must be the creator.
     */
    deleteProduct: async (productId) => {
      set({ loading: true, error: null });
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/products/${productId}/`,
          {
            method: "DELETE",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const products = get().products.filter((p) => p.id !== productId);
          set({ products, error: null });
          return true;
        } else if (response.status === 401) {
          set({ error: "Unauthorized" });
        } else if (response.status === 403) {
          set({ error: "You can only delete your own products" });
        } else {
          const data = await response.json();
          set({ error: data.detail || "Failed to delete product" });
        }
      } catch (error) {
        console.error("Delete product error:", error);
        set({ error: error.message });
      } finally {
        set({ loading: false });
      }
    },

    /**
     * Clear all products (used on logout).
     */
    clearProducts: () => {
      set({ products: [], error: null });
    },
  }))
);
