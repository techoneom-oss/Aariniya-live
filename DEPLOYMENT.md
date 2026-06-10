# Aariniya Wellness Platform - Step-by-Step Deployment Guide

This guide is designed for developers or store owners with **zero prior web development or deployment experience**. Follow these steps in sequence to launch your application live on the internet!

---

## 🏗️ Architecture Overview

Your application consists of two parts:
1. **Frontend (Vercel)**: The user interface that customers interact with in their browsers.
2. **Backend (Render)**: The server that handles databases, checkout logic, and order receipts.
3. **GitHub**: The bridge. We push our code here, and Vercel/Render will automatically fetch it and deploy it.

---

## 📋 Prerequisites
Before starting, ensure you have:
* A [GitHub Account](https://github.com/)
* A [Vercel Account](https://vercel.com/)
* A [Render Account](https://render.com/)
* A [Razorpay Account](https://razorpay.com/) (Live or Test mode keys)
* **Git** installed on your computer. If not, download and install it from [git-scm.com](https://git-scm.com/).

---

## 🛠️ Step 1: Push Your Code to GitHub

GitHub is where we store our project code online.

1. **Open the Project Folder** in your command prompt (Terminal or PowerShell).
2. **Initialize Git**:
   ```bash
   git init
   ```
3. **Add all files to staging**:
   ```bash
   git add .
   ```
4. **Commit the files**:
   ```bash
   git commit -m "feat: ready for production deployment"
   ```
5. **Create a new repository on GitHub**:
   * Go to [github.com/new](https://github.com/new).
   * Name your repository `aariniya`.
   * Keep it **Private** or **Public** (Public is fine, but private is safer for databases).
   * Do **NOT** initialize with a README, gitignore, or license.
   * Click **Create repository**.
6. **Connect your local folder to GitHub**:
   * Under the section "or push an existing repository from the command line", copy the commands. They will look like this:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/aariniya.git
   git push -u origin main
   ```
   * Paste and run them in your command prompt. Your code is now safely on GitHub!

---

## 🛡️ Step 2: Deploy Your Backend to Render

Render will host your Express Node.js server.

1. **Log in to Render** at [dashboard.render.com](https://dashboard.render.com/).
2. **Connect GitHub**: Go to Account Settings -> Git Integrations, and make sure your GitHub account is linked.
3. **Create a Web Service**:
   * Click the **New +** button on the top right.
   * Select **Web Service**.
   * Choose **Build and deploy from a Git repository**.
   * Select your `aariniya` repository.
4. **Configure the Web Service**:
   * **Name**: `aariniya-backend`
   * **Region**: Choose the one closest to you (e.g., Singapore/Mumbai or Oregon).
   * **Branch**: `main`
   * **Root Directory**: `backend` (⚠️ Very Important!)
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`
   * **Instance Type**: Select the **Free** tier.
5. **Add Environment Variables**:
   * Scroll down and click **Advanced** -> **Add Environment Variable**.
   * Add the following variables:
     * `PORT` = `5000`
     * `JWT_SECRET` = `[Write a long, random secure sentence]`
     * `RAZORPAY_KEY_ID` = `[Copy this from your Razorpay Dashboard]`
     * `RAZORPAY_KEY_SECRET` = `[Copy this from your Razorpay Dashboard]`
6. Click **Create Web Service** at the bottom.
   * Render will begin building your server. This might take 3–5 minutes.
   * Once finished, you will see a live link at the top (e.g., `https://aariniya-backend.onrender.com`). **Copy this link!**

---

## 🌐 Step 3: Deploy Your Frontend to Vercel

Vercel will host your fast React user interface.

1. **Log in to Vercel** at [vercel.com](https://vercel.com/).
2. **Create a New Project**:
   * Click **Add New** -> **Project**.
   * Select the `aariniya` repository from your GitHub list.
3. **Configure the Project Settings**:
   * **Framework Preset**: `Vite` (Vercel detects this automatically).
   * **Root Directory**: Click "Edit" and choose `frontend`. (⚠️ Very Important!)
4. **Add Environment Variables**:
   * Expand the **Environment Variables** section.
   * Add:
     * Key: `VITE_API_URL`
     * Value: `[Paste your Render URL here, e.g. https://aariniya-backend.onrender.com]` (Do NOT put a trailing slash `/` at the end).
5. **Deploy**:
   * Click **Deploy**.
   * Vercel will build your website in less than 1 minute.
   * Once finished, Vercel will provide you with your public website link (e.g., `https://aariniya.vercel.app`)!

---

## 💳 Step 4: Activating Real Payments (Razorpay)

By default, when you put your real Razorpay keys in the Render environment variables, the system switches from simulated checkout to the real gateway.

1. **Get Razorpay Keys**:
   * Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/).
   * On the bottom-left menu, click **Account & Settings** -> **API Keys**.
   * Click **Generate Key** (make sure you are in "Live Mode" if you want real payments, or "Test Mode" for mock checkout).
   * Copy the **Key ID** and **Key Secret**.
2. **Paste Keys in Render**:
   * Go to your `aariniya-backend` dashboard on Render.
   * Click **Environment**.
   * Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` with your new values.
   * Click **Save Changes**. Render will redeploy automatically.

---

## 💾 Step 5: Database Persistence Note
SQLite uses a local file `aariniya.db`. Since Render Free Tier servers restart/reset periodically, any new orders or accounts will reset. 
* **If you want permanent storage**: Render offers a PostgreSQL database service (trial or paid tiers).
* Once you set up a database in Render, you can let me know, and I will write a script to move the code from SQLite to PostgreSQL with a single connection string (`DATABASE_URL`).
