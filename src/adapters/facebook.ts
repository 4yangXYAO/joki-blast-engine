/**
 * FacebookAdapter — cookie-based posting via m.facebook.com mobile endpoint.
 *
 * Credentials stored in the `accounts` table as a raw browser session cookie string:
 *   c_user=12345; xs=abc; datr=xyz; sb=...
 *
 * The adapter:
 *  1. Parses cookies via parseCookies() (supports plain string or JSON array)
 *  2. GETs m.facebook.com to extract fb_dtsg and c_user
 *  3. POSTs to /a/home.php with xhpc_message_text
 *
 * Replaces the former Graph API adapter (pageId + accessToken) as of 2026-04-30.
 * See docs/decisions/ADR-0006-facebook-cookie-auth.md for rationale.
 */
export { FacebookAdapter, FacebookAdapter as default } from './providers/meta/facebook/facebook'
