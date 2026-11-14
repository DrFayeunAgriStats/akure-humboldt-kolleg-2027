# Asset sources and permissions

Every image or logo shown on the public homepage is listed here. Do not merge to `main` until `npm run check:assets` passes.

| Asset | Path | Source | Rights / permission | Status |
|---|---|---|---|---|
| Alexander von Humboldt Foundation logo (RGB/web, SVG) | `public/branding/avh-logo-rgb.svg` | Official Corporate Design page: https://www.humboldt-foundation.de/en/explore/organisation/corporate-design → https://www.humboldt-foundation.de/fileadmin/Entdecken/Organisation/Styleguide/Logo/AvH_Logo_rgb.svg | The logo is trademark-protected. The Foundation's page says it "may not be used without prior written permission". The conference client confirms that permission exists and that the Foundation is sponsoring the conference. **Keep a copy of the written permission on file.** Use it unaltered. The RGB variant is for screen use only, and the clear space equals the radius of the head circle. Questions go to presse[at]avh.de. | **File not yet committed.** The build environment could not download it. Run `scripts/fetch-brand-assets.sh`. |
| FUTA crest / logo | `public/branding/futa-logo.png` | The university's own website, https://futa.edu.ng/, or a file supplied by FUTA's Directorate of Corporate Affairs | Official institutional mark, used to identify the proposed host. Do not redraw, recolour or crop it. | **File not yet committed.** Add a square PNG (transparent background if possible, ≥256 px). |
| FUTA main entrance (older gate) | hotlinked from Wikimedia Commons | https://commons.wikimedia.org/wiki/File:Federal_University_of_Technology,_Akure,_Ondo_State11.jpg | CC BY-SA 4.0, MediaMOF. Credit shown on the page. | Retained temporarily, captioned as the older main-entrance view. |
| New FUTA South Gate | slot only (`.slot-gate`) | Reference: https://www.futa.edu.ng/news/1349-futa-south-gate-to-wear-new-look | — | **Needed.** An authentic photograph of the new South Gate that FUTA has cleared for use. If the gate is still under construction, caption it that way; if the only image is a rendering, caption it "Proposed South Gate design". |
| FUTA 2,500-capacity Main Auditorium (renamed after Chief Obafemi Awolowo during FUTA's 32nd convocation / 40th anniversary, per Nigerian Tribune) | slot only (`.slot-auditorium`) | Reference: https://tribuneonlineng.com/futa-renames-main-auditorium-after-awolowo/ | — | **Needed.** An exterior or interior photograph that FUTA has cleared for use. Keep the caption "potential conference facility" until the hall is confirmed. |
| Rainforest hero/interior images | `public/assets/*.webp` | Existing project assets | Unchanged | In place |

## Replacing a photo slot

Optimise the photo to WebP (about 1600 px wide, 4:3) and save it as `public/images/futa-south-gate-new.webp` or `public/images/futa-auditorium-2500.webp`. Then, in `lib/home.ts`, replace the slot's `<div class="venue-slot-frame" …>…</div>` with:

```html
<img src="/images/futa-south-gate-new.webp" alt="New South Gate of the Federal University of Technology, Akure" loading="lazy" width="1600" height="1200"/>
```

Add the photographer credit to the figcaption and to the table above.
