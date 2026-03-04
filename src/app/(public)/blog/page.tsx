import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";

export const revalidate = 60;

async function getPosts() {
  try {
    return await db
      .select()
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt));
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const allPosts = await getPosts();

  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">บทความ</h1>
          <p className="mt-4 text-lg text-muted">
            ข่าวสาร เทคนิค และอัพเดทจากทีม MhorKub
          </p>
        </div>

        {allPosts.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-lg text-muted">ยังไม่มีบทความ กำลังจะมาเร็วๆ นี้ค่ะ</p>
          </div>
        ) : (
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {allPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group rounded-2xl border border-border/50 bg-white p-6 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
              >
                {post.coverImage && (
                  <div className="mb-4 aspect-video overflow-hidden rounded-xl bg-primary/5">
                    <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Calendar size={14} />
                  {new Date(post.createdAt).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <h2 className="mt-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-3">{post.excerpt}</p>
                )}
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                  อ่านต่อ <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
