import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";

export const revalidate = 60;

async function getPost(slug: string) {
  try {
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);
    return post;
  } catch {
    return null;
  }
}

function renderContent(content: string) {
  return content.split("\n\n").map((paragraph, i) => {
    if (paragraph.startsWith("## ")) {
      return <h2 key={i} className="mt-8 mb-4 text-2xl font-bold text-foreground">{paragraph.slice(3)}</h2>;
    }
    if (paragraph.startsWith("### ")) {
      return <h3 key={i} className="mt-6 mb-3 text-xl font-semibold text-foreground">{paragraph.slice(4)}</h3>;
    }
    return <p key={i} className="mb-4 text-base leading-relaxed text-muted">{paragraph}</p>;
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || !post.published) {
    notFound();
  }

  return (
    <div className="py-20 sm:py-28">
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          กลับไปบทความทั้งหมด
        </Link>

        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{post.title}</h1>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <User size={14} />
            {post.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            {new Date(post.createdAt).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {post.coverImage && (
          <div className="mt-8 overflow-hidden rounded-2xl">
            <img src={post.coverImage} alt={post.title} className="w-full object-cover" />
          </div>
        )}

        <div className="mt-10">{renderContent(post.content)}</div>
      </article>
    </div>
  );
}
