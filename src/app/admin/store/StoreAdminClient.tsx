"use client";

import { useState, useTransition } from "react";
import {
  addStoreItem,
  updateStoreItem,
  deleteStoreItem,
  toggleStoreItemActive,
} from "./actions";

interface StoreItem {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  affiliate_url: string;
  category: string;
  tag: string | null;
  sort_order: number;
  is_active: boolean;
}

interface Props {
  items: StoreItem[];
}

const emptyForm = {
  name: "",
  image_url: "",
  affiliate_url: "",
  category: "",
  tag: "",
  sort_order: "0",
  description: "",
};

export function StoreAdminClient({ items }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [addForm, setAddForm] = useState(emptyForm);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await addStoreItem(formData);
        setAddForm(emptyForm);
        setShowAddForm(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add item");
      }
    });
  };

  const handleEdit = (item: StoreItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      image_url: item.image_url ?? "",
      affiliate_url: item.affiliate_url,
      category: item.category,
      tag: item.tag ?? "",
      sort_order: String(item.sort_order),
      description: item.description ?? "",
    });
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateStoreItem(editingId, formData);
        setEditingId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update item");
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteStoreItem(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete item");
      }
    });
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        await toggleStoreItemActive(id, !isActive);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update item");
      }
    });
  };

  const inputClass =
    "w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";
  const btnClass = "px-3 py-1 text-xs rounded font-medium";

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add product button / form */}
      <div>
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className={`${btnClass} bg-blue-600 text-white hover:bg-blue-700`}
          >
            + Add product
          </button>
        ) : (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h2 className="text-sm font-semibold mb-3">Add product</h2>
            <form onSubmit={handleAdd}>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className={inputClass}
                    placeholder="Cast Iron Skillet"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="category"
                    required
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                    className={inputClass}
                    placeholder="Pans"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">
                    Affiliate URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="affiliate_url"
                    required
                    value={addForm.affiliate_url}
                    onChange={(e) => setAddForm({ ...addForm, affiliate_url: e.target.value })}
                    className={inputClass}
                    placeholder="https://amazon.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Image URL</label>
                  <input
                    name="image_url"
                    value={addForm.image_url}
                    onChange={(e) => setAddForm({ ...addForm, image_url: e.target.value })}
                    className={inputClass}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tag</label>
                  <input
                    name="tag"
                    value={addForm.tag}
                    onChange={(e) => setAddForm({ ...addForm, tag: e.target.value })}
                    className={inputClass}
                    placeholder="Recommended"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Sort order</label>
                  <input
                    name="sort_order"
                    type="number"
                    value={addForm.sort_order}
                    onChange={(e) => setAddForm({ ...addForm, sort_order: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Description</label>
                  <input
                    name="description"
                    value={addForm.description}
                    onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                    className={inputClass}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className={`${btnClass} bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50`}
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setAddForm(emptyForm); }}
                  className={`${btnClass} bg-white border border-gray-300 text-gray-700 hover:bg-gray-50`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Name</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Category</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Tag</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Sort</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Affiliate URL</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Active</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400 text-sm">
                  No products yet. Add one above.
                </td>
              </tr>
            )}
            {items.map((item) =>
              editingId === item.id ? (
                <tr key={item.id} className="border-b border-gray-100 bg-blue-50">
                  <td colSpan={7} className="p-3">
                    <form onSubmit={handleUpdate}>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Name *</label>
                          <input
                            name="name"
                            required
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Category *</label>
                          <input
                            name="category"
                            required
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Tag</label>
                          <input
                            name="tag"
                            value={editForm.tag}
                            onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs text-gray-600 mb-1">Affiliate URL *</label>
                          <input
                            name="affiliate_url"
                            required
                            value={editForm.affiliate_url}
                            onChange={(e) => setEditForm({ ...editForm, affiliate_url: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Image URL</label>
                          <input
                            name="image_url"
                            value={editForm.image_url}
                            onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Sort order</label>
                          <input
                            name="sort_order"
                            type="number"
                            value={editForm.sort_order}
                            onChange={(e) => setEditForm({ ...editForm, sort_order: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Description</label>
                          <input
                            name="description"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isPending}
                          className={`${btnClass} bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50`}
                        >
                          {isPending ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className={`${btnClass} bg-white border border-gray-300 text-gray-700 hover:bg-gray-50`}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!item.is_active ? "opacity-50" : ""}`}>
                  <td className="py-2 px-3 font-medium">{item.name}</td>
                  <td className="py-2 px-3 text-gray-600">{item.category}</td>
                  <td className="py-2 px-3 text-gray-600">{item.tag ?? "—"}</td>
                  <td className="py-2 px-3 text-gray-600">{item.sort_order}</td>
                  <td className="py-2 px-3 max-w-xs">
                    <a
                      href={item.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate block max-w-[200px]"
                    >
                      {item.affiliate_url}
                    </a>
                  </td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => handleToggleActive(item.id, item.is_active)}
                      disabled={isPending}
                      className={`${btnClass} ${item.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className={`${btnClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        disabled={isPending}
                        className={`${btnClass} bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
