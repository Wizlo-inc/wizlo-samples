# Wizlo Sample App

This repository contains sample code demonstrating how to integrate the Wizlo API into a healthcare platform.

## Folder Structure

| Folder | Description |
|---|---|
| `src/` | New sample application scaffold for the Base44/Wizlo integration test app |
| `src/api` | API clients and feature-specific request modules |
| `src/components` | Reusable UI components, feature sections, and layout pieces |
| `src/entities` | JSON entity definitions for intake forms, orders, and products |
| `src/functions` | Helper functions for external services like Gr4vy and Wizlo proxies |
| `src/hooks` | Custom React hooks |
| `src/lib` | App utilities, auth context, and shared helpers |
| `src/pages` | Page-level components for admin, portal, and public routes |
| `src/utils` | TypeScript utility exports |
| `intake-form/with-wizlo` | Patient intake form integrated with Wizlo API |
| `intake-form/without-wizlo` | Patient intake form (standalone, no Wizlo) |
| `encounters` | Encounter creation flow using Wizlo |
| `orders` | Order/subscription management using Wizlo |
| `payment/with-wizlo` | Payment & subscription plan selection with Wizlo API |
| `payment/without-wizlo` | Payment UI without Wizlo (standalone) |

## Getting Started

Each folder contains its own `README.md` with setup instructions.

## Environment Variables

Copy `.env.example` to `.env` and fill in your Wizlo credentials:
```
WIZLO_BASE_URL=https://api-uat.wizlo.com
WIZLO_CLIENT_ID=your_client_id
WIZLO_CLIENT_SECRET=your_client_secret
```