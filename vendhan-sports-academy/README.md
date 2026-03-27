# Vendhan Sports Academy Website

A full-stack web application for managing a sports academy, featuring a React frontend, an Express backend, and a local SQLite database.

## 🚀 Features

- **Dynamic Content Management:** Manage programs, coaches, events, and gallery items via an Admin Dashboard.
- **Real-time Sports News:** Worldwide sports news ticker and announcements.
- **Camp Registrations:** Integrated registration system for seasonal camps.
- **Local SQLite Database:** All data is stored locally in `academy.db` for fast and reliable access.
- **Responsive Design:** Fully optimized for mobile, tablet, and desktop.
- **Admin Panel:** Secure dashboard for academy administrators to manage content and view registrations.
- **Firebase Authentication:** Secure login for administrators.

---

## 🛠️ Project Structure

- `/src`: Frontend React application.
  - `/src/App.tsx`: Main application logic and UI components.
  - `/src/index.css`: Global styles and Tailwind CSS configuration.
- `/server.ts`: Express backend server.
- `/db.ts`: SQLite database initialization and seeding logic.
- `/academy.db`: The local SQLite database file (generated on first run).
- `/public`: Static assets like logos, posters, and images.

---

## 📝 How to Change Content

### 1. Changing the Logo
- Place your new logo image in the `/public` folder.
- Open `src/App.tsx`.
- Search for the `Navbar` component and update the `src` attribute of the `<img>` tag to point to your new file (e.g., `/my-logo.png`).

### 2. Adding Posters/Images/Videos
- **Posters/Images:** Add them to the `/public` folder. You can then reference them in the Admin Panel by their path (e.g., `/posters/summer-camp.jpg`).
- **Videos:** It's recommended to host videos on YouTube or Vimeo and use their embed links. If you want to host them locally, place them in `/public/videos` and use the `<video>` tag in your components.

### 3. Modifying the Database Schema
- Open `db.ts`.
- Update the `CREATE TABLE` statements in the `initDb` function.
- Remember to update the corresponding API endpoints in `server.ts` and data fetching logic in `src/App.tsx`.

---

## 🏃 How to Run Locally

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

---

## 🌐 Deployment

### Deploying to Vercel / Render / Railway

Since this app uses a local SQLite database, you need a hosting provider that supports **persistent storage** or use a cloud database (like Supabase or MongoDB) if you want to scale. For simple deployments:

1. **Render/Railway:** These platforms support persistent disks. Attach a disk to your service and point the `academy.db` path to that disk.
2. **Vercel:** Vercel is primarily for serverless functions. SQLite will work but the database will reset on every deployment. For Vercel, it's better to switch to a cloud database.

### GitHub Actions Deployment (`.github/workflows/deploy.yml`)

Create a file at `.github/workflows/deploy.yml` with the following content to automate your deployment:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/checkout@v3
        with:
          node-version: '18'

      - name: Install Dependencies
        run: npm install

      - name: Build Project
        run: npm run build

      - name: Deploy
        # Add your deployment command here (e.g., vercel --prod, railway up, etc.)
        run: echo "Deploying to production..."
```

---

## 📁 Where to Add Files

- **Images/Posters:** `/public/images/`
- **Logos:** `/public/`
- **Videos:** `/public/videos/`
- **Data:** Managed through the Admin Panel or directly in `academy.db`.

---

## 💡 Tips
- **Admin Access:** Only the email `vendhanftpwatch@gmail.com` has admin privileges by default.
- **Seeding:** If you delete `academy.db`, the app will recreate it with default data on the next start.
