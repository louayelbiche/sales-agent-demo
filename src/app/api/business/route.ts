import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getWebsitePreview } from "@/lib/scraper";

const createBusinessSchema = z.object({
  websiteUrl: z.string().url("Invalid URL"),
  name: z.string().min(1, "Name is required").optional(),
});

// GET /api/business - List user's businesses
export async function GET() {
  try {
    const session = await requireSession();

    const businesses = await prisma.business.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: businesses,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("List businesses error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list businesses" },
      { status: 500 }
    );
  }
}

// POST /api/business - Create a new business
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const { websiteUrl, name } = createBusinessSchema.parse(body);

    // Get website preview to extract name if not provided
    let businessName = name;
    if (!businessName) {
      const preview = await getWebsitePreview(websiteUrl);
      businessName = preview?.title || new URL(websiteUrl).hostname;
    }

    const business = await prisma.business.create({
      data: {
        userId: session.id,
        websiteUrl,
        name: businessName,
        analysisStatus: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      data: business,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Create business error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create business" },
      { status: 500 }
    );
  }
}
