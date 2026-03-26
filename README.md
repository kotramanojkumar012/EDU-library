# Engineering Library System

Engineering Library is a single-page experience that surfaces every B.Tech subject from the 2023 curriculum inside one grid so students can immediately jump to curated textbooks, read them inside the browser, or download the PDF.

## Highlights

- **All subjects on one grid:** Every curriculum subject (from Foundation Core through Discipline Core) lives in a single, ungrouped grid card. Each card shows the title, an overview, and the number of books available.
- **Search across subjects, titles, and authors:** The search input filters the grid live while also filtering the currently selected subject’s book list.
- **Book detail view:** Clicking a subject brings up its book grid with cover art, author, edition, and CTA buttons for “Read” (modal PDF viewer) or “Download”.
- **PDF reader with controls:** The modal loads PDFs through Mozilla’s viewer without forcing a download, and provides buttons to open the same file in a new tab or trigger a download link.
- **Real campus feel:** Stats, About, Contact, and Review sections anchor the bottom of the page, along with a footer that honors the 2026 design brief.
- **Responsive design:** The layout has been tuned for mobile, tablet, and desktop with hover/interaction polish and a dark blue + white palette.

## Data source

- `data/books.json` contains 21 curriculum subjects (Data Structures, DBMS, OS, Networks, Theory, AI, ML, Engineering Math, and more) with 4–5 unique books per subject. Each book entry includes author, edition, rating, cover image, and a working PDF link so the reader and download actions stay reliable.
- Cover art reuses the assets under `images/covers`.

## Running locally

> `books.json` is fetched via `fetch`, so serve the folder over HTTP for the platform to work.

### Option 1: VS Code Live Server

1. Open this repository in VS Code.
2. Launch Live Server and target `index.html`.
3. Visit the provided localhost address.

### Option 2: Python HTTP server

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Notes

- The platform intentionally avoids section headings such as “Discipline Core” and instead presents all subjects through a single grid flow.
- Review submissions trigger an inline thank-you message and are acknowledged with toast feedback.
- The PDF reader uses Mozilla’s hosted viewer so every click stays inside the app, while the download/open buttons keep the document accessible.
