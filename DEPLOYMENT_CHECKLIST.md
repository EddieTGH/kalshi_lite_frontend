# Vercel Deployment Checklist

Use this checklist to ensure your deployment is ready for production.

## Pre-Deployment Checklist

### 1. Code Quality
- [ ] All TypeScript errors fixed (`npm run typecheck`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] App runs correctly in production mode (`npm run start`)
- [ ] No console errors in browser
- [ ] Mobile responsiveness tested on various screen sizes

### 2. Environment Variables
- [ ] `.env.example` file created and committed
- [ ] `.env.local` added to `.gitignore`
- [ ] Production API URL ready (e.g., `https://api.yourapp.com/api`)
- [ ] Backend API is accessible from public internet (not localhost)

### 3. Git Repository
- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] Repository is accessible (public or connected to Vercel)
- [ ] `.gitignore` properly configured
- [ ] No sensitive data committed (passwords, API keys)

### 4. Backend API
- [ ] Backend deployed and running
- [ ] Backend API URL is HTTPS (required for production)
- [ ] CORS configured to accept requests from Vercel domain
- [ ] All endpoints tested and working
- [ ] Database connected and accessible

## Vercel Deployment Steps

### Option A: Vercel Dashboard

1. **Import Project**
   - [ ] Go to [vercel.com](https://vercel.com)
   - [ ] Click "Add New..." → "Project"
   - [ ] Select your repository
   - [ ] Click "Import"

2. **Configure Project**
   - [ ] Framework Preset: **Next.js** (auto-detected)
   - [ ] Root Directory: `./` (default)
   - [ ] Build Command: `npm run build` (auto-detected)
   - [ ] Output Directory: `.next` (auto-detected)
   - [ ] Install Command: `npm install` (auto-detected)

3. **Add Environment Variables**
   - [ ] Click "Environment Variables"
   - [ ] Add: `NEXT_PUBLIC_API_BASE_URL`
   - [ ] Value: Your production backend URL
   - [ ] Environment: **All** (Production, Preview, Development)

4. **Deploy**
   - [ ] Click "Deploy"
   - [ ] Wait for build to complete
   - [ ] Check deployment logs for errors

### Option B: Vercel CLI

1. **Install CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy Preview**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_API_BASE_URL
   ```
   - Select: **All** environments
   - Enter: Your production backend URL

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Post-Deployment Checklist

### 1. Verify Deployment
- [ ] Visit the Vercel URL provided
- [ ] Login page loads correctly
- [ ] Colors match design (orange, green, beige)
- [ ] No 404 errors in browser console
- [ ] No CORS errors in browser console

### 2. Test User Flow
- [ ] Login with valid password works
- [ ] Dashboard loads with tabs (Bets, Leaderboard)
- [ ] Bets tab displays bets (or empty state)
- [ ] Leaderboard refresh button works
- [ ] Place bet functionality works
- [ ] Remove bet functionality works
- [ ] User money updates after placing/removing bets

### 3. Test Admin Flow (if applicable)
- [ ] Login as admin works
- [ ] Create Bets tab visible
- [ ] Create new bet works
- [ ] Lock betting toggle works
- [ ] End bet functionality works
- [ ] Payouts are calculated correctly

### 4. Mobile Testing
- [ ] Open on mobile device
- [ ] All tabs accessible
- [ ] Buttons are touch-friendly
- [ ] Text is readable (not too small)
- [ ] Layout doesn't break on small screens
- [ ] Dialogs/modals work on mobile

### 5. Production Optimization
- [ ] Check Vercel Analytics (if enabled)
- [ ] Monitor initial load time (should be < 3s)
- [ ] Check Lighthouse score (aim for 90+)
- [ ] Verify no memory leaks (leave app open for 5 minutes)

## Common Issues & Solutions

### Build Fails on Vercel

**Symptoms**: Deployment fails during build step

**Solutions**:
1. Check Vercel build logs for specific error
2. Verify all dependencies are in `package.json`
3. Run `npm run build` locally to reproduce
4. Check Node.js version compatibility

### API Calls Fail in Production

**Symptoms**: Login fails, bets don't load

**Solutions**:
1. Verify `NEXT_PUBLIC_API_BASE_URL` is set in Vercel
2. Check backend logs for incoming requests
3. Verify CORS headers allow Vercel domain
4. Ensure backend API uses HTTPS (not HTTP)
5. Test API directly with curl/Postman

### Environment Variables Not Working

**Symptoms**: API calls go to localhost instead of production URL

**Solutions**:
1. Ensure variable name starts with `NEXT_PUBLIC_`
2. Redeploy after adding environment variables
3. Clear browser cache and hard refresh
4. Check Vercel deployment settings to confirm variables are set

### Mobile Layout Issues

**Symptoms**: Layout breaks on mobile devices

**Solutions**:
1. Test using Chrome DevTools mobile emulation
2. Check for hardcoded pixel widths
3. Verify Tailwind responsive classes (sm:, md:, lg:)
4. Test on actual mobile device

## Security Checklist

Before making the app public:

- [ ] Backend uses HTTPS only
- [ ] CORS is restricted to your Vercel domain
- [ ] No API keys or secrets in frontend code
- [ ] Rate limiting enabled on backend
- [ ] Input validation on all forms
- [ ] Authentication tokens expire (if using JWT)
- [ ] Password requirements are enforced
- [ ] XSS protection headers enabled (in `vercel.json`)

## Monitoring & Maintenance

After deployment:

- [ ] Set up Vercel Analytics (optional)
- [ ] Monitor error rates in Vercel dashboard
- [ ] Set up backend monitoring/logging
- [ ] Document any production issues
- [ ] Plan for database backups
- [ ] Set up staging environment (optional)

## Rollback Plan

If something goes wrong:

1. **Via Vercel Dashboard**:
   - Go to Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **Via Vercel CLI**:
   ```bash
   vercel rollback
   ```

## Next Steps

Once deployed successfully:

- [ ] Share the Vercel URL with team
- [ ] Update any documentation with production URL
- [ ] Set up custom domain (optional)
- [ ] Configure DNS records (if using custom domain)
- [ ] Enable Vercel Analytics (optional)
- [ ] Set up continuous deployment (auto-deploy on git push)

---

## Quick Reference

**Production URL**: `https://your-app.vercel.app`

**Environment Variables Required**:
- `NEXT_PUBLIC_API_BASE_URL`: Your backend API URL

**Important Files**:
- `.env.example`: Template for environment variables
- `vercel.json`: Vercel configuration
- `README.md`: Full documentation

**Support**:
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- GitHub Issues: [Your repo issues]

---

**Last Updated**: 2025-11-08
