# REVEL Website Launch Checklist

**Last updated:** 2026-05-21

## 1. Pre-Deployment
- [ ] Confirm all HTML, CSS, JS, and image files are present in your workspace
- [ ] Verify all navigation links work (HOME, OUR PROCESS, OUR WORK, THE TEAM, CLIENT PORTAL, CONTACT US, POLICIES)
- [ ] Test mobile menu and desktop navigation
- [ ] Confirm all images load (especially homepage/hero images)
- [ ] Test contact form (Formspree endpoint)
- [ ] Check that policies.html and client-portal.html load with no errors

## 2. Deploy to Host
- [ ] Choose a static host (Vercel, Netlify, or similar)
- [ ] Drag and drop your entire workspace folder (including images/, css/, js/, all .html files) into the host’s deploy UI
- [ ] Wait for deployment to complete and note the preview URL

## 3. Domain Setup
- [ ] In your host’s dashboard, set your custom domain (revel-ent.com)
- [ ] Update DNS records as instructed by your host (A record or CNAME)
- [ ] Remove or update any Squarespace-specific DNS records
- [ ] Wait for DNS propagation (5–30 min, up to 24 hours)

## 4. Post-Deployment Verification
- [ ] Visit revel-ent.com and verify:
    - [ ] Homepage loads with all images and styles
    - [ ] All nav links work (including Client Portal)
    - [ ] Contact form submits and shows success message
    - [ ] Mobile menu works
    - [ ] Policies page loads
- [ ] Test on mobile and desktop browsers
- [ ] Ask a friend or team member to test from a different network/device

## 5. Go-Live
- [ ] Once all tests pass, cancel your Squarespace website subscription (keep domain registration if you want)
- [ ] Optional: Set up analytics (Google Analytics, Plausible, etc.)
- [ ] Announce your new site!

## 6. Future-Proofing
- [x] Client Portal link is live and ready for future Atlas features
- [x] All content and navigation is modular for easy updates
- [x] Next-gen features (AI, trust-layer, vendor/guest tools) will be added in Atlas, not the main site

---

**If you need to download images:**
- All images in the images/ folder are included in the deploy—no need to re-upload unless you want to swap or update them.

**If you want to upgrade further:**
- The current site is ready for launch and future-proofed for modular upgrades.
- Focus next-gen work in Atlas and keep REVEL site clean and conversion-focused.
