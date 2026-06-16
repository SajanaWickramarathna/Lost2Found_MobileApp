const sendEmail = require('../../services/Email');

const BRAND_NAME = "Lost2Found"; 

const sendVerificationEmail = async (email, verifyUrl) => {
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) return { success: true };
    
    const textContent = `You are receiving this email because you (or someone else) have requested the registration of an account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${verifyUrl}`;

    const htmlContent = `
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333333;">Welcome to ${BRAND_NAME}!</h2>
            <p style="color: #555555; font-size: 16px;">
                You are receiving this email because you registered an account.
            </p>
            <p style="color: #555555; font-size: 16px;">
                Please click on the following link to complete the process:
            </p>
            <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007BFF; color: #ffffff; text-decoration: none; border-radius: 4px; margin-top: 20px;">
                Verify Account
            </a>
            <p style="color: #999999; font-size: 12px; margin-top: 30px;">
                If you did not request this account, please ignore this email.
            </p>
        </div>
    </body>
    </html>
    `;

    await sendEmail({
        to: email,
        subject: `Account Verification - ${BRAND_NAME}`,
        text: textContent,
        html: htmlContent
    });
};

module.exports = {
    sendVerificationEmail
};
