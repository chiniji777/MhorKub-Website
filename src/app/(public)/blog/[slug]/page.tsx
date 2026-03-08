import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";
import type { Metadata } from "next";

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

// ── Dynamic SEO Metadata ──────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || !post.published) {
    return { title: "ไม่พบบทความ" };
  }

  const title = post.title;
  const description =
    post.excerpt || post.content.slice(0, 160).replace(/\n/g, " ");
  const url = `https://mhorkub.com/blog/${post.slug}`;

  return {
    title: `${title} — MhorKub Blog`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author || "MhorKub Team"],
      ...(post.coverImage && {
        images: [
          {
            url: post.coverImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(post.coverImage && { images: [post.coverImage] }),
    },
  };
}

// ── Content Rendering ─────────────────────────────────────────

function renderContent(content: string) {
  return content.split("\n\n").map((paragraph, i) => {
    if (paragraph.startsWith("## ")) {
      return (
        <h2
          key={i}
          className="mt-8 mb-4 text-2xl font-bold text-foreground"
        >
          {paragraph.slice(3)}
        </h2>
      );
    }
    if (paragraph.startsWith("### ")) {
      return (
        <h3
          key={i}
          className="mt-6 mb-3 text-xl font-semibold text-foreground"
        >
          {paragraph.slice(4)}
        </h3>
      );
    }
    return (
      <p key={i} className="mb-4 text-base leading-relaxed text-muted">
        {paragraph}
      </p>
    );
  });
}

// ── Page Component ────────────────────────────────────────────

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || !post.published) {
    notFound();
  }

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description:
      post.excerpt || post.content.slice(0, 160).replace(/\n/g, " "),
    image: post.coverImage || undefined,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author || "MhorKub Team",
    },
    publisher: {
      "@type": "Organization",
      name: "MhorKub",
      url: "https://mhorkub.com",
      logo: {
        "@type": "ImageObject",
        url: "https://mhorkub.com/icon.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://mhorkub.com/blog/${post.slug}`,
    },
  };

  return (
    <div className="py-20 sm:py-28">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} />
          กลับไปบทความทั้งหมด
        </Link>

        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          {post.title}
        </h1>

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
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full object-cover"
            />
          </div>
        )}

        <div className="mt-10">{renderContent(post.content)}</div>
      </article>
    </div>
  );
}
