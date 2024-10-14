import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service:"Gmail",
    auth:{
        user:process.env.SMTP_MAIL,
        pass:process.env.SMTP_PASSWORD,
    }
});

export const sendEmail = async(to:string,subject:string,text:string) =>{
    const mailOptions = {
        from:process.env.SMTP_MAIL,
        to,
        subject,
        text,
    }

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
}