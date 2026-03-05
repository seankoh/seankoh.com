# seankoh.com

Personal website for Sean Koh — job-hunting homepage.

## Project structure

```
seankoh.com/
  index.html     # entire site, single file, no dependencies
  linkedin.txt   # scraped LinkedIn profile data (source of truth)
  resume.txt     # resume data (source of truth)
  CLAUDE.md
```

## Stack

- Pure HTML/CSS, no frameworks, no build tools
- Single `index.html` — all styles inline in `<style>` tag
- No JavaScript except native browser scroll behavior
- Served locally with `python3 -m http.server 8080` from `/home/user/web` (parent dir)
- Access at `http://localhost:8080/seankoh.com/`

## Design

- Dark theme (`--bg: #0f1117`)
- Accent blue (`--accent: #4f8ef7`), purple (`--accent2: #7c5cbf`), vibe purple (`--vibe: #a78bfa`)
- CSS custom properties in `:root`
- Responsive — single breakpoint at 600px

## Sections (in order)

1. **Nav** — fixed, blur backdrop, links to anchors
2. **Hero** — name, title, vibe coding badge, bio, CTA buttons
3. **Skills** — vibe coding highlight card + 4 skill cards in grid
4. **Experience** — vertical timeline, current role has green pulse dot
5. **Education** — SDSU BSc Mechanical Engineering
6. **Contact** — LinkedIn only (no email, no phone)
7. **Footer**

## Content rules

- Name displayed as **Sean Koh** (not Boon Tiang)
- Contact: LinkedIn only — `https://www.linkedin.com/in/boon-tiang-koh-5bbaa4138/`
- No email, no phone number on the site
- Vibe Coding / Claude Code should be prominent (hero badge + dedicated highlight card in skills)
- Availability: Immediate

## Owner

- Sean Koh (Boon Tiang Koh), Singapore
- Current role: PLC Programmer at Epic Medical (Aug 2025 – Present)
