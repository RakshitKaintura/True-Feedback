import { resend } from "@/lib/resend";
import VerificationEmail from "../../emails/VerificationEmail";
import { ApiResponse } from "@/types/ApiResponse";

export async function sendVerificationEmail (
    email:string,
    username:string,
    verifyCode:string
):Promise<ApiResponse>{
    try {
        await resend.emails.send({
            from:"onboarding@resend.dev",
            to:email,
            subject:"Analysis message | Verification code ",
            react: VerificationEmail({username,otp :verifyCode}),
        });
        return {success:true,message:"Verification email sent successfully"};
    } catch (emailError) {
        console.error("Error sending verification email",emailError);

        // ── DEV MODE FALLBACK ──────────────────────────────────────────
        // Resend's free sandbox only delivers to the Resend account owner's
        // email. In development, we log the OTP to the server console so
        // you can still test without a custom domain.
        // Remove this block once you add a verified domain on resend.com.
        if (process.env.NODE_ENV === "development") {
            console.log("─────────────────────────────────────────");
            console.log(`[DEV] OTP for ${username} (${email}): ${verifyCode}`);
            console.log("─────────────────────────────────────────");
            return {success:true, message:"[DEV] Verification code logged to server console"};
        }
        // ───────────────────────────────────────────────────────────────

        return {success:false,message:"Failed to send verification email"}
    }
}