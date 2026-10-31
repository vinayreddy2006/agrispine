# AgriSpine Agent Guidelines & Developer Instructions

All AI coding assistants, automated agents, and developers contributing to AgriSpine must strictly follow the rules and architecture defined in this repository.

---

## 1. Permanent UI/UX Standards (Mandatory)

**Every new and existing feature MUST consult and strictly enforce [`docs/UX_STANDARDS.md`](./docs/UX_STANDARDS.md).**

Do not introduce ad-hoc styles, raw spinning loaders, unhandled error states, or blank views. The following 10 UI/UX principles are mandatory across all pages and modules:

1. **Empty State**: Never leave lists or pages blank. Always explain *why* data is absent, what action the farmer can take next, and provide a direct primary action button. Use `frontend/src/components/ui/EmptyState.jsx`.
2. **Loading State**: Render structural skeletons matching the layout geometry of the actual content (`CardSkeleton`, `StatCardSkeleton`, `PostSkeleton`, `TableRowSkeleton`, `CalendarSkeleton` in `frontend/src/components/ui/LoadingSkeleton.jsx`). Never use full-screen raw spinners as the sole loading indicator.
3. **Error State**: Provide clear, farmer-friendly explanations. Never expose technical stack traces or raw database codes. Always provide an `onRetry` recovery button and safe return navigation. Use `frontend/src/components/ui/ErrorState.jsx`.
4. **No Internet**: Respect offline conditions. The application mounts `OfflineBanner.jsx` and uses `useNetworkStatus.js`. When offline, advise the user that cached data is being displayed and retry connections cleanly.
5. **Slow Network**: Ensure non-blocking experiences. All submit buttons must be disabled during active mutations to prevent duplicate submissions (`disabled={loading}`).
6. **No Search Results**: When searches or filters yield zero records, echo the user's query, provide specific tips, and provide a single-click reset button. Use `frontend/src/components/ui/NoSearchResults.jsx`.
7. **Permission Denied**: Clearly describe the required role or ownership needed to access the feature and provide safe fallback navigation. Use `frontend/src/components/ui/PermissionDenied.jsx`.
8. **Session Expired**: Centrally catch 401 and `"jwt expired"` errors in `frontend/src/utils/api.js`. Preserve active form drafts in `sessionStorage` and redirect to `/login?redirect=...`.
9. **Form Validation**: Present immediate inline correction messages directly beneath invalid fields (`InlineFormError.jsx`). Dismiss errors as soon as the user edits the input. Validate both client-side and server-side.
10. **Success State**: Confirm actions with clear visual feedback, reference numbers, and logical next steps. Use `frontend/src/components/ui/SuccessState.jsx`.

---

## 2. Reusable UI Components Directory

All standardized UI/UX components are located in:
- `frontend/src/components/ui/EmptyState.jsx`
- `frontend/src/components/ui/LoadingSkeleton.jsx` (CardSkeleton, StatCardSkeleton, PostSkeleton, TableRowSkeleton, CalendarSkeleton)
- `frontend/src/components/ui/LoadingState.jsx`
- `frontend/src/components/ui/ErrorState.jsx`
- `frontend/src/components/ui/NoSearchResults.jsx`
- `frontend/src/components/ui/PermissionDenied.jsx`
- `frontend/src/components/ui/InlineFormError.jsx`
- `frontend/src/components/ui/SuccessState.jsx`
- `frontend/src/components/common/OfflineBanner.jsx`
- `frontend/src/hooks/useNetworkStatus.js`

---

## 3. Full-Stack Integrity Rules

- **Do Not Break Existing Functionality**: Verify that existing routes, translations (`react-i18next`), dark mode classes, and backend schemas remain intact.
- **Verification Requirement**: Before marking any task complete, always verify that the frontend builds cleanly without errors (`npm --prefix frontend run build`) and server syntax checks pass.

