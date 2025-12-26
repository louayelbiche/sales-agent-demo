import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { sendEmail } from "@/lib/resend";

// POST /api/campaigns/[id]/emails/[emailId]/send - Send email to user's inbox
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; emailId: string }> }
) {
  try {
    const session = await requireSession();
    const { id, emailId } = await params;

    // Get the campaign and email
    const campaign = await prisma.campaign.findUnique({
      where: { id },
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

    const email = await prisma.generatedEmail.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email not found" },
        { status: 404 }
      );
    }

    if (email.campaignId !== id) {
      return NextResponse.json(
        { success: false, error: "Email does not belong to this campaign" },
        { status: 400 }
      );
    }

    // Get user's email from session
    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Update email status to SENDING
    await prisma.generatedEmail.update({
      where: { id: emailId },
      data: { status: "SENDING" },
    });

    try {
      // Send the email to the user's inbox (not the simulated recipient)
      const result = await sendEmail({
        to: user.email,
        subject: `[Demo] ${email.subject}`,
        html: `
          <div style="background: #f3f4f6; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>Demo Preview</strong> - This email was generated for: ${email.recipientName} (${email.recipientEmail})
            </p>
          </div>
          ${email.bodyHtml}
        `,
        text: `[Demo Preview - Generated for: ${email.recipientName}]\n\n${email.bodyText}`,
      });

      // Update email status to SENT
      await prisma.generatedEmail.update({
        where: { id: emailId },
        data: {
          status: "SENT",
          sentAt: new Date(),
          resendId: result?.id || null,
        },
      });

      // Update campaign status if this is the first send
      if (campaign.status !== "SENT") {
        await prisma.campaign.update({
          where: { id },
          data: { status: "SENT" },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          sentTo: user.email,
          resendId: result?.id,
        },
      });
    } catch (sendError) {
      // Update email status to FAILED
      await prisma.generatedEmail.update({
        where: { id: emailId },
        data: { status: "FAILED" },
      });

      console.error("Send error:", sendError);
      return NextResponse.json(
        {
          success: false,
          error:
            sendError instanceof Error
              ? sendError.message
              : "Failed to send email",
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
    console.error("Send email error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
