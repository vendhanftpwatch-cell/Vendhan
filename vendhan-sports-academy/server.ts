import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db";
import multer from "multer";
import mammoth from "mammoth";
import fs from "fs";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ dest: 'uploads/' });

// Email configuration - Gmail SMTP with App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'vendhaninfotechodc@gmail.com',
    pass: 'qros jprh tetj ftun'
  }
});

// Test email connection
transporter.verify((error, success) => {
  if (error) {
    console.log('Email service error:', error);
  } else {
    console.log('Email service ready:', success);
  }
});

// Function to send admin notification email
async function sendAdminNotification(registrationData: any) {
  try {
    const adminEmail = 'vendhaninfotechodc@gmail.com';
    const { parentName, childName, age, email, phone, program, registrationType, type } = registrationData;
    
    const subject = `New Registration: ${parentName}`;
    const htmlContent = `
      <h2>New Registration Received</h2>
      <p><strong>Type:</strong> ${type === 'program' ? 'Program Enrollment' : 'Event Registration'}</p>
      <p><strong>Parent/Applicant Name:</strong> ${parentName}</p>
      ${childName ? `<p><strong>Child Name:</strong> ${childName}</p>` : ''}
      ${age ? `<p><strong>Age:</strong> ${age}</p>` : ''}
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      ${program ? `<p><strong>Program:</strong> ${program}</p>` : ''}
      ${registrationType ? `<p><strong>Registration Type:</strong> ${registrationType}</p>` : ''}
      <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
    `;

    await transporter.sendMail({
      from: 'vendhaninfotechodc@gmail.com',
      to: adminEmail,
      subject: subject,
      html: htmlContent
    });
    console.log('Admin notification email sent');
  } catch (error) {
    console.error('Error sending admin email:', error);
  }
}

// Function to send confirmation email to user
async function sendUserConfirmation(email: string, name: string) {
  try {
    const htmlContent = `
      <h2>Welcome to VENDHAN Sports Academy</h2>
      <p>Dear ${name},</p>
      <p>Thank you for your interest in VENDHAN Sports Academy! We have received your registration/application.</p>
      <p>Our team will review your submission and contact you shortly with more details.</p>
      <p><strong>Contact Information:</strong></p>
      <ul>
        <li>Email: vendhansportsacademy@gmail.com</li>
        <li>Academy: VENDHAN Sports Academy, Oddanchathram, Tamilnadu</li>
      </ul>
      <p>Best regards,<br/>VENDHAN Sports Academy Team</p>
    `;

    await transporter.sendMail({
      from: 'vendhaninfotechodc@gmail.com',
      to: email,
      subject: 'Thank you for registering with VENDHAN Sports Academy',
      html: htmlContent
    });
    console.log('User confirmation email sent to:', email);
  } catch (error) {
    console.error('Error sending user confirmation email:', error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // File processing endpoint
  app.post("/api/process-file", upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const filePath = req.file.path;
      let text = '';

      if (req.file.originalname.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ path: filePath });
        text = result.value;
      } else if (req.file.originalname.endsWith('.txt')) {
        text = fs.readFileSync(filePath, 'utf8');
      } else {
        return res.status(400).json({ error: 'Unsupported file format. Please upload .txt or .docx' });
      }

      // Cleanup
      fs.unlinkSync(filePath);
      res.json({ text });
    } catch (err) {
      res.status(500).json({ error: 'Error processing file' });
    }
  });

  // Image upload endpoint
  app.post("/api/upload-image", upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    // In a real app, we'd move this to a public folder
    const targetPath = path.join(__dirname, 'public', 'uploads', req.file.filename);
    if (!fs.existsSync(path.join(__dirname, 'public', 'uploads'))) {
      fs.mkdirSync(path.join(__dirname, 'public', 'uploads'), { recursive: true });
    }
    fs.renameSync(req.file.path, targetPath);
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // STATIC FILE SERVING: Serves images from uploads directory
  // Logo: /uploads/academy logo.png
  // Gallery images: /uploads/public/images/
  // Program images: stored in database, served via upload endpoint
  // Camp posters: stored in database, served via upload endpoint
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Generic CRUD helper for simple tables
  const setupCRUD = (tableName: string, fields: string[]) => {
    app.get(`/api/${tableName}`, (req, res) => {
      const items = db.prepare(`SELECT * FROM ${tableName}`).all();
      res.json(items);
    });

    app.post(`/api/${tableName}`, (req, res) => {
      const placeholders = fields.map(() => '?').join(', ');
      const values = fields.map(f => req.body[f]);
      const result = db.prepare(`INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`).run(...values);
      res.json({ id: result.lastInsertRowid });
    });

    app.put(`/api/${tableName}/:id`, (req, res) => {
      const setClause = fields.map(f => `${f} = ?`).join(', ');
      const values = fields.map(f => req.body[f]);
      db.prepare(`UPDATE ${tableName} SET ${setClause} WHERE id = ?`).run(...values, req.params.id);
      res.json({ success: true });
    });

    app.delete(`/api/${tableName}/:id`, (req, res) => {
      db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(req.params.id);
      res.json({ success: true });
    });
  };

  setupCRUD('facilities', ['name', 'description', 'image']);
  setupCRUD('awards', ['title', 'description', 'image', 'date']);
  setupCRUD('tournaments', ['title', 'description', 'image', 'date', 'location']);

  // API Routes
  app.get("/api/academy-info", (req, res) => {
    const info = db.prepare('SELECT * FROM academy_info WHERE id = 1').get();
    res.json(info);
  });

  app.put("/api/academy-info", (req, res) => {
    const { name, established, location, motto, students, coaches, programs } = req.body;
    db.prepare(`
      UPDATE academy_info 
      SET name = ?, established = ?, location = ?, motto = ?, students = ?, coaches = ?, programs = ? 
      WHERE id = 1
    `).run(name, established, location, motto, students, coaches, programs);
    res.json({ success: true });
  });

  app.get("/api/announcements", (req, res) => {
    const announcements = db.prepare('SELECT * FROM announcements ORDER BY id DESC').all();
    res.json(announcements);
  });

  app.post("/api/announcements", (req, res) => {
    const { title, content, date, type } = req.body;
    const result = db.prepare('INSERT INTO announcements (title, content, date, type) VALUES (?, ?, ?, ?)').run(title, content, date, type);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/announcements/:id", (req, res) => {
    const { title, content, date, type } = req.body;
    db.prepare('UPDATE announcements SET title = ?, content = ?, date = ?, type = ? WHERE id = ?').run(title, content, date, type, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/announcements/:id", (req, res) => {
    db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/sports-news", (req, res) => {
    const news = db.prepare('SELECT * FROM sports_news').all();
    res.json(news);
  });

  app.post("/api/sports-news", (req, res) => {
    const { title, date, category } = req.body;
    const result = db.prepare('INSERT INTO sports_news (title, date, category) VALUES (?, ?, ?)').run(title, date, category);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/sports-news/:id", (req, res) => {
    const { title, date, category } = req.body;
    db.prepare('UPDATE sports_news SET title = ?, date = ?, category = ? WHERE id = ?').run(title, date, category, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/sports-news/:id", (req, res) => {
    db.prepare('DELETE FROM sports_news WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/programs", (req, res) => {
    const programs = db.prepare('SELECT * FROM programs').all();
    res.json(programs);
  });

  app.post("/api/programs", (req, res) => {
    const { title, description, schedule, image, icon } = req.body;
    const result = db.prepare('INSERT INTO programs (title, description, schedule, image, icon) VALUES (?, ?, ?, ?, ?)').run(title, description, schedule, image, icon);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/programs/:id", (req, res) => {
    const { title, description, schedule, image, icon } = req.body;
    db.prepare('UPDATE programs SET title = ?, description = ?, schedule = ?, image = ?, icon = ? WHERE id = ?').run(title, description, schedule, image, icon, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/programs/:id", (req, res) => {
    db.prepare('DELETE FROM programs WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/coaches", (req, res) => {
    const coaches = db.prepare('SELECT * FROM coaches').all();
    const formatted = coaches.map((c: any) => ({
      ...c,
      achievements: JSON.parse(c.achievements || '[]'),
      certificates: JSON.parse(c.certificates || '[]')
    }));
    res.json(formatted);
  });

  app.post("/api/coaches", (req, res) => {
    const { name, role, bio, image, achievements, certificates } = req.body;
    const result = db.prepare('INSERT INTO coaches (name, role, bio, image, achievements, certificates) VALUES (?, ?, ?, ?, ?, ?)').run(
      name, role, bio, image, JSON.stringify(achievements), JSON.stringify(certificates)
    );
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/coaches/:id", (req, res) => {
    const { name, role, bio, image, achievements, certificates } = req.body;
    db.prepare('UPDATE coaches SET name = ?, role = ?, bio = ?, image = ?, achievements = ?, certificates = ? WHERE id = ?').run(
      name, role, bio, image, JSON.stringify(achievements), JSON.stringify(certificates), req.params.id
    );
    res.json({ success: true });
  });

  app.delete("/api/coaches/:id", (req, res) => {
    db.prepare('DELETE FROM coaches WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/events", (req, res) => {
    const events = db.prepare('SELECT * FROM events').all();
    res.json(events);
  });

  app.post("/api/events", (req, res) => {
    const { title, date, time, location, description, image, category } = req.body;
    const result = db.prepare('INSERT INTO events (title, date, time, location, description, image, category) VALUES (?, ?, ?, ?, ?, ?, ?)').run(title, date, time, location, description, image, category);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/events/:id", (req, res) => {
    const { title, date, time, location, description, image, category } = req.body;
    db.prepare('UPDATE events SET title = ?, date = ?, time = ?, location = ?, description = ?, image = ?, category = ? WHERE id = ?').run(title, date, time, location, description, image, category, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/events/:id", (req, res) => {
    db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/gallery", (req, res) => {
    // GALLERY API: Returns gallery items from database + automatic images from uploads/public/images/
    // Database items: Manually added via admin panel
    // File images: Automatically included from /uploads/public/images/ directory
    // Supported formats: jpg, jpeg, png, gif, webp
    const gallery = db.prepare('SELECT * FROM gallery').all();
    
    // Add images from uploads/public/images directory
    const imagesDir = path.join(__dirname, 'uploads', 'public', 'images');
    let fileImages = [];
    if (fs.existsSync(imagesDir)) {
      const files = fs.readdirSync(imagesDir);
      fileImages = files
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(file => ({
          id: `file_${file}`,
          url: `/uploads/public/images/${file}`,
          category: 'Gallery'
        }));
    }
    
    res.json([...gallery, ...fileImages]);
  });

  app.post("/api/gallery", (req, res) => {
    const { title, image, category, date } = req.body;
    const result = db.prepare('INSERT INTO gallery (title, image, category, date) VALUES (?, ?, ?, ?)').run(title, image, category, date);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/gallery/:id", (req, res) => {
    const { title, image, category, date } = req.body;
    db.prepare('UPDATE gallery SET title = ?, image = ?, category = ?, date = ? WHERE id = ?').run(title, image, category, date, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/gallery/:id", (req, res) => {
    db.prepare('DELETE FROM gallery WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/camps", (req, res) => {
    const camps = db.prepare('SELECT * FROM camps').all();
    const formatted = camps.map((c: any) => ({
      ...c,
      activities: JSON.parse(c.activities || '[]')
    }));
    res.json(formatted);
  });

  app.post("/api/camps", (req, res) => {
    const { title, type, startDate, endDate, details, posterUrl, fullPrice, weeklyPrice, activities } = req.body;
    const result = db.prepare('INSERT INTO camps (title, type, startDate, endDate, details, posterUrl, fullPrice, weeklyPrice, activities) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      title, type, startDate, endDate, details, posterUrl, fullPrice, weeklyPrice, JSON.stringify(activities)
    );
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/camps/:id", (req, res) => {
    const { title, type, startDate, endDate, details, posterUrl, fullPrice, weeklyPrice, activities } = req.body;
    db.prepare('UPDATE camps SET title = ?, type = ?, startDate = ?, endDate = ?, details = ?, posterUrl = ?, fullPrice = ?, weeklyPrice = ?, activities = ? WHERE id = ?').run(
      title, type, startDate, endDate, details, posterUrl, fullPrice, weeklyPrice, JSON.stringify(activities), req.params.id
    );
    res.json({ success: true });
  });

  app.delete("/api/camps/:id", (req, res) => {
    db.prepare('DELETE FROM camps WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/registrations", (req, res) => {
    const registrations = db.prepare('SELECT * FROM registrations ORDER BY createdAt DESC').all();
    res.json(registrations);
  });

  app.post("/api/registrations", (req, res) => {
    const { type, targetId, parentName, childName, age, email, phone, registrationType, program } = req.body;
    const createdAt = new Date().toISOString();
    try {
      const result = db.prepare(`
        INSERT INTO registrations (type, targetId, parentName, childName, age, email, phone, registrationType, program, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(type, targetId, parentName, childName, age, email, phone, registrationType, program, createdAt);
      
      // Send emails asynchronously
      const registrationData = { type, targetId, parentName, childName, age, email, phone, registrationType, program };
      sendAdminNotification(registrationData).catch(err => console.error('Admin email error:', err));
      sendUserConfirmation(email, parentName).catch(err => console.error('User email error:', err));
      
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  app.delete("/api/registrations/:id", (req, res) => {
    db.prepare('DELETE FROM registrations WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
