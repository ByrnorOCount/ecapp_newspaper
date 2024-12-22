import nodemailer from 'nodemailer';

export default {
    generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },

    async sendOtpEmail(email, otp) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: 'no-reply@enewspaper.com',
            to: email,
            subject: 'Password Reset OTP',
            html: `<p>Your OTP for resetting your password is:</p>
                   <h1>${otp}</h1>
                   <p>This OTP is valid for 10 minutes.</p>`,
        };

        await transporter.sendMail(mailOptions);
    },
};
