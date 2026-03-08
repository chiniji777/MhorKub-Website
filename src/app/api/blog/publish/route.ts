import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/blog/publish
 *
 * Secured endpoint for Marketing Platform to publish blog posts.
 * Supports upsert: creates new post or updates existing by slug.
 *
 * Headers: Authorization: Bearer <BLOG_API_SECRET>
 * Body: { title, slug, excerpt, content, coverImage, author }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.BLOG_API_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, slug, content } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "title, slug, and content are required" },
        { status: 400 }
      );
    }

    // Check if post with this slug already exists
    const [existing] = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    if (existing) {
      // Update existing post
      const [updated] = await db
        .update(posts)
        .set({
          title,
          content,
          excerpt: body.excerpt || existing.excerpt,
          coverImage: body.coverImage || existing.coverImage,
          author: body.author || existing.author,
          published: true,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, existing.id))
        .returning();

      return NextResponse.json({
        action: "updated",
        post: updated,
        url: `https://mhorkub.com/blog/${updated.slug}`,
      });
    } else {
      // Create new post
      const [newPost] = await db
        .insert(posts)
        .values({
          title,
          slug,
          excerpt: body.excerpt || null,
          content,
          coverImage: body.coverImage || null,
          author: body.author || "MhorKub Team",
          published: true,
        })
        .returning();

      return NextResponse.json(
        {
          action: "created",
          post: newPost,
          url: `https://mhorkub.com/blog/${newPost.slug}`,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Blog publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish blog post" },
      { status: 500 }
    );
  }
}
