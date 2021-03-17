const nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.HOST_GMAIL,
    port: process.env.PORT_GMAIL,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.USER_GMAIL, // generated ethereal user
      pass: process.env.PASS_GMAIL, // generated ethereal password
    },
});

transporter.verify().then(() => {
    console.log('Ready for send emails')
})

module.exports = transporter;