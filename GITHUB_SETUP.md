# GitHub Repository Setup Instructions

Follow these steps to create and push your FableTech Studios repository to GitHub:

## 1. Create GitHub Repository

Go to [GitHub](https://github.com) and create a new repository:

1. Click the "+" icon in the top right corner
2. Select "New repository"
3. Repository settings:
   - **Repository name**: `fabletech-studios`
   - **Description**: Premium multimedia streaming platform with audiobook content
   - **Privacy**: Choose Public or Private based on your preference
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click "Create repository"

## 2. Add Remote Origin

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/fabletech-studios.git

# Or if using SSH
git remote add origin git@github.com:YOUR_USERNAME/fabletech-studios.git
```

## 3. Push to GitHub

```bash
# Push the main branch
git push -u origin main
```

## 4. Verify Upload

Visit your repository at `https://github.com/YOUR_USERNAME/fabletech-studios` to verify all files are uploaded.

## 5. (Optional) Set up Branch Protection

For production safety, consider setting up branch protection rules:

1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable:
   - Require pull request reviews before merging
   - Dismiss stale pull request approvals when new commits are pushed
   - Include administrators

## Next Steps

Your repository is now ready for:
- Vercel deployment (import directly from GitHub)
- Collaboration with team members
- CI/CD setup
- Issue tracking

## Troubleshooting

If you encounter authentication issues:

### For HTTPS:
```bash
# Use personal access token
git push https://YOUR_USERNAME:YOUR_TOKEN@github.com/YOUR_USERNAME/fabletech-studios.git main
```

### For SSH:
```bash
# Ensure SSH key is added to GitHub account
ssh -T git@github.com
```

## Important Files to Review

Before deploying, ensure these files are properly configured:
- `.env.local` - Should NOT be in the repository (it's in .gitignore)
- `next.config.ts` - Check for any local configurations
- Firebase configuration - Ensure using environment variables

---

Remember to keep your `.env.local` file secure and never commit it to the repository!