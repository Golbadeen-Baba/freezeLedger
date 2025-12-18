"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { useProductStore } from "@/lib/productStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const {
    products,
    loading: productLoading,
    error: productError,
    fetchProducts,
    createProduct,
    deleteProduct,
  } = useProductStore();

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Fetch products on mount
  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user, fetchProducts]);

  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        setLogoutError("Logout failed");
        return;
      }

      // Clear auth state
      useAuthStore.getState().clearAuth();

      // Redirect to home
      router.push("/");
    } catch (err) {
      setLogoutError(err.message || "An error occurred");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      // Validate
      if (!formData.name || !formData.price) {
        setFormError("Name and price are required");
        setFormLoading(false);
        return;
      }

      await createProduct({
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity) || 0,
      });

      // Reset form
      setFormData({ name: "", description: "", price: "", quantity: "" });
      setShowProductForm(false);
    } catch (err) {
      setFormError(err.message || "Failed to create product");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(productId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            Not authenticated. Redirecting to login...
          </p>
          <Link
            href="/login"
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {logoutError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{logoutError}</p>
          </div>
        )}

        {/* Welcome section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user.first_name || user.email}!
          </h2>
          <p className="text-gray-600">
            You are successfully authenticated using HttpOnly cookies with JWT
            tokens.
          </p>
        </div>

        {/* User profile card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Profile information */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Profile Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Email
                </label>
                <p className="text-gray-900 font-semibold">{user.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    First Name
                  </label>
                  <p className="text-gray-900 font-semibold">
                    {user.first_name || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Last Name
                  </label>
                  <p className="text-gray-900 font-semibold">
                    {user.last_name || "—"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Phone Number
                </label>
                <p className="text-gray-900 font-semibold">
                  {user.phone_number || "—"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Address
                </label>
                <p className="text-gray-900 font-semibold">
                  {user.address || "—"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  User ID
                </label>
                <p className="text-gray-900 font-semibold">{user.id}</p>
              </div>
            </div>
          </div>

          {/* Security information */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Security Information
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-green-600">✓</div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    HttpOnly Cookies
                  </h4>
                  <p className="text-gray-600">
                    Tokens are stored in HttpOnly cookies, preventing XSS
                    attacks
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 text-green-600">✓</div>
                <div>
                  <h4 className="font-semibold text-gray-900">Secure Flag</h4>
                  <p className="text-gray-600">
                    Cookies only transmitted over HTTPS (in production)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 text-green-600">✓</div>
                <div>
                  <h4 className="font-semibold text-gray-900">SameSite=Lax</h4>
                  <p className="text-gray-600">
                    Protection against CSRF attacks
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 text-green-600">✓</div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Automatic Refresh
                  </h4>
                  <p className="text-gray-600">
                    Access tokens automatically refreshed on 401
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 text-green-600">✓</div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Token Blacklist
                  </h4>
                  <p className="text-gray-600">
                    Refresh tokens blacklisted on logout
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Products ({products.length})
            </h3>
            <button
              onClick={() => setShowProductForm(!showProductForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              {showProductForm ? "Cancel" : "Add Product"}
            </button>
          </div>

          {/* Add Product Form */}
          {showProductForm && (
            <form
              onSubmit={handleAddProduct}
              className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200"
            >
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter product name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleFormChange}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Product description"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? "Creating..." : "Create Product"}
              </button>
            </form>
          )}

          {/* Products Error */}
          {productError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {productError}
            </div>
          )}

          {/* Products Loading */}
          {productLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">Loading products...</p>
            </div>
          )}

          {/* Products List */}
          {!productLoading && products.length === 0 ? (
            <div className="py-8 text-center text-gray-600">
              <p>No products yet. Create your first product!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <h4 className="font-bold text-gray-900 mb-2">
                    {product.name}
                  </h4>
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="space-y-1 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-semibold text-gray-900">
                        ${parseFloat(product.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-semibold text-gray-900">
                        {product.quantity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">By:</span>
                      <span className="font-semibold text-gray-900 text-xs">
                        {product.creator_email}
                      </span>
                    </div>
                  </div>

                  {product.creator_id === user.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <p className="text-blue-800">
            💡 <strong>Product Management:</strong> Only authenticated users can
            create, view, and manage products. You can only delete your own
            products. All other users can view all products but cannot modify
            them.
          </p>
        </div>
      </div>
    </div>
  );
}
