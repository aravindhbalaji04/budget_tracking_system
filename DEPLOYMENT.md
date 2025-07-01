# 🚀 Deployment Guide: Budget Tracker Pro

## Quick Setup (5 minutes)

### Step 1: Setup Supabase Database

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up/login with GitHub
   - Create new project

2. **Setup Database**
   - In your Supabase dashboard, go to SQL Editor
   - Copy and paste the entire content from `database-schema.sql`
   - Run the SQL script

3. **Get Your Keys**
   - Go to Settings → API
   - Copy your Project URL and anon public key

### Step 2: Deploy to Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Deploy Your App**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy (run in your project folder)
   vercel
   ```
   
   OR use GitHub integration:
   - Push your code to GitHub
   - Connect GitHub repo to Vercel
   - Auto-deploy on every push

3. **Set Environment Variables in Vercel**
   - In Vercel dashboard → Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL`: Your Supabase URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
     - `VITE_OPENAI_API_KEY`: Your OpenAI API key (optional)

### Step 4: Setup AI Chatbot (Optional)

1. **Get OpenAI API Key** (for advanced AI features)
   - Go to [platform.openai.com](https://platform.openai.com)
   - Create account → API Keys → Create new key
   - Copy your API key

2. **Add to Environment Variables**
   - In Vercel: Add `VITE_OPENAI_API_KEY`
   - Or in local `.env`: `VITE_OPENAI_API_KEY=your_key`

**Note**: Chatbot works without OpenAI - it has built-in local AI responses!

### Step 3: Update Database Configuration

Copy `.env.example` to `.env` and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Alternative Hosting Options

### Option 1: Netlify + Supabase
1. Connect GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify

### Option 2: GitHub Pages (Static only)
1. Enable GitHub Pages in repo settings
2. Use GitHub Actions for auto-deployment
3. Note: Limited to localStorage (no cloud database)

### Option 3: Railway + Supabase
1. Connect GitHub repo to Railway
2. Auto-deploys on every push
3. Built-in environment variable management

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Domain Setup (Optional)

1. **Buy Domain** (Namecheap, GoDaddy, etc.)
2. **Setup Custom Domain in Vercel**
   - Vercel Dashboard → Domains
   - Add your domain
   - Update DNS records as instructed

## 📱 Progressive Web App (Optional)

To make it installable on phones:

1. Add to `index.html`:
```html
<link rel="manifest" href="/manifest.json">
```

2. Create `manifest.json`:
```json
{
  "name": "Budget Tracker Pro",
  "short_name": "Budget Tracker",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#667eea",
  "theme_color": "#764ba2",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## 🔐 Security Notes

- Environment variables are automatically secure in Vercel
- Supabase handles all authentication and security
- Row Level Security (RLS) ensures users only see their data
- All data is encrypted in transit and at rest

## 📊 Analytics (Optional)

Add Google Analytics or Vercel Analytics:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

## 🚀 Your Live App

After deployment, your app will be live at:
- **Vercel**: `https://your-app-name.vercel.app`
- **Custom domain**: `https://yourdomain.com`

## 💡 Pro Tips

1. **Auto-deployment**: Push to GitHub = instant deployment
2. **Branch previews**: Create branches for features, get preview URLs
3. **Monitoring**: Use Vercel Analytics for performance insights
4. **Backups**: Supabase automatically backs up your database
5. **Scaling**: Both Vercel and Supabase scale automatically

## 🆘 Troubleshooting

**Build fails?**
- Check environment variables are set
- Ensure all dependencies are in package.json

**Database connection issues?**
- Verify Supabase URL and key
- Check RLS policies are enabled

**App not loading?**
- Check browser console for errors
- Verify environment variables in production

---

🎉 **Congratulations!** Your budget tracker is now live on the internet with a real database!
