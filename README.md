# Cloudly - cloud storage service

Cloudly is a Google Drive-style file storage MVP built from the supplied project specification.

## Run locally

1. Copy `Backend/.env.example` to `Backend/.env` and fill in the Supabase URL, service role key, and storage bucket.
2. Apply `database/schema.sql` in the Supabase SQL editor.
3. Install and start the API:

```powershell
cd Backend
npm install
npm start
```

4. Start the Vite frontend in another terminal:

```powershell
cd Frontend
npm install
npm run dev
```

Set `VITE_API_URL` when the API is not running on `http://localhost:8080/api`.

## Implemented scope

- Supabase Auth registration, login, and protected API middleware
- Hierarchical folders with create, rename, move, soft delete, trash, and restore
- File uploads with size/type validation, SHA-256 checksum metadata, folder placement, signed downloads, rename, move, soft delete, restore, and permanent deletion
- Viewer/editor per-user sharing and public links with optional expiry/password
- Search, recent files, stars, and activity logging
- Helmet headers, CORS allow-list, API/upload rate limits, sanitized filenames, and environment-based configuration
- Responsive React dashboard with drag/picker upload entry point, search, grid/list view, folder creation, stars, sharing, and trash-oriented navigation
