# NOIR — Private Video Website (v2)

A responsive, black-and-gold private video library with:
- Home, Collection and About navigation
- Log in / Request access in the top-right corner
- Signed-in profile dropdown showing email and approval status
- Logged-out visitors see a clear members-only access gate
- Pending users see an approval message
- Approved users can watch videos from a private Supabase Storage bucket

## 1. Supabase setup
1. Create a Supabase project.
2. Open **Project Settings → API** and copy the Project URL and anon/public key.
3. Paste them into `app.js`:
   - `YOUR_SUPABASE_PROJECT_URL`
   - `YOUR_SUPABASE_ANON_PUBLIC_KEY`
4. In Supabase SQL Editor, run `schema.sql`.
5. In Authentication settings, choose whether email confirmation should be enabled.

**Never paste the `service_role` key into this website.** The browser must only use the anon/public key.

## 2. Approve people
After someone creates an account, approve them manually in Supabase SQL Editor:
```sql
update public.profiles
set status = 'approved'
where email = 'person@example.com';
```
To revoke access:
```sql
update public.profiles
set status = 'blocked'
where email = 'person@example.com';
```

## 3. Add videos
1. In Supabase Storage, create/use the private bucket named `private-videos`.
2. Upload each video into that bucket.
3. Add a row to `public.videos` with its title, optional description and exact `storage_path`.
4. Example: if the uploaded object path is `memories/clip-01.mp4`, set `storage_path` to `memories/clip-01.mp4`.

The site creates short-lived signed URLs only for approved users. Do not make the bucket public.

## 4. Publish with GitHub + Cloudflare Pages
1. Create a GitHub repository and upload all files from this folder (keep `index.html`, `style.css`, `app.js`, `schema.sql`, `README.md` at the repository root).
2. In Cloudflare, open **Workers & Pages → Create → Pages → Connect to Git**.
3. Select the repository. Framework preset: **None**. Build command: leave blank. Output directory: `/`.
4. Deploy. Cloudflare will provide a website URL.
5. Make a QR code from that URL.

## 5. Free plan note
Supabase and Cloudflare have free-tier limits. Video storage and bandwidth are the main constraints for a 10–50 video library. Compress videos and check current plan quotas before uploading a large collection. Free does not mean unlimited.

## Security notes
- RLS policies in `schema.sql` protect profile/video rows.
- The Storage bucket must remain private.
- Never share database passwords or service-role keys.
- Login cannot prevent screen recording or someone filming their screen.
