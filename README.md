# Checkpoint Deployment – MERN Users Manager

A full **MERN** application (**M**ongoDB, **E**xpress, **R**eact, **N**ode.js) to manage users.
The Express server exposes a REST API built with Mongoose **and** serves the React production build,
so the whole app runs as a single Node.js service — ready to be hosted on **Microsoft Azure App Service**.

## Project structure

```
Checkpoint Deployment/
├── client/              # React frontend (Vite) – source code
│   ├── src/
│   │   ├── App.jsx      # UI: list, add, edit, delete users
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js   # builds into ../public
├── config/
│   └── .env             # Environment variables (not committed)
├── models/
│   └── User.js          # Mongoose schema and User model
├── public/              # React production build, served by Express (committed)
├── server.js            # Express server: API routes + static React build
├── package.json
└── .gitignore
```

## Run locally

Requirements: [Node.js](https://nodejs.org/) 20+ and MongoDB (local or Atlas).

1. Install the server dependencies:

   ```bash
   npm install
   ```

2. Create `config/.env` (ignored by git):

   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/restapi
   ```

3. Build the React frontend for production (output goes to `public/`):

   ```bash
   npm run build:client
   ```

4. Start the server:

   ```bash
   npm start
   ```

   Open `http://localhost:5000` for the React app. The API is at `http://localhost:5000/users`.

### Development mode

```bash
npm run dev
```

Starts both at once (with [concurrently](https://www.npmjs.com/package/concurrently)):

- **server**: Express API on `http://localhost:5000`, restarted automatically when a file changes (`node --watch`)
- **client**: React (Vite) on `http://localhost:5173`, with hot reload; API calls to `/users` are proxied to port 5000

Open `http://localhost:5173` while developing.

> **Error `querySrv ECONNREFUSED` with Atlas?** Your network's DNS cannot resolve the `mongodb+srv://` address.
> Add `DNS_SERVERS=8.8.8.8,1.1.1.1` to `config/.env` (not needed on Azure).

## User model

| Field   | Type   | Rules                 |
|---------|--------|-----------------------|
| `name`  | String | required              |
| `email` | String | required, unique      |
| `age`   | Number | optional, must be ≥ 0 |

`createdAt` and `updatedAt` are added automatically.

## API routes

| Method | URL          | Description         | Mongoose method            |
|--------|--------------|---------------------|----------------------------|
| GET    | `/users`     | Return all users    | `User.find()`              |
| POST   | `/users`     | Add a new user      | `new User().save()`        |
| PUT    | `/users/:id` | Edit a user by id   | `User.findByIdAndUpdate()` |
| DELETE | `/users/:id` | Remove a user by id | `User.findByIdAndDelete()` |

Example body for **POST** / **PUT**:

```json
{ "name": "Ali", "email": "ali@mail.com", "age": 22 }
```

| Code | Meaning                                        |
|------|------------------------------------------------|
| 200  | Success                                        |
| 201  | User created                                   |
| 400  | Invalid data (missing field, duplicate email…) |
| 404  | No user found with this id                     |
| 500  | Server error                                   |

---

## Deploy on Microsoft Azure

### 1. MongoDB Atlas (cloud database)

Azure does not host MongoDB directly, so the database runs on MongoDB Atlas.

1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a **free (M0) cluster**.
2. **Database Access** → add a database user (username + password).
3. **Network Access** → add IP address `0.0.0.0/0` (allow access from anywhere, needed because
   Azure's outgoing IP addresses can change).
4. **Connect** → **Drivers** → copy the connection string and add the database name `restapi`:

   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/restapi?retryWrites=true&w=majority
   ```

### 2. Prepare the app

- Sensitive data (the MongoDB URI) is read from the environment variable `MONGO_URI`, never written in the code.
- `PORT` is provided automatically by Azure.
- Build the React app and commit the result in `public/`:

  ```bash
  npm run build:client
  git add .
  git commit -m "Build React frontend for production"
  ```

### 3. Create the Azure Web App

1. Sign in to the [Azure Portal](https://portal.azure.com).
2. **Create a resource** → **Web** → **Web App**.
3. Fill in:
   - **Resource group**: create a new one, e.g. `checkpoint-mern-rg`
   - **Name**: e.g. `checkpoint-mern-<yourname>` (becomes `<name>.azurewebsites.net`)
   - **Publish**: Code
   - **Runtime stack**: Node 22 LTS (or newer)
   - **Operating System**: Linux
   - **Region**: the closest to you (e.g. France Central)
   - **Pricing plan**: Free F1
4. **Review + create** → **Create**.

### 4. Set the environment variables

In the Web App: **Settings** → **Environment variables** (older portals: **Configuration**) → **App settings** → **+ Add**:

| Name                             | Value                          |
|----------------------------------|--------------------------------|
| `MONGO_URI`                      | your Atlas connection string   |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` (runs `npm install`)    |

Click **Apply** and confirm.

### 5. Deploy with Local Git

1. **Settings** → **Configuration** → **General settings** → turn **SCM Basic Auth Publishing Credentials** to **On** → **Save**.
2. **Deployment** → **Deployment Center** → **Source**: **Local Git** → **Save**.
3. Copy the **Git Clone Uri**, then open the **Local Git/FTPS credentials** tab to see the username and password.
4. In the project folder:

   ```bash
   git remote add azure <Git Clone Uri>
   git push azure main:master
   ```

   Enter the credentials when asked. Azure installs the dependencies and runs `npm start` automatically.

### 6. Test the deployed app

- Open `https://<app-name>.azurewebsites.net` → the React app loads.
- Add, edit and delete a user → the data is saved in MongoDB Atlas.
- The API also answers at `https://<app-name>.azurewebsites.net/users` (testable with Postman).
- If something fails: **Monitoring** → **Log stream** shows the server logs.
