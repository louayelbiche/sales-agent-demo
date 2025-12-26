import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { scrapeWebsite } from "@/lib/scraper";
import { analyzeBrand } from "@/lib/claude";

// POST /api/business/[id]/analyze - Trigger website analysis
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const business = await prisma.business.findUnique({
      where: { id },
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

    // Update status to SCRAPING
    await prisma.business.update({
      where: { id },
      data: { analysisStatus: "SCRAPING" },
    });

    try {
      // Scrape website
      const scrapedData = await scrapeWebsite(business.websiteUrl);

      // Update status to ANALYZING
      await prisma.business.update({
        where: { id },
        data: {
          analysisStatus: "ANALYZING",
          scrapedData: scrapedData as unknown as Prisma.InputJsonValue,
        },
      });

      // Analyze with Claude
      const brandAnalysis = await analyzeBrand(scrapedData.combinedContent);

      // Update business with analysis results
      const updatedBusiness = await prisma.business.update({
        where: { id },
        data: {
          name: brandAnalysis.companyName || business.name,
          analysisStatus: "COMPLETED",
          brandVoice: brandAnalysis.brandVoice as unknown as Prisma.InputJsonValue,
          brandValues: brandAnalysis.brandValues,
          products: brandAnalysis.products as unknown as Prisma.InputJsonValue,
          targetAudience: brandAnalysis.targetAudience,
          analyzedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedBusiness,
      });
    } catch (analysisError) {
      // Update status to FAILED
      await prisma.business.update({
        where: { id },
        data: { analysisStatus: "FAILED" },
      });

      console.error("Analysis error:", analysisError);
      return NextResponse.json(
        {
          success: false,
          error:
            analysisError instanceof Error
              ? analysisError.message
              : "Analysis failed",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Analyze business error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze business" },
      { status: 500 }
    );
  }
}
