if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
const nodemailer = require("nodemailer");
import { Injectable, HttpException } from '@nestjs/common';


@Injectable()
export class InHouseService {
    async sendGmail(params: IEmailParams): Promise<any> {
        const { to, subject, body, from, password } = params;
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: { user: from, pass: password },
        });
        let mailOptions = { from, to, subject, text: body, html: body };

        const sendMailPromise = new Promise(async (resolve, reject) => {
            await transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log('Error:', error);
                    reject(error);
                } else {
                    console.log(`Message sent: ${info.messageId}`);
                    resolve(`Message sent: ${info.messageId}`);
                }
            });
        });

        try {
            const output = await sendMailPromise;
            return output;
        } catch (error) {
            console.log('Error:', error);
            throw new HttpException(`Failed to send email the error is ${error}`, 500);
        }
    }
}




interface IEmailParams {
    to: string;
    subject: string;
    body: string;
    from: string;
    password: string;
}
