# DVERSO STUDIO

Editorial luxury creative-agency landing page built with Next.js, TypeScript, GSAP ScrollTrigger and Lenis.

## Run locally
```bash
npm install
npm run dev
```

## Before publishing
- Replace the temporary Unsplash editorial photography with licensed brand-owned imagery.
- Set the correct studio email address in the contact form and footer. The current form uses `mailto:hello@dversostudio.com` as a no-backend fallback.
- Replace Instagram/Pinterest destination URLs with the official DVERSO Studio profiles.
- Add a privacy notice and data handling process before connecting a server-side form.
- Install Impeccable in your local agent workspace with `npx impeccable install`, then run `/impeccable init`, `/impeccable critique`, and `/impeccable audit`.
- Optionally install Emil Kowalski's skills with `npx skills@latest add emilkowalski/skills`.

## Motion principles
- Animate transform and opacity rather than layout properties.
- Keep easing ease-out for entrance and use scrub only for subtle image parallax.
- Lenis is disabled when `prefers-reduced-motion` is enabled.
