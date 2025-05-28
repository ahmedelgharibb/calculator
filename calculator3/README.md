# Calculator App

## Backend Deployment (Express)

You can deploy the backend (in `/backend`) to any Node.js hosting service such as [Render](https://render.com), [Railway](https://railway.app), or [Heroku](https://heroku.com).

### Steps:

1. **Push your code to GitHub.**
2. **Create a new web service on Render/Railway/Heroku.**
   - Connect your GitHub repo.
   - Set the root directory to `/backend`.
   - Set the start command to `npm start`.
   - Add the following environment variables:
     - `DATABASE_URL` (your Supabase Postgres connection string)
     - `PGSSLMODE=require`
3. **Deploy the service.**
4. **Note the public URL of your backend (e.g., `https://your-backend.onrender.com`).**
5. **Update your frontend code** (in `script.js` or wherever you make API calls) to use the new backend URL instead of `/api`.

---

## Example: Update Frontend API Calls

Replace:
```js
fetch('/api/calculators')
```
With:
```js
fetch('https://your-backend.onrender.com/calculators')
```

---

## Frontend

The frontend (`index.html`, `styles.css`, `script.js`) can be deployed on Vercel or any static hosting service. 