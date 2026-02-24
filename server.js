require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();

app.use(cors());
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

/* VALIDATION FUNCTION */

function validateData(data) {
  const { name, email, phone } = data;

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

/* HEALTH CHECK */

app.get("/", (req, res) => {
  res.send("SRS Transport Backend Running 🚛");
});

/* SEND QUOTE */

app.post("/send-quote", async (req, res) => {
  try {
    const error = validateData(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    const { name, email, phone, service, pickup, drop } = req.body;

    /* Email to Owner */

    await resend.emails.send({
      from: "SRS Transport <onboarding@resend.dev>",
      to: process.env.EMAIL_USER,
      subject: "New Quote Request - SRS Transport",
      html: `
        <h2>New Transport Quote Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Service:</strong> ${service}</p>
        <p><strong>Pickup:</strong> ${pickup}</p>
        <p><strong>Drop:</strong> ${drop}</p>
      `
    });

    /* Confirmation to Customer */

    await resend.emails.send({
      from: "SRS Transport <onboarding@resend.dev>",
      to: email,
      subject: "We Received Your Quote Request",
      html: `
        <h2>Thank You ${name}!</h2>
        <p>We have received your transport quote request.</p>
        <p>Our team will contact you shortly.</p>
        <br/>
        <strong>SRS Transport</strong>
      `
    });

    res.status(200).json({ message: "Quote request sent successfully" });

  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});