# FrameFlux

Conceptual movie posters from a film title, genre, and optional one-line pitch.

```text
human concept
  → story interpretation + genre visual grammar
  → AI Art Director (Visual DNA)
  → cinematic key art
  → p5.js interpretation (genre-aware procedural families)
  → five related directions
  → poster
```

AI establishes the cinematic world. Visual DNA structures that world. p5.js transforms it. Typography is drawn last, deterministically, never by the image model.

The story determines the emotional interpretation. The emotional interpretation determines the visual language. Genre is a grammar — material, colour, lighting, metaphor, composition, type — not a sticker. It is never printed on the poster (`typography.genreVisibility` is locked to `hidden`).

## Use

```bash
php -S localhost:8080
```

Open [http://localhost:8080](http://localhost:8080).

1. Enter a title, genre, and optional pitch.
2. **Generate** creates Visual DNA, cinematic key art, and three variations.
3. Select Signature, Hybrid, or Alternative.
4. **Regenerate** re-rolls the procedural seed only — no AI, no new still.
5. **Reimagine** keeps the film and asks for a new interpretation (new DNA, new still).
6. **Improve** sends the current DNA back for a stronger pass of the same identity.
7. **Download PNG** exports the selected poster.

## Optional AI key

Copy `config.example.php` to `config.php` and set `openai_api_key`.
`OPENAI_API_KEY` in the environment is used when the file key is empty.

Without a key, Visual DNA is authored by a local heuristic and the cinematic still is a DNA-driven plate. The rest of the hybrid pipeline still runs.

## Visual languages

Genre is a **visual grammar**, not a colour overlay. Comedy, romance, adventure, and contemporary stories receive their own materials, lighting, metaphors, composition, and procedural families. Circuit traces, neon grids, and dark geometric voids remain available for thrillers, sci-fi, and technological horror — they are no longer the default for every film.

Procedural families include organic flow, chaotic cords, atmospheric haze, editorial paper layers, topographic trails, and (for tech stories) geometric grid / mesh / rings.

## Layouts

Centered, off-center top, off-center bottom, split editorial, and frame inset. Frame inset is reserved for claustrophobic tech stories so human genres are not forced into the same sterile void.

Architectural **composition modes** (central-focus, editorial, split-field, framed-object, type-dominant, edge-flow, diagonal, quiet-minimal) snap title, quote, frame, and archive marks to a 12-column grid. Story DNA chooses the mode; regenerate only varies execution inside it.

## Print and topography

Posters share a FrameFlux print identity: atmospheric topography shade, contour field, translucent central frame, connecting lines, analog registration, halftone, grain, and faint scan-lines. Saturation, metaphor, and art family still come from the story so comedy does not become cyber and romance does not become a glitch plate.

## Typography

Title and quote are separate art-directed decisions in the Visual DNA, derived from the story rather than the genre.

- **Title** (`typography.title`): weight, case, letterforms, tracking, structural treatment (solid, outline, fragmented, layered, textured, gradient) and placement. Scale comes from title length and the safe width; long titles wrap, hyphenated words break at the hyphen, and a single unbreakable word hard-breaks rather than overflowing. Comedy layouts stay full-width so long titles are not squeezed into a split column.
- **Quote** (`typography.quote`): style (editorial italic, caption, cinematic subtitle, typewriter, handwritten), its own legibility technique (scrim, shadow, plate) and placement. The quote face is always forced to contrast with the title face instead of repeating it smaller.

Risky treatments are validated against the artwork underneath and degrade to a safer one when local contrast is insufficient. Readability wins over style.

## Tests

```bash
php tests/test_dna.php
```

## Stack

- Frontend: HTML, CSS, JavaScript, p5.js
- Backend: PHP (`api/generate.php`, `api/image.php`)
- AI: OpenAI Chat Completions (JSON Visual DNA) and Images (cinematic still)
