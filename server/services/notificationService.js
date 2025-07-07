const twilio = require('twilio');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../../database.sqlite');

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Initialize email transporter
const emailTransporter = nodemailer.createTransporter({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send SMS notification
async function sendSMS(phoneNumber, message) {
  if (!twilioClient) {
    console.log('📱 SMS Simulation:', phoneNumber, message);
    return { success: true, simulated: true };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log('📱 SMS sent:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('SMS error:', error);
    return { success: false, error: error.message };
  }
}

// Send email notification
async function sendEmail(to, subject, text, html) {
  if (!process.env.EMAIL_USER) {
    console.log('📧 Email Simulation:', to, subject, text);
    return { success: true, simulated: true };
  }

  try {
    const result = await emailTransporter.sendMail({
      from: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER,
      to,
      subject,
      text,
      html
    });

    console.log('📧 Email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
}

// Save notification to database
function saveNotification(type, recipient, message, status = 'pending') {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    db.run(
      'INSERT INTO notifications (type, recipient, message, status) VALUES (?, ?, ?, ?)',
      [type, recipient, message, status],
      function(err) {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

// Update notification status
function updateNotificationStatus(id, status, sentAt = new Date()) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    db.run(
      'UPDATE notifications SET status = ?, sent_at = ? WHERE id = ?',
      [status, sentAt.toISOString(), id],
      function(err) {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      }
    );
  });
}

// Send queue position notification
async function notifyQueuePosition(phoneNumber, email, customerName, position, estimatedTime) {
  const smsMessage = `Hola ${customerName}! Tu posición en la cola es #${position}. Tiempo estimado: ${estimatedTime} minutos. Estación Central Premium`;
  const emailSubject = 'Posición en Cola - Estación Central Premium';
  const emailText = `Estimado/a ${customerName},\n\nTu posición actual en la cola es #${position}.\nTiempo estimado de espera: ${estimatedTime} minutos.\n\nGracias por elegir Estación Central Premium.`;

  try {
    // Save notifications
    const smsNotificationId = await saveNotification('sms', phoneNumber, smsMessage);
    const emailNotificationId = await saveNotification('email', email, emailText);

    // Send SMS
    const smsResult = await sendSMS(phoneNumber, smsMessage);
    await updateNotificationStatus(smsNotificationId, smsResult.success ? 'sent' : 'failed');

    // Send Email
    const emailResult = await sendEmail(email, emailSubject, emailText);
    await updateNotificationStatus(emailNotificationId, emailResult.success ? 'sent' : 'failed');

    return { sms: smsResult, email: emailResult };
  } catch (error) {
    console.error('Notification error:', error);
    return { error: error.message };
  }
}

// Send turn notification
async function notifyTurn(phoneNumber, email, customerName, pumpNumber) {
  const smsMessage = `¡Es tu turno ${customerName}! Dirígete a la bomba #${pumpNumber}. Estación Central Premium`;
  const emailSubject = 'Es tu turno - Estación Central Premium';
  const emailText = `Estimado/a ${customerName},\n\n¡Es tu turno! Por favor dirígete a la bomba #${pumpNumber}.\n\nGracias por tu paciencia.`;

  try {
    const smsNotificationId = await saveNotification('sms', phoneNumber, smsMessage);
    const emailNotificationId = await saveNotification('email', email, emailText);

    const smsResult = await sendSMS(phoneNumber, smsMessage);
    await updateNotificationStatus(smsNotificationId, smsResult.success ? 'sent' : 'failed');

    const emailResult = await sendEmail(email, emailSubject, emailText);
    await updateNotificationStatus(emailNotificationId, emailResult.success ? 'sent' : 'failed');

    return { sms: smsResult, email: emailResult };
  } catch (error) {
    console.error('Turn notification error:', error);
    return { error: error.message };
  }
}

// Send reservation confirmation
async function notifyReservationConfirmation(phoneNumber, email, customerName, reservationTime, totalAmount) {
  const formattedTime = new Date(reservationTime).toLocaleString();
  const smsMessage = `Reserva confirmada ${customerName}! Fecha: ${formattedTime}. Total: $${totalAmount}. Estación Central Premium`;
  const emailSubject = 'Reserva Confirmada - Estación Central Premium';
  const emailText = `Estimado/a ${customerName},\n\nTu reserva ha sido confirmada:\nFecha y hora: ${formattedTime}\nMonto total: $${totalAmount}\n\nTe esperamos!`;

  try {
    const smsNotificationId = await saveNotification('sms', phoneNumber, smsMessage);
    const emailNotificationId = await saveNotification('email', email, emailText);

    const smsResult = await sendSMS(phoneNumber, smsMessage);
    await updateNotificationStatus(smsNotificationId, smsResult.success ? 'sent' : 'failed');

    const emailResult = await sendEmail(email, emailSubject, emailText);
    await updateNotificationStatus(emailNotificationId, emailResult.success ? 'sent' : 'failed');

    return { sms: smsResult, email: emailResult };
  } catch (error) {
    console.error('Reservation notification error:', error);
    return { error: error.message };
  }
}

module.exports = {
  sendSMS,
  sendEmail,
  notifyQueuePosition,
  notifyTurn,
  notifyReservationConfirmation,
  saveNotification,
  updateNotificationStatus
};