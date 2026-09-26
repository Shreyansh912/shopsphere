"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface ProductResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number | null;
  images: { url: string }[];
}

export default function VisualSearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<ProductResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setResults([]);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/visual-search", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Search failed.");
      }

      setResults(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreview(null);
    setResults([]);
    setError(null);
  };

  return (
    <>
      {/* Trigger Button inside Navbar or Search Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 transition border border-slate-200"
        title="Search by image using Computer Vision"
      >
        <svg
          className="w-4 h-4 text-slate-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>Visual Search</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  AI Visual Product Search
                </h2>
                <p className="text-xs text-gray-500">
                  Upload an image to find matching or similar items in our catalog
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none"
              >
                &times;
              </button>
            </div>

            {/* Upload Area */}
            <div className="mt-4 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-black transition">
              <input
                type="file"
                accept="image/*"
                id="visual-file-input"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="visual-file-input" className="cursor-pointer block">
                {preview ? (
                  <div className="relative w-32 h-32 mx-auto mb-2 rounded-lg overflow-hidden border">
                    <Image
                      src={preview}
                      alt="Uploaded query"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="py-4">
                    <svg
                      className="w-10 h-10 text-gray-400 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload or drag an image here
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, or WEBP</p>
                  </div>
                )}
                <span className="text-xs font-semibold text-blue-600 hover:underline">
                  {preview ? "Upload a different photo" : "Select an image"}
                </span>
              </label>
            </div>

            {error && (
              <div className="mt-3 p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Inference Loader */}
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-black mb-2" />
                <p className="text-xs text-gray-500 font-medium">
                  Extracting visual features with ResNet-18...
                </p>
              </div>
            )}

            {/* Results Grid */}
            {!loading && results.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Visually Similar Products ({results.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={handleClose}
                      className="border rounded-xl p-2 hover:shadow-md transition text-left group bg-white"
                    >
                      <div className="relative aspect-square w-full mb-2 bg-slate-50 rounded-lg overflow-hidden">
                        {product.images?.[0]?.url && (
                          <Image
                            src={product.images[0].url}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition duration-200"
                          />
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        ₹{(product.discountPrice ?? product.price).toFixed(2)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {!loading && preview && results.length === 0 && !error && (
              <p className="text-center text-xs text-gray-400 py-6">
                No visual matches found in current catalog.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}