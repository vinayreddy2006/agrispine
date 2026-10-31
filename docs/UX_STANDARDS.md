# AgriSpine UI/UX Design Standards & Permanent Guidelines

This document defines the **10 Mandatory UI/UX Principles** that govern all frontend and full-stack development across the AgriSpine platform. Every existing and newly developed feature, component, modal, or page must strictly comply with these standards.

---

## 1. Empty State — Explain Why and Guide the Next Step

Whenever a page, section, list, or component has no data, **never leave it blank or display only a generic message**.

### Requirements
1. **Explain Why It Is Empty**: Clearly state why there are no records (e.g. "You haven't added any crops for the current Kharif season yet").
2. **Actionable Next Step**: State what action will populate this area (e.g. "Add your crop to receive daily weather alerts and mandi price predictions").
3. **Primary Action Button**: Provide a direct CTA button (e.g. `Add Crop`, `Explore Machinery`, `Create Workgroup`).
4. **Contextual Farming Guidance**: Include a short tip explaining how the feature benefits the farmer.

### Standard Component
`frontend/src/components/ui/EmptyState.jsx`

```jsx
<EmptyState 
  title="No Active Crops Recorded"
  description="Your registered crops will appear here along with growth stages and advisory."
  tip="Recording your crops unlocks AI pest diagnostics and targeted mandi rate alerts."
  icon={Sprout}
  actionText="Add My First Crop"
  onAction={() => navigate("/add-crop")}
/>
```

---

## 2. Loading State — Structural Skeletons over Raw Spinners

Avoid blocking full screens with generic spinning loaders (`Loader2`, `animate-spin`). Use **structural skeletons matching the exact shape of the expected content** to minimize perceived latency and layout shift.

### Requirements
1. **Shape Fidelity**: Match the card, table row, stat box, or calendar layout of the loaded content.
2. **Pulse Animation**: Use subtle pulsing backgrounds (`animate-pulse bg-gray-200 dark:bg-slate-700/60`).
3. **Responsive Grid**: Ensure the skeleton matches the exact breakpoints (e.g., `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).

### Standard Components
`frontend/src/components/ui/LoadingSkeleton.jsx`
- `<CardSkeleton count={N} />` — For machinery listings, crop cards, government schemes.
- `<StatCardSkeleton count={N} />` — For metrics and dashboard summary cards.
- `<PostSkeleton count={N} />` — For Community feed questions and discussion cards.
- `<TableRowSkeleton rows={N} cols={M} />` — For Mandi rates, workgroup attendance tables, and ledger logs.
- `<CalendarSkeleton />` — For equipment rental booking schedules.

---

## 3. Error State — Meaningful Explanation & Clear Recovery Actions

Never show raw JavaScript error strings, internal status codes (e.g., `500 Internal Server Error`), or database stack traces to the user.

### Requirements
1. **Farmer-Friendly Message**: Use clear agricultural or plain-language descriptions (e.g., "Unable to connect to the mandi auction rate server").
2. **Clear Recovery Action (`onRetry`)**: Always supply a retry button that re-triggers the specific API fetch without forcing a full browser refresh.
3. **Safe Navigation**: Offer a secondary fallback button (e.g., "Return to Dashboard" or "Go Back").
4. **Preserve User Inputs**: If an error occurs during form submission or payment, keep the user's entered fields intact so they never have to retype information.

### Standard Component
`frontend/src/components/ui/ErrorState.jsx`

```jsx
<ErrorState
  title="Unable to Load Mandi Rates"
  message="Could not retrieve today's modal auction prices. Please check your network and try again."
  onRetry={fetchPrices}
  retryText="Retry Mandi Connection"
  showHome={true}
/>
```

---

## 4. No Internet — Proactive Offline Detection & Cached Guidance

Agricultural users frequently experience spotty 2G/3G connectivity in rural areas. The application must remain resilient and inform the user of network status.

### Requirements
1. **Global Sticky Banner**: When offline, display a persistent top banner indicating offline status.
2. **Cached Data Clarification**: Inform the user: *"Offline Mode — displaying saved data where available. Actions will synchronize once reconnected."*
3. **Manual & Automatic Reconnection**: Provide a "Check Connection" button and automatically hide the banner with a temporary green *"Internet connection restored"* banner when `online` fires.
4. **Form Guarding**: Inform the user before they submit data requiring online server confirmation.

### Standard Components
- `frontend/src/hooks/useNetworkStatus.js`
- `frontend/src/components/common/OfflineBanner.jsx` (mounted globally in `AppLayout.jsx`)

---

## 5. Slow Network — Responsive Feedback & Double-Submission Prevention

Rural mobile connections can experience high latency (>1500ms RTT) or throttled speeds.

### Requirements
1. **Prevent Duplicate Submissions**: All submit buttons must be automatically disabled with a loading spinner while requests are pending (`disabled={loading}`).
2. **Timeout Handling**: Centralized API clients must enforce sensible timeouts (25 seconds) to avoid indefinite hanging.
3. **Non-Blocking UI**: Background data refreshes should use subtle spinners (`refreshing`) while leaving existing cached data readable.

---

## 6. No Search Results — Query Context, Suggestions & Quick Reset

When searching or filtering yields zero matches, do not display a generic empty state.

### Requirements
1. **Show Exact Query**: Echo back what the user searched for: *"No matches found for 'Paddy in Warangal'"*.
2. **Search Suggestions**: Provide 2-3 specific tips (e.g. check spelling, use broader terms like 'Tractor' instead of model number, or broaden location filter).
3. **Single-Click Reset**: Provide a "Clear Search & Filters" button that resets all filters back to default.

### Standard Component
`frontend/src/components/ui/NoSearchResults.jsx`

```jsx
<NoSearchResults
  query={searchQuery}
  onClear={handleResetFilters}
  suggestions={[
    "Check for spelling mistakes in the crop or equipment name",
    "Switch the location filter to 'All Locations' to see nearby machinery",
    "Clear price filters to view the complete catalog"
  ]}
/>
```

---

## 7. Permission Denied — Access Requirement & Safe Pathways

When a user attempts to access a protected action or page (e.g., managing workgroup labor without admin privileges or accessing machine owner operations):

### Requirements
1. **Explain the Requirement**: Clearly specify why access is restricted (e.g., *"This section requires Workgroup Administrator privileges"*).
2. **Required Role Badge**: Highlight the role needed (`Required Role: Group Admin`).
3. **Safe Navigation**: Offer a path back to safe pages (Dashboard, Home, or Switch Account).

### Standard Component
`frontend/src/components/ui/PermissionDenied.jsx`

```jsx
<PermissionDenied
  title="Group Admin Privileges Required"
  message="You do not currently manage this workgroup. Only assigned group admins can finalize daily wages."
  requiredRole="Workgroup Admin"
/>
```

---

## 8. Session Expired — Graceful Re-Authentication & Draft Preservation

When an authentication token expires (`jwt expired`, `401 Unauthorized`), the application must never throw uncaught exceptions or leave the user on a broken page.

### Requirements
1. **Centralized Detection**: Intercept 401 and `"jwt expired"` responses globally in `frontend/src/utils/api.js`.
2. **Clear Notification**: Display modal: *"Your login session has expired. For your security, please log in again."*
3. **Preserve Draft Form**: Automatically snapshot active form fields to `sessionStorage` (`agrispine_draft_backup`) so the user's progress is not lost.
4. **Seamless Redirect**: Redirect to `/login?redirect=${encodeURIComponent(currentPath)}` so upon login the user returns directly to their work.

---

## 9. Form Validation — Immediate Inline Feedback & Proactive Help

Never rely solely on full-page error alerts or generic "Submission failed" messages.

### Requirements
1. **Inline Field Errors**: Place clear, red explanatory text directly beneath the invalid input.
2. **Explain How to Fix**: Tell the user exactly what is needed (e.g., *"Please specify a valid base price greater than ₹0"* rather than *"Invalid price"*).
3. **Clear on Fix**: Automatically dismiss the field error as soon as the user starts correcting the input (`onChange`).
4. **Accessible Markup**: Include `role="alert"` and `aria-live="polite"` for screen readers.

### Standard Component
`frontend/src/components/ui/InlineFormError.jsx`

```jsx
<input
  name="area"
  value={formData.area}
  onChange={handleChange}
  className={`border ${errors.area ? 'border-red-400' : 'border-gray-200'}`}
/>
<InlineFormError error={errors.area} />
```

---

## 10. Success State — Explicit Confirmation & Logical Next Steps

After completing an important agricultural workflow (adding a crop, listing a machine, submitting a booking, creating a workgroup):

### Requirements
1. **Visual Confirmation**: Display a prominent success badge (`CheckCircle2`).
2. **Reference Identifier**: When applicable, display reference ID or booking code.
3. **Actionable Next Steps**: Provide direct CTAs for the user's next logical step (e.g., *"View Booking Schedule"*, *"Open Machinery Fleet"*, *"Go to Dashboard"*).

### Standard Component
`frontend/src/components/ui/SuccessState.jsx`

```jsx
<SuccessState
  title="Machine Listed Successfully! 🚜"
  message="Your tractor is now visible to farmers in your mandal for agricultural hire."
  referenceLabel="Machine ID"
  referenceId={machine._id}
  primaryAction={{
    label: "View in Marketplace",
    onClick: () => navigate(`/rent/details/${machine._id}`)
  }}
  secondaryAction={{
    label: "Manage Schedule",
    onClick: () => navigate(`/manage-machine/${machine._id}`)
  }}
/>
```

---

## Enforcement Checklist for Developers & Agents
Before submitting any new feature, verify against this checklist:
- [ ] No blank or generic empty states; reasons and next steps are guided.
- [ ] Structural skeletons are displayed while data is fetching.
- [ ] Network errors provide friendly text and an inline Retry button.
- [ ] Offline status is detected and guarded.
- [ ] Submit buttons prevent duplicate clicks during slow network requests.
- [ ] Empty search results show query context with suggestions and a reset CTA.
- [ ] Role restrictions explain requirements and provide return navigation.
- [ ] Expired JWT tokens trigger modal re-authentication with destination preservation.
- [ ] Form inputs display immediate inline correction messages.
- [ ] Successful actions confirm completion with logical follow-up actions.

