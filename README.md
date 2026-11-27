# 🩸 AeroAid - Aviation Blood Donation Network

> **Making a life-saving difference in the aviation community of Bangladesh**

AeroAid is a specialized blood donation platform that connects aviation students and airline professionals across Bangladesh. Our mission is to ensure that no one in our aviation community is left in need during medical emergencies.

## 🎯 Project Overview

AeroAid serves as a comprehensive blood donation network specifically designed for:

- **Aviation Students** from various training institutes
- **Airline Professionals** working in the aviation industry
- **Community Members** supporting the aviation sector

The platform facilitates quick and efficient blood donor searches, helping save lives within our tight-knit aviation community in Dhaka and beyond.

## ✨ Key Features

### 🔍 **Smart Donor Search**

- Search donors by blood group
- Filter by geographical area for quick local matches
- Real-time availability status

### 👤 **User Management**

- Secure user authentication and registration
- Comprehensive donor profiles with contact information
- Profile picture upload and management
- Personal donation history tracking

### 🛡️ **Protected Dashboard**

- Personalized user dashboard
- Donation request management
- Invitation system for new donors
- Account settings and preferences

### 📱 **Modern Interface**

- Responsive design for all devices
- Dark theme with aviation-inspired aesthetics
- Intuitive user experience
- Fast loading and smooth navigation

## 🛠️ Tech Stack

- **[Nuxt 4](https://nuxt.com)** (Vue 3, TypeScript): pages, layouts and components are Vue single-file components
- **[Supabase](https://supabase.com)** via [`@nuxtjs/supabase`](https://supabase.nuxtjs.org): auth (email codes), Postgres with row-level security, storage for avatars
- **Tailwind CSS v4**: dark-only theme with design tokens in `app/assets/css/main.css`
- **anime.js**: animated logo · **Zod**: form validation
- **Vercel**: hosting (Nuxt is auto-detected)

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- Access to the Supabase project

### Setup

```bash
git clone https://github.com/YouthNotion/AeroAid.git
cd AeroAid
npm install
cp .env.example .env   # then fill in SUPABASE_URL and SUPABASE_KEY
npm run dev            # http://localhost:3000
```

`SUPABASE_KEY` is the project's anon/publishable key (Project Settings → API). On Vercel, set the same two variables in the project's environment settings.

### Database

Schema changes live in `supabase/migrations/` and are applied to the hosted project (SQL Editor or `supabase db push`). `supabase/schema.sql` is a reconstructed reference of the original tables. Regenerate `app/types/database.types.ts` after schema changes (`supabase gen types typescript --linked`).

Auth email templates (code-based sign-up, password reset, email change) are in `supabase/templates/`.

## 📁 Project Structure

```
app/
├── pages/          # routes (search, login, signup, verify, profile, requests, …)
├── components/     # UI components (DonorCard, PhoneInput, OtpInput, AvatarCropper, …)
├── layouts/        # default + landing layouts
├── composables/    # useMyProfile, useToast
├── utils/options.ts# blood groups and areas
├── types/          # generated Supabase database types
└── assets/css/     # Tailwind theme
public/             # logo, icons, fonts, images
supabase/           # migrations, email templates, schema reference
docs/FEATURES.md    # feature inventory from v1
```

## 🔐 Authentication & Security

- **Secure Authentication** via Supabase Auth
- **Row Level Security** protecting user data
- **Protected Routes** for authenticated users only
- **Input Validation** using Zod schemas
- **Image Upload Security** with compression and validation

## 🌟 Core Functionality

### For Donors

- **Register** as a blood donor
- **Update** availability status
- **Manage** personal information
- **Track** donation history

### For Recipients

- **Search** for compatible donors
- **Contact** donors directly
- **Create** donation requests
- **Manage** request history

### For Administrators

- **Monitor** platform activity
- **Manage** user accounts
- **Oversee** donation requests
- **Generate** reports

## 🤝 Contributing

We welcome contributions from the aviation community! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Development Scripts

```bash
npm run dev           # dev server with hot reload
npm run build         # production build
npm run preview       # preview the production build
npm run typecheck     # vue-tsc type checking
npm run format        # format with Prettier
npm run format:check  # check formatting
```

## 🐛 Known Issues & Roadmap

### Current Issues

- Mobile optimization for team section
- Search and landing counts load all profiles at once (fine now; paginate past ~1,000 donors)

### Upcoming Features

- [ ] SMS notifications for urgent requests
- [ ] Blood bank integration
- [ ] Mobile app development
- [ ] Multi-language support (Bengali/English)
- [ ] Advanced analytics dashboard

Made with ❤️ by **[Youth Notion](https://youthnotion.orgs.bd)** - Empowering Youth Through Civic Awareness and Technology

---
