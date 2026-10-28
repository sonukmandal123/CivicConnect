const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const SENDER_EMAIL = process.env.EMAIL_FROM || 'CivicConnect <onboarding@resend.dev>';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const FALLBACK_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'sonumandalsmve@gmail.com';

/**
 * Normalizes destination email.
 * On Resend test tier (free sandbox), sending to arbitrary mock domains (like @example.com)
 * returns a 403 error. In testing, route to the registered recipient so you can inspect alerts.
 */
function resolveDestinationEmail(targetEmail) {
  if (!targetEmail || targetEmail.endsWith('@example.com')) {
    return FALLBACK_EMAIL;
  }
  return targetEmail;
}

/**
 * Returns color-coded badge metadata matching CivicConnect design system
 */
function getStatusBadgeStyle(status) {
  switch (status) {
    case 'Submitted':
      return { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' };
    case 'Under Review':
      return { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa' };
    case 'Verified':
      return { bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' };
    case 'Assigned':
      return { bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' };
    case 'In Progress':
      return { bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
    case 'Resolved':
      return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
    case 'Rejected':
      return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
    default:
      return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
  }
}

/**
 * Base email layout wrapper with modern municipal styling
 */
function wrapHtmlLayout({ preheader, headerTitle, headerSubtitle, contentHtml }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
  <div style="display: none; max-height: 0px; overflow: hidden;">
    ${preheader || headerTitle}
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px 28px; color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #38bdf8; display: block; margin-bottom: 4px;">
                      MUNICIPAL CIVIC INTELLIGENCE
                    </span>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff;">
                      ${headerTitle}
                    </h1>
                    ${headerSubtitle ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">${headerSubtitle}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 28px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 4px 0;">CivicConnect Infrastructure Management & Real-time Citizen Engagement</p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">Automated notification sent via Resend API &bull; &copy; ${new Date().getFullYear()} CivicConnect</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 1. Admin Email: New Report Submitted Alert
 */
async function sendAdminNewReportEmail({ adminEmail, issue, citizenName }) {
  if (!resend) {
    console.warn('[EmailService] Resend API key not configured, skipping admin email.');
    return null;
  }

  const to = resolveDestinationEmail(adminEmail);
  const badge = getStatusBadgeStyle('Submitted');
  const issueUrl = `${CLIENT_URL}/admin/issues/${issue._id}`;
  const address = issue.locationAddress || issue.location?.address || 'Location coordinates registered';

  const contentHtml = `
    <div style="margin-bottom: 20px;">
      <span style="display: inline-block; padding: 4px 10px; background-color: ${badge.bg}; color: ${badge.color}; border: 1px solid ${badge.border}; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">
        New Report &bull; Pending Review
      </span>
      <h2 style="margin: 12px 0 6px 0; font-size: 18px; color: #0f172a;">
        ${issue.title}
      </h2>
      <p style="margin: 0; font-size: 14px; color: #64748b;">
        Reported by <strong>${citizenName || 'Verified Citizen'}</strong> on ${new Date().toLocaleString()}
      </p>
    </div>

    <!-- Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; font-size: 13px;">
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; width: 35%; color: #64748b;">Category</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${issue.category}</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Severity</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: ${issue.severity === 'High' ? '#dc2626' : '#0f172a'};">${issue.severity}</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Priority Score</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${issue.priorityLevel || 'Low'} (${issue.priorityScore || 0} pts)</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Location</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${address}</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; color: #64748b;">Report ID</td>
        <td style="padding: 10px 14px; font-family: monospace; font-size: 12px; color: #334155;">${issue._id}</td>
      </tr>
    </table>

    ${issue.aiConfidence ? `
    <!-- AI Vision Summary -->
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; padding: 12px 16px; margin-bottom: 20px;">
      <strong style="color: #1e40af; font-size: 13px; display: block; margin-bottom: 4px;">AI Vision Inspection</strong>
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #1e3a8a;">
        Detected: <strong>${issue.aiIssueType || issue.category}</strong> (${issue.aiConfidence}% confidence)
      </p>
      ${issue.aiExplanation ? `<p style="margin: 0; font-size: 12px; color: #3b82f6;">${issue.aiExplanation}</p>` : ''}
    </div>
    ` : ''}

    <!-- Description -->
    <div style="margin-bottom: 24px;">
      <strong style="font-size: 13px; color: #334155; display: block; margin-bottom: 6px;">Citizen Statement:</strong>
      <p style="margin: 0; padding: 12px 14px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; color: #334155; line-height: 1.6;">
        ${issue.description}
      </p>
    </div>

    ${issue.imageUrl ? `
    <!-- Photo Preview -->
    <div style="margin-bottom: 24px;">
      <strong style="font-size: 13px; color: #334155; display: block; margin-bottom: 6px;">Uploaded Photographic Evidence:</strong>
      <img src="${issue.imageUrl}" alt="Citizen Evidence" style="width: 100%; max-height: 280px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;" />
    </div>
    ` : ''}

    <!-- CTA Button -->
    <div style="text-align: center; margin-top: 28px;">
      <a href="${issueUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 6px; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);">
        Review in Admin Command Center &rarr;
      </a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [to],
      subject: `[CivicConnect Alert] New Civic Report: ${issue.title} (${issue.category})`,
      html: wrapHtmlLayout({
        preheader: `New ${issue.severity} severity ${issue.category} report awaiting administrative review.`,
        headerTitle: 'CivicConnect Administration',
        headerSubtitle: 'New Civic Defect Registered in Verification Queue',
        contentHtml
      })
    });
    console.log(`[EmailService] Admin alert sent to ${to}. ID:`, result.data?.id);
    return result;
  } catch (error) {
    console.error('[EmailService] Failed to send admin new report email:', error.message);
    return null;
  }
}

/**
 * 2. Citizen Email: Submission Receipt
 */
async function sendCitizenSubmissionEmail({ citizenEmail, citizenName, issue }) {
  if (!resend) {
    console.warn('[EmailService] Resend API key not configured, skipping citizen submission email.');
    return null;
  }

  const to = resolveDestinationEmail(citizenEmail);
  const badge = getStatusBadgeStyle('Submitted');
  const issueUrl = `${CLIENT_URL}/issues/${issue._id}`;
  const address = issue.locationAddress || issue.location?.address || 'Location registered';

  const contentHtml = `
    <div style="margin-bottom: 20px;">
      <span style="display: inline-block; padding: 4px 10px; background-color: ${badge.bg}; color: ${badge.color}; border: 1px solid ${badge.border}; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
        Report Registered
      </span>
      <h2 style="margin: 12px 0 6px 0; font-size: 18px; color: #0f172a;">
        Thank you for reporting, ${citizenName}!
      </h2>
      <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">
        Your civic report <strong>"${issue.title}"</strong> has been successfully received by municipal dispatch. It has been queued for verification and prioritization.
      </p>
    </div>

    <!-- Tracking Card -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; margin-bottom: 4px;">
        Tracking Reference ID
      </div>
      <div style="font-family: monospace; font-size: 16px; font-weight: 700; color: #2563eb; margin-bottom: 12px;">
        #${issue._id}
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Category:</td>
          <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${issue.category}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Initial Priority:</td>
          <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${issue.priorityLevel || 'Low'}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Location:</td>
          <td style="padding: 4px 0; color: #0f172a;">${address}</td>
        </tr>
      </table>
    </div>

    <!-- What happens next -->
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 8px;">Next Steps:</strong>
      <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6;">
        <li>Municipal officers will conduct an automated and manual defect verification.</li>
        <li>Once verified, your report will be assigned to the designated municipal department.</li>
        <li>You will receive real-time email and in-app notifications at every milestone.</li>
      </ol>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin-top: 24px;">
      <a href="${issueUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 6px;">
        Track Report Progress &rarr;
      </a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [to],
      subject: `[CivicConnect] Report Received: ${issue.title} [Ref: #${issue._id.toString().slice(-6)}]`,
      html: wrapHtmlLayout({
        preheader: `Your civic report "${issue.title}" has been registered in the municipal database.`,
        headerTitle: 'CivicConnect Confirmation',
        headerSubtitle: 'Report Submitted & Tracking Reference Issued',
        contentHtml
      })
    });
    console.log(`[EmailService] Citizen submission email sent to ${to}. ID:`, result.data?.id);
    return result;
  } catch (error) {
    console.error('[EmailService] Failed to send citizen submission email:', error.message);
    return null;
  }
}

/**
 * 3. Citizen Email: Status Progression (Under Review, Verified, Assigned, In Progress, Resolved, Rejected)
 */
async function sendCitizenStatusUpdateEmail({
  citizenEmail,
  citizenName,
  issue,
  newStatus,
  remarks,
  department,
  resolutionDescription,
  resolutionImageUrl
}) {
  if (!resend) {
    console.warn('[EmailService] Resend API key not configured, skipping status update email.');
    return null;
  }

  const to = resolveDestinationEmail(citizenEmail);
  const badge = getStatusBadgeStyle(newStatus);
  const issueUrl = `${CLIENT_URL}/issues/${issue._id}`;

  let statusExplanation = '';
  switch (newStatus) {
    case 'Under Review':
      statusExplanation = 'A municipal officer is currently reviewing your report and initiating physical verification.';
      break;
    case 'Verified':
      statusExplanation = 'Your report has been verified as an authentic civic defect and approved for department dispatch.';
      break;
    case 'Assigned':
      statusExplanation = `Your report has been assigned to the <strong>${department || issue.assignedDepartment || 'Municipal Operations'}</strong> department for work scheduling.`;
      break;
    case 'In Progress':
      statusExplanation = 'A field maintenance team has been mobilized and repair work is actively underway.';
      break;
    case 'Resolved':
      statusExplanation = 'Field maintenance work on this issue is complete! You can inspect the repair photograph below and confirm resolution.';
      break;
    case 'Rejected':
      statusExplanation = 'Your report was reviewed and marked as rejected by municipal authorities. Please see the remark details below.';
      break;
    default:
      statusExplanation = `The status of your civic report has transitioned to ${newStatus}.`;
  }

  const contentHtml = `
    <div style="margin-bottom: 20px;">
      <span style="display: inline-block; padding: 5px 12px; background-color: ${badge.bg}; color: ${badge.color}; border: 1px solid ${badge.border}; border-radius: 9999px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">
        Status: ${newStatus}
      </span>
      <h2 style="margin: 12px 0 6px 0; font-size: 18px; color: #0f172a;">
        Update on your report: ${issue.title}
      </h2>
      <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">
        Hello <strong>${citizenName}</strong>, ${statusExplanation}
      </p>
    </div>

    <!-- Status Overview Table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; font-size: 13px;">
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 35%;">Report Title</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${issue.title}</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Current Status</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: ${badge.color};">${newStatus}</td>
      </tr>
      ${department || issue.assignedDepartment ? `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Assigned Department</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${department || issue.assignedDepartment}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 10px 14px; color: #64748b;">Reference ID</td>
        <td style="padding: 10px 14px; font-family: monospace; font-size: 12px; color: #334155;">#${issue._id}</td>
      </tr>
    </table>

    ${remarks ? `
    <!-- Remarks Box -->
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; padding: 14px 16px; margin-bottom: 20px;">
      <strong style="color: #1e40af; font-size: 13px; display: block; margin-bottom: 4px;">Administrator Note:</strong>
      <p style="margin: 0; font-size: 13px; color: #1e3a8a; line-height: 1.5;">${remarks}</p>
    </div>
    ` : ''}

    ${newStatus === 'Resolved' && (resolutionDescription || issue.resolutionDescription) ? `
    <!-- Resolution Details -->
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <strong style="color: #15803d; font-size: 14px; display: block; margin-bottom: 6px;">Work Completion Summary:</strong>
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #166534; line-height: 1.5;">
        ${resolutionDescription || issue.resolutionDescription}
      </p>
      ${resolutionImageUrl || issue.resolutionImageUrl ? `
      <strong style="color: #15803d; font-size: 13px; display: block; margin-bottom: 6px;">Post-Repair Verification Photograph:</strong>
      <img src="${resolutionImageUrl || issue.resolutionImageUrl}" alt="Repair Verification" style="width: 100%; max-height: 280px; object-fit: cover; border-radius: 6px; border: 1px solid #86efac;" />
      ` : ''}
    </div>
    ` : ''}

    <!-- CTA Button -->
    <div style="text-align: center; margin-top: 24px;">
      <a href="${issueUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 6px; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);">
        ${newStatus === 'Resolved' ? 'Confirm Resolution in Portal' : 'View Full Report & Timeline'} &rarr;
      </a>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [to],
      subject: `[CivicConnect] Status Update: ${issue.title} is now ${newStatus}`,
      html: wrapHtmlLayout({
        preheader: `Your report "${issue.title}" status has changed to ${newStatus}.`,
        headerTitle: 'CivicConnect Status Notification',
        headerSubtitle: `Milestone Update &bull; Current Status: ${newStatus}`,
        contentHtml
      })
    });
    console.log(`[EmailService] Citizen status update email sent to ${to}. ID:`, result.data?.id);
    return result;
  } catch (error) {
    console.error('[EmailService] Failed to send citizen status update email:', error.message);
    return null;
  }
}

module.exports = {
  sendAdminNewReportEmail,
  sendCitizenSubmissionEmail,
  sendCitizenStatusUpdateEmail
};
