# RailForge Studio

A lightweight, open-source, browser-based 3D model railway layout editor focused on **Märklin H0 M-track**. Designed for rapid low-poly prototyping of tabletop railway layouts, multiple levels, terrain, and Blender presentations.

![RailForge Studio editor screenshot](preview.png)

## Features

- 3D tabletop model editor with adjustable baseboard dimensions in millimetres
- Catalog of commonly used Märklin M-track pieces (straight rails, curves and turnouts)
- Endpoint snapping to connect pieces
- Per-section heights, grades and elevated layouts
- Low-poly terrain sculpting, simplified scenery and tunnel placeholders
- X-ray view, camera presets and a simple train preview
- Project save/load to JSON, OBJ export and Blender Python-script export
- Entire editor in one HTML file; no account or build tools required

## Run locally

Download `index.html` and open it directly in a recent version of Chrome or Edge. Or serve the folder locally with:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

## How to use

1. Set the tabletop size in the lower-left corner (dimensions are in **millimetres**).
2. Choose a track section in the left sidebar. Click the tabletop to place it, then click a green endpoint to snap another section on.
3. For an elevated track, set a construction height before placing it, or select an existing section and change its start/end heights in the inspector.
4. Switch to **Terrain** for simple hills or **Scenery** to add placeholder structures.
5. Toggle **X-ray** to inspect hidden trackwork.
6. Use **Save** to download an editable JSON project. Use **OBJ** or **Export to Blender** to create files for presentation and animation in Blender.

## Importing into Blender

- For the OBJ export, use **File → Import → Wavefront (.obj)** in Blender.
- For the Python exporter, switch to Blender's **Scripting** workspace, open the generated script and run it. Review scripts from any source before running them in Blender.

## Important limitations

RailForge is a visual **prototype and planning aid**, not certified track CAD or a guarantee of physical fit. The catalog includes commonly used parts, but is not exhaustive. Check real-world measurements, joints, turnout clearances, train clearances, curve compatibility, gradient transitions, reachable track sections, bridge structure, and electrical sections before buying or building. Tunnel markers and landscape models are schematic.

Project data is saved to downloaded files; it is **not synchronized to an online account**. GitHub Pages only hosts the app, not saved layouts.

## Publish with GitHub Pages

1. Create a **public** GitHub repository (for example, `railforge-studio`).
2. Upload this folder's files to the repository's default branch, keeping `index.html` at the repository root.
3. Under **Settings → Pages**, choose **Deploy from a branch**, select the default branch (typically `main`), folder **`/(root)`**, then Save.
4. The site should be accessible at `https://YOUR-USERNAME.github.io/railforge-studio/` once GitHub Pages finishes publishing.

## Contributing

Suggestions and contributions are welcome. Please open an issue describing a bug or feature request. When adding catalog entries, cite a trustworthy measurement source or provide measurements taken from a physical piece.

## License and trademark

Licensed under the [MIT License](LICENSE).

**Märklin** is a trademark of its respective owner. RailForge Studio is an independent community project and is not affiliated with or endorsed by Märklin.