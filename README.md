# 3d-workshop

3D workshop: a Vite + React + Three.js app, plus Python notebooks for poking at 3D assets.

## Web app

```bash
npm install
npm run dev        # start Vite dev server
npm run build      # production build -> dist/
npm run preview    # preview the build
npm run typecheck  # tsc --noEmit
npm test           # vitest
```

Built with [@react-three/fiber](https://github.com/pmndrs/react-three-fiber), [drei](https://github.com/pmndrs/drei), and [Three.js](https://threejs.org/).

## Notebooks

Python tooling is managed with [uv](https://docs.astral.sh/uv/) (Python >= 3.12).

```bash
uv sync                                  # create .venv, install deps
uv run jupyter lab notebooks/read_ply.ipynb
```

Or select the `.venv` kernel in your IDE.

| Notebook | What it does |
|----------|--------------|
| [`notebooks/read_ply.ipynb`](notebooks/read_ply.ipynb) | Reads `public/cube.ply` line by line as text. The file is a `binary_little_endian` PLY — the header is ASCII, the body is raw binary (shown as replacement chars). |

## Layout

```
public/      static assets (cube.ply, ...)
src/         app source
notebooks/   Python notebooks (uv-managed)
examples/    example scenes
docs/        docs
```
