import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import React from "react";
import { Id } from "../../convex/_generated/dataModel";

interface Slide {
  _id: Id<"slides">;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  order: number;
  isActive: boolean;
}

interface ContentItem {
  _id: Id<"content">;
  key: string;
  value: string;
  type: "text" | "html" | "markdown";
  isActive: boolean;
}

export default function ContentTab() {
  // Slides
  const slides = useQuery(api.content.listSlides) as Slide[] || [];
  const createSlide = useMutation(api.content.createSlide);
  const updateSlide = useMutation(api.content.updateSlide);
  const deleteSlide = useMutation(api.content.deleteSlide);

  // Content
  const content = useQuery(api.content.listContent) as ContentItem[] || [];
  const createContent = useMutation(api.content.createContent);
  const updateContent = useMutation(api.content.updateContent);
  const deleteContent = useMutation(api.content.deleteContent);

  // Slide modal state
  const [slideModalOpen, setSlideModalOpen] = useState(false);
  const [editSlide, setEditSlide] = useState<Slide | null>(null);
  const [slideForm, setSlideForm] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    order: 0,
    isActive: true,
  });
  const [slideLoading, setSlideLoading] = useState(false);
  const [slideError, setSlideError] = useState("");
  const [slideImageFile, setSlideImageFile] = useState<File | null>(null);
  const [slideImagePreview, setSlideImagePreview] = useState<string>("");

  // Content modal state
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [editContent, setEditContent] = useState<ContentItem | null>(null);
  const [contentForm, setContentForm] = useState({
    key: "",
    value: "",
    type: "text" as "text" | "html" | "markdown",
    isActive: true,
  });
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState("");

  // Slide modal handlers
  const openAddSlideModal = () => {
    setEditSlide(null);
    setSlideForm({ title: "", subtitle: "", imageUrl: "", order: 0, isActive: true });
    setSlideImageFile(null);
    setSlideImagePreview("");
    setSlideModalOpen(true);
  };
  const openEditSlideModal = (slide: Slide) => {
    setEditSlide(slide);
    setSlideForm({
      title: slide.title,
      subtitle: slide.subtitle || "",
      imageUrl: slide.imageUrl || "",
      order: slide.order,
      isActive: slide.isActive,
    });
    setSlideImagePreview(slide.imageUrl || "");
    setSlideImageFile(null);
    setSlideModalOpen(true);
  };
  const closeSlideModal = () => {
    setSlideModalOpen(false);
    setSlideError("");
    setSlideImageFile(null);
    setSlideImagePreview("");
  };
  const handleSlideInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setSlideForm((f) => ({ ...f, [name]: type === "number" ? Number(value) : value }));
  };
  const handleSlideCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSlideForm((f) => ({ ...f, [name]: checked }));
  };
  const handleSlideImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setSlideError("Image size should be less than 5MB");
        return;
      }
      setSlideImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlideImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const validateSlideForm = () => {
    if (!slideForm.title.trim()) {
      setSlideError("Title is required");
      return false;
    }
    if (slideForm.order < 0) {
      setSlideError("Order must be 0 or greater");
      return false;
    }
    return true;
  };
  const isSlideFormValid = slideForm.title.trim() && slideForm.order >= 0;
  const handleSlideSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateSlideForm()) return;
    setSlideLoading(true);
    setSlideError("");
    try {
      // TODO: Implement image upload to storage
      // For now, we'll just use the image preview URL
      const formData = {
        ...slideForm,
        imageUrl: slideImagePreview || slideForm.imageUrl,
      };
      if (editSlide) {
        await updateSlide({
          slideId: editSlide._id,
          ...formData,
        });
      } else {
        await createSlide({
          title: slideForm.title,
          subtitle: slideForm.subtitle,
          order: slideForm.order,
          isActive: slideForm.isActive,
        });
      }
      closeSlideModal();
    } catch (err) {
      setSlideError("Failed to save slide");
    } finally {
      setSlideLoading(false);
    }
  };
  const handleDeleteSlide = async (slideId: Id<"slides">) => {
    if (!window.confirm("Are you sure you want to delete this slide? This action cannot be undone.")) return;
    setSlideLoading(true);
    try {
      await deleteSlide({ slideId });
    } catch (err) {
      setSlideError("Failed to delete slide");
    } finally {
      setSlideLoading(false);
    }
  };

  // Content modal handlers
  const openAddContentModal = () => {
    setEditContent(null);
    setContentForm({ key: "", value: "", type: "text", isActive: true });
    setContentModalOpen(true);
  };
  const openEditContentModal = (item: ContentItem) => {
    setEditContent(item);
    setContentForm({
      key: item.key,
      value: item.value,
      type: item.type,
      isActive: item.isActive,
    });
    setContentModalOpen(true);
  };
  const closeContentModal = () => {
    setContentModalOpen(false);
    setContentError("");
  };
  const handleContentInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setContentForm((f) => ({ ...f, [name]: value }));
  };
  const handleContentSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContentForm((f) => ({ ...f, [name]: value }));
  };
  const handleContentCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setContentForm((f) => ({ ...f, [name]: checked }));
  };
  const validateContentForm = () => {
    if (!contentForm.key.trim()) {
      setContentError("Key is required");
      return false;
    }
    if (!contentForm.value.trim()) {
      setContentError("Value is required");
      return false;
    }
    return true;
  };
  const isContentFormValid = contentForm.key.trim() && contentForm.value.trim();
  const handleContentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateContentForm()) return;
    setContentLoading(true);
    setContentError("");
    try {
      if (editContent) {
        await updateContent({
          contentId: editContent._id,
          ...contentForm,
        });
      } else {
        await createContent({
          key: contentForm.key,
          value: contentForm.value,
          type: contentForm.type,
          isActive: contentForm.isActive,
        });
      }
      closeContentModal();
    } catch (err) {
      setContentError("Failed to save content");
    } finally {
      setContentLoading(false);
    }
  };
  const handleDeleteContent = async (contentId: Id<"content">) => {
    if (!window.confirm("Are you sure you want to delete this content? This action cannot be undone.")) return;
    setContentLoading(true);
    try {
      await deleteContent({ contentId });
    } catch (err) {
      setContentError("Failed to delete content");
    } finally {
      setContentLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Slides Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">🖼️ Slides</h2>
          <button
            className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:scale-105 transition"
            onClick={openAddSlideModal}
          >
            + Add Slide
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl shadow bg-card">
          <table className="min-w-full admin-table">
            <thead>
              <tr className="bg-muted">
                <th className="p-3 text-left">Image</th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Subtitle</th>
                <th className="p-3 text-left">Order</th>
                <th className="p-3 text-left">Active</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slides.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No slides found. Click "Add Slide" to create one.
                  </td>
                </tr>
              ) : (
                slides.map((slide) => (
                  <tr key={slide._id} className="border-b border-border hover:bg-muted transition">
                    <td className="p-3">
                      {slide.imageUrl ? (
                        <img
                          src={slide.imageUrl}
                          alt={slide.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          🖼️
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-medium">{slide.title}</td>
                    <td className="p-3 max-w-xs truncate">{slide.subtitle}</td>
                    <td className="p-3">{slide.order}</td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={slide.isActive}
                        readOnly
                        className="text-primary"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          className="admin-button-secondary"
                          onClick={() => openEditSlideModal(slide)}
                          title="Edit Slide"
                        >
                          Edit
                        </button>
                        <button
                          className="admin-button-secondary"
                          onClick={() => handleDeleteSlide(slide._id)}
                          title="Delete Slide"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Add/Edit Slide Modal */}
        {slideModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-card rounded-xl shadow-lg p-0 w-full max-w-lg">
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <div className="text-2xl font-bold mb-2 text-center">
                  {editSlide ? "Edit Slide" : "Add New Slide"}
                </div>
                <form onSubmit={handleSlideSubmit} className="space-y-6">
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Slide Image</label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                        {slideImagePreview ? (
                          <img
                            src={slideImagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl">🖼️</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSlideImageChange}
                          className="admin-input"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Max size: 5MB. Recommended: 800x400px
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Basic Info */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Title <span className="text-red-500">*</span></label>
                    <input
                      className="admin-input"
                      placeholder="e.g. Welcome to PlayGram!"
                      name="title"
                      value={slideForm.title}
                      onChange={handleSlideInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Subtitle</label>
                    <input
                      className="admin-input"
                      placeholder="e.g. Join our sports programs today!"
                      name="subtitle"
                      value={slideForm.subtitle}
                      onChange={handleSlideInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Order <span className="text-red-500">*</span></label>
                      <input
                        className="admin-input"
                        placeholder="e.g. 1"
                        name="order"
                        type="number"
                        min={0}
                        value={slideForm.order}
                        onChange={handleSlideInputChange}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-8">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={slideForm.isActive}
                        onChange={handleSlideCheckboxChange}
                        className="text-primary"
                      />
                      <span className="text-sm">Active</span>
                    </div>
                  </div>
                  {/* Error Message */}
                  {slideError && <div className="text-red-500 text-sm mt-2">{slideError}</div>}
                  {/* Actions */}
                  <div className="sticky bottom-0 left-0 right-0 bg-card flex justify-end gap-2 pt-4 border-t border-border -mx-6 px-6 pb-2">
                    <button type="button" className="admin-button-secondary" onClick={closeSlideModal}>Cancel</button>
                    <button type="submit" className="admin-button-primary" disabled={slideLoading || !isSlideFormValid}>
                      {slideLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Content Section */}
      <div>
        <div className="flex justify-between items-center mb-4 mt-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">📄 Static Content</h2>
          <button
            className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:scale-105 transition"
            onClick={openAddContentModal}
          >
            + Add Content
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl shadow bg-card">
          <table className="min-w-full admin-table">
            <thead>
              <tr className="bg-muted">
                <th className="p-3 text-left">Key</th>
                <th className="p-3 text-left">Value</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Active</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {content.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No content found. Click "Add Content" to create one.
                  </td>
                </tr>
              ) : (
                content.map((item) => (
                  <tr key={item._id} className="border-b border-border hover:bg-muted transition">
                    <td className="p-3 font-medium">{item.key}</td>
                    <td className="p-3 max-w-xs truncate">{item.value}</td>
                    <td className="p-3">{item.type}</td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={item.isActive}
                        readOnly
                        className="text-primary"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          className="admin-button-secondary text-primary hover:text-white"
                          onClick={() => openEditContentModal(item)}
                          title="Edit Content"
                        >
                          Edit
                        </button>
                        <button
                          className="admin-button-secondary text-primary hover:text-white"
                          onClick={() => handleDeleteContent(item._id)}
                          title="Delete Content"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Add/Edit Content Modal */}
        {contentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-card rounded-xl shadow-lg p-0 w-full max-w-lg">
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <div className="text-2xl font-bold mb-2 text-center">
                  {editContent ? "Edit Content" : "Add New Content"}
                </div>
                <form onSubmit={handleContentSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Key <span className="text-red-500">*</span></label>
                    <input
                      className="admin-input"
                      placeholder="e.g. about_us"
                      name="key"
                      value={contentForm.key}
                      onChange={handleContentInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Value <span className="text-red-500">*</span></label>
                    <textarea
                      className="admin-input"
                      placeholder="Enter the content value..."
                      name="value"
                      value={contentForm.value}
                      onChange={handleContentInputChange}
                      required
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Type</label>
                    <select
                      className="admin-input"
                      name="type"
                      value={contentForm.type}
                      onChange={handleContentSelectChange}
                    >
                      <option value="text">Text</option>
                      <option value="html">HTML</option>
                      <option value="markdown">Markdown</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={contentForm.isActive}
                      onChange={handleContentCheckboxChange}
                      className="text-primary"
                    />
                    <span className="text-sm">Active</span>
                  </div>
                  {/* Error Message */}
                  {contentError && <div className="text-red-500 text-sm mt-2">{contentError}</div>}
                  {/* Actions */}
                  <div className="sticky bottom-0 left-0 right-0 bg-card flex justify-end gap-2 pt-4 border-t border-border -mx-6 px-6 pb-2">
                    <button type="button" className="admin-button-secondary" onClick={closeContentModal}>Cancel</button>
                    <button type="submit" className="admin-button-primary" disabled={contentLoading || !isContentFormValid}>
                      {contentLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 