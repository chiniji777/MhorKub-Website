"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  author: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch("/api/admin/posts");
      if (res.ok) {
        setPosts(await res.json());
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(id: number) {
    if (!confirm("ลบบทความนี้?")) return;
    try {
      await fetch("/api/admin/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // handle error
    }
  }

  function handleEdit(post: Post) {
    setEditingPost(post);
    setShowEditor(true);
  }

  function handleNew() {
    setEditingPost(null);
    setShowEditor(true);
  }

  async function handleSave(data: Partial<Post>) {
    try {
      const isNew = !editingPost;
      const res = await fetch("/api/admin/posts", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isNew ? data : { ...data, id: editingPost!.id }),
      });

      if (res.ok) {
        setShowEditor(false);
        setEditingPost(null);
        fetchPosts();
      }
    } catch {
      // handle error
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-muted">กำลังโหลด...</div>;
  }

  if (showEditor) {
    return (
      <PostEditor
        post={editingPost}
        onSave={handleSave}
        onCancel={() => { setShowEditor(false); setEditingPost(null); }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog Posts</h1>
          <p className="mt-1 text-sm text-muted">{posts.length} บทความ</p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          <Plus size={16} />
          สร้างบทความ
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="mt-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted/40" />
          <p className="mt-3 text-muted">ยังไม่มีบทความ</p>
          <button
            onClick={handleNew}
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            สร้างบทความแรก
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{post.title}</h3>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    post.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  )}>
                    {post.published ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                  <span>/{post.slug}</span>
                  <span>{post.author}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString("th-TH")}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(post)}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-background hover:text-primary"
                  title="แก้ไข"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => deletePost(post.id)}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                  title="ลบ"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostEditor({
  post,
  onSave,
  onCancel,
}: {
  post: Post | null;
  onSave: (data: Partial<Post>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [content, setContent] = useState(post?.content || "");
  const [coverImage, setCoverImage] = useState(post?.coverImage || "");
  const [author, setAuthor] = useState(post?.author || "MhorKub Team");
  const [published, setPublished] = useState(post?.published || false);
  const [saving, setSaving] = useState(false);

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({ title, slug, excerpt, content, coverImage, author, published });
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {post ? "แก้ไขบทความ" : "สร้างบทความใหม่"}
        </h1>
        <button onClick={onCancel} className="text-sm text-muted hover:text-foreground">
          ยกเลิก
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">หัวข้อ</label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!post) setSlug(generateSlug(e.target.value));
            }}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">ผู้เขียน</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Cover Image URL</label>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">สรุปย่อ</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">เนื้อหา</label>
          <p className="mb-2 text-xs text-muted">ใช้ ## สำหรับหัวข้อ, ### สำหรับหัวข้อย่อย, แยกย่อหน้าด้วยบรรทัดว่าง</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={15}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="published" className="flex items-center gap-1.5 text-sm text-foreground">
            {published ? <Eye size={14} /> : <EyeOff size={14} />}
            {published ? "เผยแพร่" : "Draft"}
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-background"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}
