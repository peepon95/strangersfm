# Handwriting extraction

Goal: ink only, transparent background, tight crop. Matches notes 001 to 003.

## Pipeline

1. Load the photo, convert to grayscale, downscale only if huge.
2. Local adaptive threshold (block ~51px) so uneven notebook lighting does not
   swallow light pen strokes.
3. Remove large dark blobs that touch the image border. These are desk edges,
   shadows and the phone's own shadow. Keep components that touch the border
   but are thin, because real handwriting sometimes runs off the page.
4. Drop thin long streaks (aspect ratio extreme, low fill) which are ruled
   lines and paper creases.
5. Build alpha from inverted luminance normalized between the ink floor and the
   paper level, so strokes keep soft edges instead of looking cut out.
6. Autocrop to the bounding box of remaining alpha with a small pad.
7. Save as PNG with alpha. Never flatten onto a colour: a flattened JPEG
   produces the double background the user rejected.

## After the script

Inspect the alpha channel corners. Leftover corner artifacts happen; zero them
manually rather than raising the global threshold, which eats faint strokes.

Site background for visual comparison only: `oklch(0.975 0.014 88)` from
`src/styles.css`. Do not bake it into the asset.
