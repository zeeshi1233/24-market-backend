import nodeMailer from "nodemailer";

const sendEmail = async (options) => {
    const transporter = nodeMailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMPT_MAIL,
            pass: process.env.SMPT_APP_PASS,
        },
        
    });

    const mailOptions = {
        from: process.env.SMPT_MAIL,
        to: options.to,
        subject: options.subject,
        html: options.message,
    };

    await transporter.sendMail(mailOptions);
};

export default sendEmail;