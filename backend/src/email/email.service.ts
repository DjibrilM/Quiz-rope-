import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendPasswordReset(to: string, resetLink: string): Promise<void> {
    const templatePath = path.join(
      __dirname,
      '../../email-templates/password_reset_email.html',
    );

    let html: string;
    try {
      html = fs.readFileSync(templatePath, 'utf8');
    } catch {
      html = `<p>Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`;
      this.logger.warn('Password reset email template not found, using fallback');
    }

    html = html
      .replace(/%LINK%/g, resetLink)
      .replace(/%EMAIL%/g, to)
      .replace(/%APP_NAME%/g, 'QuizRope');

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || '"QuizRope" <noreply@quizrope.app>',
      to,
      subject: 'Reset your QuizRope password',
      html,
    });

    this.logger.log(`Password reset email sent to ${to}`);
  }
}
