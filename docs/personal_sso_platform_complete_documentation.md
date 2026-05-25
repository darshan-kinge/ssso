# Personal SSO Platform Documentation

# Project Name

## Working Title
OneAuth

## Tagline
Simple developer-friendly authentication platform for personal projects and internal applications.

---

# 1. Product Requirements Document (PRD)

# Overview

OneAuth is a lightweight personal Single Sign-On (SSO) platform designed for developers who maintain multiple applications, dashboards, websites, APIs, and mobile apps.

The primary goal is to eliminate repeated authentication implementation across projects while keeping integration extremely simple.

The platform is intentionally designed to:
- stay minimal
- remain developer-friendly
- be deployable entirely on Vercel
- work serverlessly
- support MERN stack applications
- support web + Android + VR apps

This is NOT intended to compete with enterprise identity providers.

It is an internal developer platform focused on simplicity and speed.

---

# Problem Statement

Developers building multiple projects often face:

- repeated login/signup implementation
- duplicated JWT handling
- separate user databases
- fragmented session management
- inconsistent authentication flows
- repeated password reset/email verification logic

Managing authentication separately for every project creates unnecessary maintenance overhead.

---

# Goals

## Primary Goals

- Single login across all applications
- Extremely easy integration
- Serverless-first architecture
- Centralized authentication management
- Minimal configuration
- Fast deployment on Vercel
- JWT-based authentication
- Shared user identity across projects

---

# Non Goals

The following are intentionally excluded from V1:

- Enterprise SAML
- LDAP integration
- Complex RBAC engines
- Multi-region infrastructure
- Organization management
- Marketplace integrations
- Social login
- OAuth provider support for third-party developers
- Billing/subscriptions
- Fine-grained enterprise permissions

---

# Target Users

## Primary User

Independent developers managing multiple projects.

## Secondary Users

- Startup founders
- Internal tool developers
- Freelancers
- Developers maintaining multiple admin panels
- Developers building mobile + web ecosystems

---

# Core Features

## Authentication

- Login
- Signup
- Logout
- Password reset
- Email verification
- Session management
- Refresh token rotation

---

## SSO

- Shared authentication across apps
- Central auth domain
- Redirect-based authentication
- Token issuance

---

## Dashboard

- Register applications
- Manage redirect URLs
- Generate API keys
- Manage sessions
- View devices

---

## SDKs

### JavaScript SDK

- login()
- logout()
- getUser()
- getToken()
- auth middleware

### React SDK

- useAuth()
- AuthProvider
- ProtectedRoute

### Android SDK

- login()
- token handling
- session management

---

# Functional Requirements

## User Authentication

### Signup

Users can:
- create account using email/password
- verify email
- securely store password

### Login

Users can:
- login using credentials
- receive access token
- receive refresh token
- maintain session across apps

### Logout

Users can:
- logout from current device
- logout from all devices

---

# Session Requirements

- Maintain active sessions
- Refresh token rotation
- Session expiration
- Device identification
- Token revocation

---

# Application Management

Users can:
- create apps
- assign redirect URLs
- generate client IDs
- generate secrets
- revoke secrets

---

# Developer Experience Requirements

## Integration Simplicity

Target:

Under 5 minutes integration.

---

## Minimal Configuration

Required configuration:

```env
AUTH_URL=
CLIENT_ID=
CLIENT_SECRET=
```

---

## Simple SDK API

Example:

```js
const user = useAuth()
```

```js
app.use(auth())
```

---

# Non Functional Requirements

## Performance

- API response under 300ms
- Fast JWT verification
- Low cold start impact

## Scalability

- Support multiple apps
- Stateless APIs
- Horizontal scalability via serverless

## Reliability

- Token validation consistency
- Session persistence
- Refresh token integrity

## Security

- Hashed passwords
- HTTPS only
- Short-lived access tokens
- Rotating refresh tokens
- CSRF protection
- Secure cookies

---

# Success Metrics

- Single login across all apps
- Less than 5 minute integration
- Reduced duplicated auth logic
- Stable session persistence
- Minimal auth-related maintenance

---

# Future Scope

## Phase 2

- QR login
- Magic links
- Passkeys
- Device approvals
- Login notifications

## Phase 3

- OAuth/OpenID compatibility
- Team accounts
- Roles/permissions
- Self-hosting templates

---

---

# 2. Technical Requirements Document (TRD)

# Technical Overview

OneAuth will be developed using a serverless MERN-based architecture optimized for deployment on Vercel.

The system should remain:
- stateless
- scalable
- modular
- lightweight

---

# Technology Stack

## Frontend

### Dashboard

- Next.js
- React
- TypeScript
- TailwindCSS

---

## Backend

### API Layer

- Next.js API Routes
OR
- Vercel Functions

---

## Database

### Primary Database

MongoDB Atlas

Collections:
- users
- apps
- sessions
- refresh_tokens
- verification_tokens
- password_reset_tokens

---

## Authentication

- JWT access tokens
- Refresh tokens
- HTTP-only cookies
- bcrypt password hashing

---

## Hosting

### Platform

Vercel

### Database Hosting

MongoDB Atlas

---

# Serverless Constraints

Because Vercel serverless functions are stateless:

- No in-memory sessions
- No WebSocket dependency
- No persistent local storage
- No long-running background jobs

All session state must persist in database.

---

# API Design

# Authentication APIs

## POST /api/auth/signup

Creates new user.

### Request

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

---

## POST /api/auth/login

Authenticates user.

### Response

```json
{
  "accessToken": "jwt",
  "user": {}
}
```

---

## POST /api/auth/logout

Invalidates current session.

---

## POST /api/auth/refresh

Rotates refresh token.

---

## GET /api/auth/me

Returns authenticated user.

---

# App Management APIs

## POST /api/apps

Creates application.

---

## GET /api/apps

Returns user applications.

---

## PATCH /api/apps/:id

Updates redirect URLs.

---

# Database Design

# users

```json
{
  "_id": "ObjectId",
  "email": "string",
  "passwordHash": "string",
  "isVerified": true,
  "createdAt": "date"
}
```

---

# apps

```json
{
  "_id": "ObjectId",
  "ownerId": "ObjectId",
  "name": "string",
  "clientId": "string",
  "clientSecret": "string",
  "redirectUrls": [],
  "createdAt": "date"
}
```

---

# sessions

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "device": "string",
  "refreshTokenHash": "string",
  "expiresAt": "date",
  "createdAt": "date"
}
```

---

# JWT Strategy

## Access Token

### Properties

- Short lived
- 15 minutes expiration
- Signed JWT
- Stateless

### Contains

```json
{
  "sub": "user_id",
  "email": "email",
  "appId": "app_id"
}
```

---

## Refresh Token

### Properties

- Long lived
- Stored in DB
- Rotated on refresh
- Hashed before storage

---

# Authentication Flow

1. User logs into auth platform
2. Server validates credentials
3. Access token generated
4. Refresh token generated
5. Refresh token stored in DB
6. Access token returned to client
7. Refresh token stored in HTTP-only cookie

---

# Security Requirements

## Password Security

- bcrypt hashing
- minimum password validation
- password reset expiry

---

## Token Security

- short-lived JWTs
- refresh token rotation
- token revocation
- hashed refresh token storage

---

## API Security

- rate limiting
- CORS validation
- redirect URL validation
- secure cookies
- HTTPS enforcement

---

# SDK Architecture

# JavaScript SDK

## Functions

```js
login()
logout()
getUser()
getToken()
refreshSession()
```

---

# React SDK

## Components

```js
<AuthProvider>
<ProtectedRoute>
```

## Hooks

```js
useAuth()
```

---

# Deployment Requirements

# Vercel Environment Variables

```env
MONGODB_URI=
JWT_SECRET=
REFRESH_SECRET=
NEXT_PUBLIC_AUTH_URL=
```

---

# Build Requirements

- TypeScript strict mode
- ESLint
- Prettier
- Edge compatible where possible

---

# Monitoring

## Logging

- login attempts
- failed auth
- token refresh failures
- session revocations

---

# Future Technical Enhancements

- Redis caching
- Edge middleware auth
- Multi-factor authentication
- Passkeys/WebAuthn
- Device trust system

---

---

# 3. System Design Documentation

# High Level System Design

The platform follows a centralized authentication architecture.

Applications trust OneAuth as the identity provider.

---

# System Components

## Components

1. Auth Server
2. Dashboard
3. SDK Layer
4. MongoDB Database
5. Client Applications

---

# Component Responsibilities

# Auth Server

Responsible for:
- login
- signup
- token issuance
- session validation
- refresh token rotation
- logout

---

# Dashboard

Responsible for:
- app registration
- redirect URL management
- client secret generation
- session/device viewing

---

# SDK Layer

Responsible for:
- token management
- auth helpers
- route protection
- API middleware

---

# MongoDB

Responsible for:
- users
- apps
- sessions
- refresh tokens
- verification tokens

---

# Client Apps

Responsible for:
- redirecting user to auth server
- consuming JWT
- protecting routes

---

# Authentication Design

# Login Flow

1. User visits app
2. App checks authentication
3. User redirected to auth platform
4. User logs in
5. Auth platform generates tokens
6. User redirected back
7. App stores access token
8. User authenticated

---

# Refresh Flow

1. Access token expires
2. App calls refresh endpoint
3. Refresh token validated
4. New access token issued
5. Old refresh token revoked
6. New refresh token generated

---

# Logout Flow

1. User clicks logout
2. Session invalidated
3. Refresh token revoked
4. Cookies cleared
5. User redirected

---

# Serverless Design

# Key Principles

- Stateless APIs
- DB-backed sessions
- No persistent memory
- Independent functions
- Horizontal scaling

---

# Why Serverless Works Well Here

Authentication APIs are:
- short-lived
- lightweight
- request-response based
- ideal for serverless execution

---

# Scalability Design

# Scaling Strategy

Because Vercel auto-scales:

- functions scale automatically
- auth endpoints remain stateless
- database handles persistence

---

# Bottlenecks

Potential bottlenecks:

- database connections
- token verification load
- cold starts

---

# Optimization Strategy

## MongoDB Connection Pooling

Reuse connections globally.

---

## Lightweight JWT Verification

Avoid DB hit for every request.

---

## Edge Middleware

Future optimization.

---

# Failure Handling

# Possible Failures

- expired token
- invalid refresh token
- revoked session
- database downtime

---

# Recovery Strategy

- refresh retries
- forced re-login
- graceful auth failure handling

---

# Security Design

# Threats

- token theft
- replay attacks
- CSRF
- redirect abuse
- credential stuffing

---

# Mitigation

- secure cookies
- rotating refresh tokens
- redirect validation
- rate limiting
- HTTPS only
- hashed token storage

---

# Recommended Folder Structure

```txt
/apps
  /dashboard
  /docs
/packages
  /auth-sdk-js
  /auth-sdk-react
  /shared
/services
  /auth
```

---

# Suggested Monorepo Setup

Use:

- Turborepo
OR
- pnpm workspace

Benefits:
- shared SDK code
- shared types
- easier deployment
- reusable utilities

---

---

# 4. Architecture Documentation

# Architecture Style

## Pattern

Centralized Authentication Architecture

---

# Architecture Overview

```txt
+-------------------+
| Client Apps       |
| Web / Mobile / VR |
+---------+---------+
          |
          v
+-------------------+
| OneAuth SDK       |
+---------+---------+
          |
          v
+-------------------+
| Auth API Layer    |
| Vercel Functions  |
+---------+---------+
          |
          v
+-------------------+
| MongoDB Atlas     |
+-------------------+
```

---

# Frontend Architecture

# Dashboard Layers

## UI Layer

- Pages
- Components
- Forms

---

## State Layer

- Auth Context
- Session State
- API State

---

## Service Layer

- API client
- Token handling
- Session refresh

---

# Backend Architecture

# API Layers

## Route Layer

Handles:
- validation
- request parsing
- auth checks

---

## Service Layer

Handles:
- business logic
- token generation
- session management

---

## Data Layer

Handles:
- MongoDB queries
- indexes
- persistence

---

# Authentication Architecture

# Session Model

Hybrid token architecture.

## Access Token

Stateless.

## Refresh Token

Stateful.

---

# Why Hybrid?

Benefits:

- fast API auth
- secure session control
- revocable sessions
- scalable architecture

---

# Client Integration Architecture

# Integration Flow

```txt
Client App
   |
   | Redirect
   v
OneAuth Login
   |
   | JWT Issued
   v
Client Receives Token
   |
   | API Calls
   v
Protected Backend
```

---

# Mobile/VR Architecture

# Recommended Flow

Use browser-based authentication.

## Flow

1. Open login URL
2. Authenticate in browser
3. Deep link back into app
4. Store token securely

---

# Why This Approach?

Benefits:

- simpler security
- less credential handling
- better UX
- easier maintenance

---

# Recommended Storage

# Web

- HTTP-only cookies

# Android/VR

- encrypted shared preferences
- Android Keystore

---

# API Middleware Architecture

# Middleware Responsibilities

- verify JWT
- decode claims
- attach user context
- reject invalid tokens

---

# Example Middleware

```js
app.use(auth())
```

---

# Recommended Packages

## Backend

- jsonwebtoken
- bcryptjs
- zod
- mongoose
- cookie

---

## Frontend

- react-hook-form
- axios
- zustand

---

---

# 5. User Flow Documentation

# Primary User Journey

# Initial Setup Flow

## Step 1

Developer creates OneAuth account.

---

## Step 2

Developer creates new application.

Input:
- app name
- redirect URL

---

## Step 3

System generates:
- client ID
- client secret

---

## Step 4

Developer installs SDK.

```bash
npm install @oneauth/react
```

---

## Step 5

Developer adds provider.

```js
<AuthProvider>
```

---

## Step 6

Authentication enabled.

---

# User Authentication Flow

# Web Flow

```txt
User Opens App
       |
       v
App Checks Session
       |
       v
Not Logged In
       |
       v
Redirect To OneAuth
       |
       v
User Logs In
       |
       v
Token Generated
       |
       v
Redirect Back
       |
       v
App Authenticated
```

---

# Existing Session Flow

```txt
User Opens Second App
       |
       v
Redirect To OneAuth
       |
       v
Existing Session Found
       |
       v
Instant Redirect Back
       |
       v
Authenticated Automatically
```

---

# Refresh Token Flow

```txt
Access Token Expired
       |
       v
Client Calls Refresh API
       |
       v
Refresh Token Verified
       |
       v
New Tokens Issued
       |
       v
Session Continues
```

---

# Logout Flow

```txt
User Clicks Logout
       |
       v
Session Revoked
       |
       v
Refresh Token Removed
       |
       v
Cookies Cleared
       |
       v
User Logged Out
```

---

# Dashboard Flow

# Create App

```txt
Dashboard
   |
   v
Create App
   |
   v
Enter Redirect URL
   |
   v
Generate Credentials
   |
   v
Copy SDK Config
```

---

# Device Management Flow

```txt
Dashboard
   |
   v
Sessions Page
   |
   v
View Devices
   |
   v
Revoke Session
```

---

# Future QR Login Flow

```txt
VR Headset Shows QR
        |
        v
User Scans QR
        |
        v
Phone Browser Opens Login
        |
        v
User Authenticates
        |
        v
Headset Receives Session
        |
        v
Logged In Successfully
```

---

# UX Principles

## Simplicity First

Users should:
- avoid repeated login
- avoid repeated signup
- authenticate quickly
- integrate in minutes

---

# Developer Experience Principles

## Goals

- minimal boilerplate
- predictable APIs
- clean SDKs
- low setup time
- easy debugging

---

# Productization Strategy Documentation

# Long-Term Vision

OneAuth should initially be developed as a personal/internal authentication platform while maintaining a product-ready architecture.

The system should remain:
- simple in implementation
- scalable in structure
- modular in design
- developer-first in experience

The goal is to avoid rewriting the entire platform if productization happens later.

---

# Productization Philosophy

The platform should follow this approach:

## Phase 1

Internal developer tool.

Focus:
- solving personal authentication pain points
- reducing duplicated auth implementation
- improving developer experience
- supporting personal ecosystem

---

## Phase 2

Developer-ready platform.

Focus:
- cleaner SDKs
- improved dashboard
- better documentation
- reusable integrations
- improved onboarding

---

## Phase 3

Open-source/community release.

Focus:
- developer adoption
- GitHub visibility
- community contributions
- ecosystem feedback

---

## Phase 4

Hosted SaaS platform.

Focus:
- multi-tenancy
- billing
- organization support
- hosted infrastructure
- scaling

---

# Product-Ready Architectural Decisions

Even for V1, the following architectural principles should be followed.

---

# Multi-Tenant Ready Design

Although V1 is single-user oriented, database models should support future multi-tenancy.

---

# Recommended Data Ownership Model

```txt
Workspace
   |
   +-- Users
   +-- Applications
   +-- Sessions
   +-- API Keys
```

---

# Example Multi-Tenant Structure

## users

```json
{
  "workspaceId": "ObjectId",
  "email": "user@example.com"
}
```

---

## apps

```json
{
  "workspaceId": "ObjectId",
  "name": "My App"
}
```

---

# Why This Matters

Benefits:

- easier product transition
- avoids painful migrations
- supports teams later
- enables organization accounts

---

# API Architecture Requirements

APIs should remain stable and SDK-first.

Frontend applications should NEVER directly depend on database structures.

---

# Recommended Layering

```txt
SDK
  -> API
      -> Service Layer
          -> Database
```

---

# Why This Matters

Benefits:

- safer refactoring
- easier SDK maintenance
- easier versioning
- cleaner abstraction

---

# SDK Product Strategy

SDKs are the most important product surface.

The dashboard is secondary.

Developer experience becomes the main differentiator.

---

# Recommended SDK Structure

```txt
/packages
  /sdk-core
  /sdk-react
  /sdk-node
  /sdk-nextjs
  /sdk-android
```

---

# SDK Design Principles

## Goals

- minimal setup
- predictable APIs
- low boilerplate
- framework-friendly
- strong TypeScript support

---

# Example Desired Integration

```js
const user = useAuth()
```

```js
app.use(auth())
```

Integration should ideally take under 5 minutes.

---

# Authentication Standardization

Even if simplified internally, OneAuth should use OAuth-inspired terminology.

---

# Recommended Terminology

Use:
- client_id
- client_secret
- redirect_uri
- authorization_code
- access_token
- refresh_token

Avoid:
- custom naming conventions
- non-standard token flows
- tightly coupled authentication hacks

---

# Why This Matters

Benefits:

- easier developer understanding
- future OAuth compatibility
- easier migration path
- easier documentation

---

# Future SaaS Architecture Evolution

# V1 Architecture

```txt
Vercel + MongoDB Atlas
```

Suitable for:
- personal use
- low traffic
- MVP deployment
- internal projects

---

# V2 Architecture

Potential additions:

- Redis caching
- email queue system
- analytics
- rate limiting
- organization support
- audit logs

Still fully manageable on serverless infrastructure.

---

# V3 Architecture

Potential future scaling:

- edge authentication
- regional deployments
- dedicated auth services
- observability stack
- distributed token services

This stage should only happen if real scale exists.

---

# Product Differentiation Strategy

OneAuth should NOT compete directly with:

- entity["company","Auth0","Identity platform"]
- entity["company","Clerk","Authentication platform"]
- entity["company","Firebase","Backend-as-a-service platform"]

Instead, positioning should focus on:

- lightweight developer auth
- indie hacker workflows
- minimal setup authentication
- mobile-first auth
- VR authentication workflows
- self-hostable simplicity

---

# Unique Product Opportunities

# VR Authentication

Potential niche advantages:

- QR-based headset login
- cross-device authentication
- VR session management
- deep-link authentication
- mobile-to-headset authentication

This area currently has limited competition.

---

# Open Source Strategy

Open sourcing the platform later can:

- improve trust
- increase adoption
- attract contributors
- improve visibility
- validate product-market fit

---

# Recommended Licensing Strategy

## Early Stage

Private/internal repository.

---

## Growth Stage

Open-source core.

---

## SaaS Stage

Hosted premium offering.

---

# Productization Readiness Checklist

The platform should eventually support:

- multi-tenancy
- organization accounts
- API versioning
- scalable SDKs
- audit logs
- usage analytics
- rate limiting
- email infrastructure
- documentation site
- hosted deployment

---

# Important Engineering Principle

Do NOT prematurely build enterprise features.

Instead:

- keep implementation minimal
- keep architecture extensible
- prioritize developer experience
- evolve based on actual usage

---

# Final Recommendation

The best long-term approach for OneAuth is:

- build it first as a personal platform
- structure it like a future product
- optimize heavily for developer experience
- keep deployment serverless-first
- avoid enterprise complexity
- focus on simplicity and usability

V1 should primarily solve:

"I want authentication across all my projects with minimum effort."

Everything else can evolve incrementally.

