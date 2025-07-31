# IONOS DNS Configuration for Vercel

## Quick Setup Guide

### Step 1: Access IONOS DNS Settings

1. Log in to IONOS Control Panel: https://my.ionos.com
2. Navigate to **Domains & SSL** in the main menu
3. Find your domain in the list
4. Click the gear icon (⚙️) next to your domain
5. Select **DNS** from the dropdown menu

### Step 2: Delete Existing Records (If Any)

Before adding new records, remove any conflicting records:
- Delete any existing A records for @ or root domain
- Delete any existing CNAME for www
- Keep MX records if you're using IONOS email

### Step 3: Add Vercel DNS Records

#### A Record for Root Domain

Click **Add record** and enter:
```
Type: A
Host Name: @ (or leave empty)
Points to: 76.76.21.21
TTL: 3600 (1 hour)
```

#### CNAME for WWW Subdomain

Click **Add record** and enter:
```
Type: CNAME
Host Name: www
Points to: cname.vercel-dns.com
TTL: 3600 (1 hour)
```

### Step 4: Save Changes

1. Review all records
2. Click **Save** at the bottom of the page
3. IONOS will show a confirmation message

### Step 5: Verify DNS Propagation

DNS changes can take 1-48 hours. Check status at:
- https://dnschecker.org/#A/yourdomain.com
- https://whatsmydns.net/

## Advanced Configuration

### Adding Subdomains

For subdomains like `app.yourdomain.com`:
```
Type: CNAME
Host Name: app
Points to: cname.vercel-dns.com
TTL: 3600
```

### Email Configuration (If Using IONOS Email)

Keep these records unchanged:
```
Type: MX
Host Name: @
Points to: mx00.ionos.com
Priority: 10
TTL: 3600

Type: MX
Host Name: @
Points to: mx01.ionos.com
Priority: 10
TTL: 3600
```

### SPF Record for Email

```
Type: TXT
Host Name: @
Value: "v=spf1 include:_spf.ionos.com ~all"
TTL: 3600
```

## Troubleshooting

### Common Issues

1. **"DNS Not Resolving"**
   - Wait for propagation (up to 48 hours)
   - Clear your DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

2. **"Invalid Configuration" in Vercel**
   - Ensure A record points to: 76.76.21.21
   - Ensure CNAME points to: cname.vercel-dns.com
   - Check for typos in record values

3. **SSL Certificate Error**
   - Vercel automatically provisions SSL certificates
   - This can take up to 24 hours after DNS propagation
   - No action needed from your side

### IONOS Specific Notes

- IONOS may show @ as "root" in some interfaces
- TTL can be set between 300-86400 seconds
- Changes typically propagate within 1-4 hours
- IONOS DNS servers: ns1081.ui-dns.com, ns1025.ui-dns.de

## Next Steps

After DNS configuration:
1. Add domain in Vercel dashboard
2. Wait for SSL certificate provisioning
3. Update environment variables
4. Test domain accessibility

## Support Contacts

- IONOS Support: 1-866-991-2631
- Vercel Support: https://vercel.com/support
- DNS Issues: Use online chat in IONOS control panel

---

Configuration Date: ___________
Completed By: ___________
Verified Working: [ ] Yes [ ] No