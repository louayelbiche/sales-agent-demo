import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

const createCampaignSchema = z.object({
  businessId: z.string().min(1, "Business ID is required"),
  name: z.string().min(1, "Campaign name is required"),
  purpose: z.string().min(10, "Purpose must be at least 10 characters"),
  targetDesc: z.string().min(10, "Target description must be at least 10 characters"),
});

// GET /api/campaigns - List user's campaigns
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    const where: { userId: string; businessId?: string } = { userId: session.id };
    if (businessId) {
      where.businessId = businessId;
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        business: {
          select: { name: true, websiteUrl: true },
        },
        _count: {
          select: { emails: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("List campaigns error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list campaigns" },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const { businessId, name, purpose, targetDesc } = createCampaignSchema.parse(body);

    // Verify business belongs to user and is analyzed
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 }
      );
    }

    if (business.userId !== session.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    if (business.analysisStatus !== "COMPLETED") {
      return NextResponse.json(
        { success: false, error: "Business must be analyzed first" },
        { status: 422 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        userId: session.id,
        businessId,
        name,
        purpose,
        targetDesc,
        status: "DRAFT",
      },
    });

    return NextResponse.json({
      success: true,
      data: campaign,
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
    console.error("Create campaign error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
