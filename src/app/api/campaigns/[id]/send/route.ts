import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { sendEmail } from "@/lib/resend";

// POST /api/campaigns/[id]/send - Send all campaign emails combined in one email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    // Get the campaign with all emails
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        business: true,
        emails: {
          orderBy: { createdAt: "asc" },
        },
      },
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

    if (campaign.emails.length === 0) {
      return NextResponse.json(
        { success: false, error: "No emails generated for this campaign" },
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

    // Build combined HTML with all emails
    const emailsHtml = campaign.emails
      .map(
        (email, index) => `
        <div style="margin-bottom: 40px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 16px 20px; margin: -24px -24px 20px -24px; border-radius: 12px 12px 0 0;">
            <span style="color: #ffffff; font-size: 14px; font-weight: 600;">Email ${index + 1} of ${campaign.emails.length}</span>
          </div>

          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 4px 0; color: #6b7280; width: 100px;">To:</td>
                <td style="padding: 4px 0; color: #1f2937; font-weight: 500;">${email.recipientName} &lt;${email.recipientEmail}&gt;</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #6b7280;">Company:</td>
                <td style="padding: 4px 0; color: #1f2937;">${email.recipientCompany}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #6b7280;">Role:</td>
                <td style="padding: 4px 0; color: #1f2937;">${email.recipientRole}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #6b7280;">Lead Temp:</td>
                <td style="padding: 4px 0;">
                  <span style="background: ${email.leadTemperature === 'HOT' ? '#fef2f2' : email.leadTemperature === 'WARM' ? '#fef9c3' : '#f0fdf4'}; color: ${email.leadTemperature === 'HOT' ? '#dc2626' : email.leadTemperature === 'WARM' ? '#ca8a04' : '#16a34a'}; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                    ${email.leadTemperature}
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 16px;">
            <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Subject Line</div>
            <div style="color: #1f2937; font-size: 16px; font-weight: 600;">${email.subject}</div>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Email Body</div>
            <div style="color: #374151; line-height: 1.6;">
              ${email.bodyHtml}
            </div>
          </div>
        </div>
      `
      )
      .join("");

    const combinedHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #f3f4f6; padding: 32px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1f2937; font-size: 24px; margin: 0 0 8px 0;">Your Generated Sales Emails</h1>
          <p style="color: #6b7280; font-size: 16px; margin: 0;">Campaign: ${campaign.name}</p>
          <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">Brand: ${campaign.business.name}</p>
        </div>

        <div style="background: #dbeafe; border: 1px solid #93c5fd; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            <strong>Demo Preview</strong> — These ${campaign.emails.length} personalized emails were generated based on your brand voice and campaign target. Each email is tailored to the recipient's specific situation.
          </p>
        </div>

        ${emailsHtml}

        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #d1d5db;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Generated by Sales Agent Demo • Powered by RunWell Systems
          </p>
        </div>
      </div>
    `;

    const combinedText = campaign.emails
      .map(
        (email, index) =>
          `--- Email ${index + 1} of ${campaign.emails.length} ---
To: ${email.recipientName} <${email.recipientEmail}>
Company: ${email.recipientCompany}
Role: ${email.recipientRole}
Lead Temperature: ${email.leadTemperature}

Subject: ${email.subject}

${email.bodyText}

`
      )
      .join("\n");

    try {
      // Send the combined email
      const result = await sendEmail({
        to: user.email,
        subject: `[Demo] ${campaign.emails.length} Generated Emails - ${campaign.name}`,
        html: combinedHtml,
        text: `Your Generated Sales Emails\nCampaign: ${campaign.name}\n\n${combinedText}`,
      });

      // Update all emails status to SENT
      await prisma.generatedEmail.updateMany({
        where: { campaignId: id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });

      // Update campaign status
      await prisma.campaign.update({
        where: { id },
        data: { status: "SENT" },
      });

      return NextResponse.json({
        success: true,
        data: {
          sentTo: user.email,
          emailCount: campaign.emails.length,
          resendId: result?.id,
        },
      });
    } catch (sendError) {
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
    console.error("Send campaign emails error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send emails" },
      { status: 500 }
    );
  }
}
