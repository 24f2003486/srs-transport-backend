require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

/* MIDDLEWARE */

app.use(cors());
app.use(express.json());

/* EMAIL TRANSPORTER */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* VALIDATION FUNCTION*/

function validateData(data) {
  const { name, email, phone, service, pickup, drop } = data;

  if (!name || name.length < 3) {
    return "Invalid name";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return "Invalid email";
  }

  const phonePattern = /^[0-9]{10}$/;
  if (!phonePattern.test(phone)) {
    return "Invalid phone number";
  }


  return null;
}

/* ROUTE: SEND QUOTE*/

app.post("/send-quote", async (req, res) => {

  try {
    const error = validateData(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const { name, email, phone, service, pickup, drop } = req.body;

    /* -------- Email to Owner -------- */

    const ownerMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Owner receives
      subject: "New Quote Request - SRS Transport",
      html: `
        <h2>New Transport Quote Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Pickup:</strong> ${pickup}</p>
        <p><strong>Drop:</strong> ${drop}</p>
        <hr/>
        <p>This message was sent from SRS Transport website.</p>
      `,
    };

    await transporter.sendMail(ownerMailOptions);


    const customerMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "We Received Your Quote Request - SRS Transport",
      html: `
        <h2>Thank You ${name}!</h2>
        <p>We have received your transport quote request.</p>
        <p>Our team will contact you shortly.</p>
        <br/>
        <p><strong>SRS Transport</strong></p>
      `,
    };

    await transporter.sendMail(customerMailOptions);

    res.status(200).json({ message: "Quote request sent successfully" });

  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/* START SERVER*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});