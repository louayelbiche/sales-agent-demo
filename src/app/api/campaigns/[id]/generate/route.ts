import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { generateRecipients, generateEmail, type BrandAnalysisResult } from "@/lib/claude";

// POST /api/campaigns/[id]/generate - Generate emails for campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.userId !== session.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    if (campaign.business.analysisStatus !== "COMPLETED") {
      return NextResponse.json(
        { success: false, error: "Business must be analyzed first" },
        { status: 422 }
      );
    }

    // Update status to GENERATING
    await prisma.campaign.update({
      where: { id },
      data: { status: "GENERATING" },
    });

    try {
      // Build brand analysis from stored data
      const brandAnalysis: BrandAnalysisResult = {
        companyName: campaign.business.name,
        brandVoice: campaign.business.brandVoice as BrandAnalysisResult["brandVoice"],
        brandValues: campaign.business.brandValues,
        products: (campaign.business.products as BrandAnalysisResult["products"]) || [],
        targetAudience: campaign.business.targetAudience || "",
        confidence: 0.8,
      };

      // Generate simulated recipients
      const recipients = await generateRecipients(
        campaign.targetDesc,
        brandAnalysis,
        8
      );

      // Delete existing emails for this campaign
      await prisma.generatedEmail.deleteMany({
        where: { campaignId: id },
      });

      // Generate email for each recipient
      const emails = [];
      for (const recipient of recipients) {
        const emailContent = await generateEmail(
          recipient,
          brandAnalysis,
          campaign.purpose
        );

        const email = await prisma.generatedEmail.create({
          data: {
            campaignId: id,
            recipientName: recipient.name,
            recipientEmail: recipient.email,
            recipientRole: recipient.role,
            recipientCompany: recipient.company,
            leadTemperature: recipient.leadTemperature,
            personalizationHooks: recipient.personalizationHooks as Record<string, unknown>,
            subject: emailContent.subject,
            bodyHtml: emailContent.bodyHtml,
            bodyText: emailContent.bodyText,
            status: "PREVIEW",
          },
        });

        emails.push(email);
      }

      // Update campaign status to READY
      await prisma.campaign.update({
        where: { id },
        data: { status: "READY" },
      });

      return NextResponse.json({
        success: true,
        data: {
          emailCount: emails.length,
          emails,
        },
      });
    } catch (generationError) {
      // Revert status to DRAFT on failure
      await prisma.campaign.update({
        where: { id },
        data: { status: "DRAFT" },
      });

      console.error("Generation error:", generationError);
      return NextResponse.json(
        {
          success: false,
          error:
            generationError instanceof Error
              ? generationError.message
              : "Email generation failed",
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
    console.error("Generate emails error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate emails" },
      { status: 500 }
    );
  }
}
