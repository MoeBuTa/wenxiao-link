// Feature flags for optionally-shipped surfaces.
//
// QA_ENABLED is the single switch for the whole Q&A feature: the /qa board,
// public self-registration (/register), the "Q&A" nav link, and the
// post-login redirect target. It is OFF for now — the backend `qa` app,
// /api/qa endpoints, and existing comment data are left intact, so flipping
// this back to `true` restores the feature without any further work.
export const QA_ENABLED = false;
