# MeticAI Resources Directory

This directory contains visual assets, documentation, and promotional materials for the MeticAI web application.

## Contents

### Screenshots (`screenshots/`)

Comprehensive screenshots of the entire MeticAI application covering:

**Desktop Views:**
- Welcome screen
- Profile generation form
- Taste preferences and tag selection
- Advanced customization options
- Mobile access (QR code dialog)
- Profile catalogue interface
- Demo results view

**Mobile Views (375x812 viewport):**
- Mobile welcome screen
- Mobile form (empty and with tags)
- Mobile advanced customization
- Mobile demo results
- Mobile profile catalogue

**Purpose:** These screenshots are used for:
- Documentation and user guides
- Promotional materials and marketing
- Website updates
- Social media content
- GitHub repository README
- Demo presentations
- Mobile app store listings (if applicable)

### Branding Assets

- `logo.svg` - MeticAI logo in SVG format (scalable vector)
- `logo.png` - MeticAI logo in PNG format (raster image)

**Source:** Copied from `public/` directory

### Documentation

- `SCREENSHOTS.md` - Comprehensive visual documentation with detailed descriptions of each screenshot, organized by feature and use case

## Usage Guidelines

### For Developers

- Reference screenshots when implementing UI changes
- Update screenshots after significant visual changes
- Use screenshots in pull request descriptions to show changes

### For Marketing

- Use screenshots in promotional materials
- Maintain consistent branding across all materials
- Update website and social media with latest screenshots

### For Documentation

- Embed screenshots in user guides and tutorials
- Use annotated screenshots to explain features
- Keep documentation synchronized with application updates

## Maintenance

Screenshots should be updated when:
- Major UI changes are implemented
- New features are added
- Branding or design system changes
- Preparing for releases or major announcements

## File Organization

```
resources/
├── README.md                              # This file
├── SCREENSHOTS.md                         # Comprehensive visual documentation
├── logo.svg                               # MeticAI logo (vector)
├── logo.png                               # MeticAI logo (raster)
└── screenshots/                           # Application screenshots
    ├── 01-welcome-screen.png              # Desktop welcome
    ├── 02-upload-form-empty.png           # Desktop form (empty)
    ├── 03-form-with-tags-selected.png     # Desktop form (with tags)
    ├── 04-advanced-customization.png      # Desktop advanced options
    ├── 05-qr-code-dialog.png              # QR code feature
    ├── 06-profile-catalogue-empty.png     # Desktop catalogue
    ├── 07-demo-results-desktop.png        # Desktop results view
    ├── mobile-01-welcome-screen.png       # Mobile welcome
    ├── mobile-02-form-empty.png           # Mobile form (empty)
    ├── mobile-03-form-with-tags.png       # Mobile form (with tags)
    ├── mobile-04-advanced-customization.png # Mobile advanced options
    ├── mobile-05-demo-results.png         # Mobile results view
    └── mobile-06-profile-catalogue.png    # Mobile catalogue
```

## Contributing

When adding new screenshots:
1. Use descriptive filenames with numbers for ordering (desktop) or `mobile-` prefix (mobile)
2. Capture full page screenshots when possible
3. Update SCREENSHOTS.md with descriptions and use cases
4. Ensure high quality and consistent resolution
5. Remove any sensitive or test data
6. Use standard viewport sizes: 1280x720 for desktop, 375x812 for mobile

---

For questions or suggestions about resources, please open an issue in the repository.
