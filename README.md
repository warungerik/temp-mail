<div align="center">

<img src="public/logo-4k.webp" alt="TempMail Logo" width="120" style="border-radius: 24px;" />

# TempMail

Disposable, anonymous temporary email service with zero sign-up, real-time inbox streaming, direct mailbox routing, and generator.email compatibility.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-23272f?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Turbopack](https://img.shields.io/badge/Turbopack-Ready-000000?style=flat-square&logo=vercel&logoColor=white)](https://turbo.build/)
[![API Docs](https://img.shields.io/badge/API-Interactive%20Docs-27ae60?style=flat-square)](/docs)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

<br/>

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-WarungErik-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=000000)](https://warungerik.com/payment)

</div>

---

## Key Features

- **Instant Generation**: Zero registration, zero personal data required.
- **Direct Mailbox URLs**: Direct access via `/[mailbox]` (e.g. `/username@domain.com`) matching standard disposable mail behavior.
- **Interactive API Docs**: In-browser API explorer with live request runner and cURL/JS/Python snippets at `/docs`.
- **Live Sync & Polling**: Real-time checking every 5 seconds with manual sync trigger.
- **Domain Lifespan & Uptime**: Real-time domain uptime indicators matching generator.email network metrics.
- **HTML & Text Rendering**: Safe email detail viewer supporting full HTML previews and plain text mode.
- **Responsive Layout**: Designed for mobile and desktop screens with fluid navigation.

---

## Tech Stack

| Technology | Role |
| :--- | :--- |
| ![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js) | Full-stack React framework with App Router & Turbopack |
| ![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB) | UI rendering and state management |
| ![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white) | End-to-end static type safety |
| ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) | Lightweight design system without heavyweight dependencies |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) version `18.18.0` or higher
- `npm`, `pnpm`, or `yarn` package manager

### 1. Clone & Install

```bash
git clone https://github.com/warungerik/temp-mail.git
cd temp-mail
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build

```bash
npm run build
npm run start
```

---

## API Endpoints

Interactive documentation and live test playground: **[tempmail-orcin.vercel.app/docs](https://tempmail-orcin.vercel.app/docs)**

**Base URL**: `https://tempmail-orcin.vercel.app/api`

| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/domains` | None | Fetches list of active disposable mail domains |
| `GET` | `/uptime` | `domain=example.com` | Returns uptime duration for a domain (e.g. `16 days`) |
| `GET` | `/inbox` | `user=name&domain=example.com` | Lists received messages in the target inbox |
| `GET` | `/mail` | `id=123&user=name&domain=example.com` | Retrieves full email content and metadata |

### Example Request

```bash
curl -X GET "https://tempmail-orcin.vercel.app/api/inbox?user=demo123&domain=owo-mailteam.bond" \
  -H "Accept: application/json"
```

---

## Project Structure

```text
temp-mail/
├── public/
│   ├── favicon.ico          
│   ├── logo-4k.webp         
│   ├── logo-512.webp      
│   ├── logo-192.webp        
│   └── apple-touch-icon.png
├── src/
│   └── app/
│       ├── [mailbox]/      
│       │   └── page.tsx
│       ├── docs/           
│       │   └── page.tsx
│       ├── api/            
│       │   ├── domains/
│       │   ├── inbox/
│       │   ├── mail/
│       │   └── uptime/
│       ├── globals.css      
│       ├── layout.tsx      
│       └── page.tsx         
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Support & Donation

If you find this project helpful and want to support its maintenance and infrastructure:

[![Donate via WarungErik](https://img.shields.io/badge/Support-Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=000000)](https://warungerik.com/payment)

Direct link: [https://warungerik.com/payment](https://warungerik.com/payment)

---

## License

This project is licensed under the MIT License.
