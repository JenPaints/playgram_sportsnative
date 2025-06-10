import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import React from "react";
import { Id } from "../../convex/_generated/dataModel";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

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
    setSlideModalOpen(true);
  };
  const closeSlideModal = () => {
    setSlideModalOpen(false);
    setSlideError("");
  };
  const handleSlideChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setSlideForm((f) => ({ ...f, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setSlideForm((f) => ({ ...f, [name]: value }));
    }
  };
  const handleSlideSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSlideLoading(true);
    setSlideError("");
    try {
      if (editSlide) {
        await updateSlide({
          slideId: editSlide._id,
          ...slideForm,
          order: Number(slideForm.order),
        });
      } else {
        await createSlide({
          ...slideForm,
          order: Number(slideForm.order),
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
    if (!window.confirm("Delete this slide?")) return;
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
  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setContentForm((f) => ({ ...f, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setContentForm((f) => ({ ...f, [name]: value }));
    }
  };
  const handleContentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setContentLoading(true);
    setContentError("");
    try {
      if (editContent) {
        await updateContent({
          contentId: editContent._id,
          ...contentForm,
        });
      } else {
        await createContent({ ...contentForm });
      }
      closeContentModal();
    } catch (err) {
      setContentError("Failed to save content");
    } finally {
      setContentLoading(false);
    }
  };
  const handleDeleteContent = async (contentId: Id<"content">) => {
    if (!window.confirm("Delete this content?")) return;
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
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">📰 Home Slides</h2>
          <button
            className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:scale-105 transition"
            onClick={openAddSlideModal}
          >
            + Add Slide
          </button>
        </div>
        <div className="overflow-x-auto">
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Image</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Subtitle</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {slides.map((slide) => (
                  <TableRow key={slide._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <TableCell>
                      {slide.imageUrl ? (
                        <img src={slide.imageUrl} alt={slide.title} className="w-20 h-12 object-cover rounded" />
                      ) : (
                        <span className="text-gray-500">No image</span>
                      )}
                    </TableCell>
                    <TableCell className="text-white font-semibold">{slide.title}</TableCell>
                    <TableCell className="text-gray-300">{slide.subtitle}</TableCell>
                    <TableCell className="text-white">{slide.order}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${slide.isActive ? "bg-green-700 text-green-300" : "bg-gray-700 text-gray-400"}`}>
                        {slide.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="p-3 flex gap-2">
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => openEditSlideModal(slide)}
                      >Edit</Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleDeleteSlide(slide._id)}
                      >Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {slides.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">No slides found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        {/* Modal for Add/Edit Slide */}
        {slideModalOpen && (
          <Dialog open={slideModalOpen} onClose={closeSlideModal}>
            <DialogTitle>
              {editSlide ? "Edit Slide" : "Add Slide"}
            </DialogTitle>
            <DialogContent>
              {slideError && <div className="text-red-400 text-sm mb-2">{slideError}</div>}
              <form onSubmit={handleSlideSubmit}>
                <div>
                  <label className="block text-gray-300 mb-1">Title</label>
                  <TextField name="title" value={slideForm.title} onChange={handleSlideChange} required />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Subtitle</label>
                  <TextField name="subtitle" value={slideForm.subtitle} onChange={handleSlideChange} />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Image URL</label>
                  <TextField name="imageUrl" value={slideForm.imageUrl} onChange={handleSlideChange} />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Order</label>
                  <TextField name="order" type="number" value={slideForm.order} onChange={handleSlideChange} required />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox name="isActive" checked={slideForm.isActive} onChange={handleSlideChange} />
                  <label className="text-gray-300">Active</label>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    type="submit"
                    disabled={slideLoading}
                  >
                    {slideLoading ? "Saving..." : "Save"}
                  </Button>
                  <Button onClick={closeSlideModal}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Content Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">📰 Dynamic Content</h2>
          <button
            className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:scale-105 transition"
            onClick={openAddContentModal}
          >
            + Add Content
          </button>
        </div>
        <div className="overflow-x-auto">
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Key</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {content.map((item) => (
                  <TableRow key={item._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <TableCell className="text-white font-semibold">{item.key}</TableCell>
                    <TableCell className="text-gray-300 max-w-xs truncate">{item.value}</TableCell>
                    <TableCell className="text-white">{item.type}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${item.isActive ? "bg-green-700 text-green-300" : "bg-gray-700 text-gray-400"}`}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="p-3 flex gap-2">
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => openEditContentModal(item)}
                      >Edit</Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleDeleteContent(item._id)}
                      >Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {content.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">No content found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        {/* Modal for Add/Edit Content */}
        {contentModalOpen && (
          <Dialog open={contentModalOpen} onClose={closeContentModal}>
            <DialogTitle>
              {editContent ? "Edit Content" : "Add Content"}
            </DialogTitle>
            <DialogContent>
              {contentError && <div className="text-red-400 text-sm mb-2">{contentError}</div>}
              <form onSubmit={handleContentSubmit}>
                <div>
                  <label className="block text-gray-300 mb-1">Key</label>
                  <TextField name="key" value={contentForm.key} onChange={handleContentChange} required />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Value</label>
                  <TextField name="value" value={contentForm.value} onChange={handleContentChange} required />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1">Type</label>
                  <Select name="type" value={contentForm.type} onChange={handleContentChange}>
                    <MenuItem value="text">Text</MenuItem>
                    <MenuItem value="html">HTML</MenuItem>
                    <MenuItem value="markdown">Markdown</MenuItem>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox name="isActive" checked={contentForm.isActive} onChange={handleContentChange} />
                  <label className="text-gray-300">Active</label>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    type="submit"
                    disabled={contentLoading}
                  >
                    {contentLoading ? "Saving..." : "Save"}
                  </Button>
                  <Button onClick={closeContentModal}>Cancel</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
} 