"""Google Scholar profile scraper + CORE-rank annotator.

Scholar has no official API. The profile page is plain server-rendered
HTML, fetched here with a desktop User-Agent, the same request a browser
would make. Parsing sticks to the long-stable `gsc_*` ids/classes; if
Google changes them the sync fails loudly and the site keeps serving the
last good rows from Postgres.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import certifi
import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.ssl_ import create_urllib3_context

SCHOLAR_BASE = "https://scholar.google.com"
SERPAPI_BASE = "https://serpapi.com/search.json"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
PAGE_SIZE = 100
DATA_DIR = Path(__file__).resolve().parent / "data"


def _avatar_url(user_id: str) -> str:
    return (
        f"https://scholar.googleusercontent.com/citations"
        f"?view_op=medium_photo&user={user_id}&citpid=1"
    )


class ScholarFetchError(RuntimeError):
    pass


class _ClassicTLSAdapter(HTTPAdapter):
    """Pin the TLS key exchange to a classical curve.

    OpenSSL 3.5 (shipped in the API image) advertises a post-quantum hybrid
    key share (X25519MLKEM768) by default. That produces a ClientHello whose
    fingerprint Google Scholar's bot detection rejects with HTTP 429 — while
    the same request from an older OpenSSL (or a browser) succeeds. Forcing a
    single classical curve restores a normal-looking handshake. Verified: the
    default context 429s, this one returns 200.
    """

    def init_poolmanager(self, *args, **kwargs):
        ctx = create_urllib3_context()
        ctx.load_verify_locations(certifi.where())
        ctx.set_ecdh_curve("prime256v1")
        kwargs["ssl_context"] = ctx
        return super().init_poolmanager(*args, **kwargs)


_SESSION: requests.Session | None = None


def _http() -> requests.Session:
    global _SESSION
    if _SESSION is None:
        session = requests.Session()
        session.mount("https://", _ClassicTLSAdapter())
        _SESSION = session
    return _SESSION


def _load_json(name: str):
    with open(DATA_DIR / name, encoding="utf-8") as fh:
        return json.load(fh)


def _rank_table() -> list[dict]:
    # Ordered list — first matching pattern wins, so specific patterns
    # (e.g. "findings of the association for...") sit above generic ones.
    return _load_json("core_ranks.json")["venues"]


def _overrides() -> dict:
    # Manual escape hatch: lowercase title-substring -> {rank, acronym}.
    return _load_json("rank_overrides.json")


def rank_for(title: str, venue: str) -> tuple[str, str]:
    """Return (core_rank, acronym) for a publication, '' when unknown."""
    title_l = (title or "").lower()
    for needle, entry in _overrides().items():
        if needle in title_l:
            return entry.get("rank", ""), entry.get("acronym", "")

    venue_l = (venue or "").lower()
    if not venue_l:
        return "", ""
    for entry in _rank_table():
        if entry["pattern"] in venue_l:
            return entry["rank"], entry["acronym"]
    return "", ""


def _fetch_page(user_id: str, cstart: int) -> BeautifulSoup:
    try:
        resp = _http().get(
            f"{SCHOLAR_BASE}/citations",
            params={
                "hl": "en",
                "user": user_id,
                "cstart": cstart,
                "pagesize": PAGE_SIZE,
            },
            headers={"User-Agent": USER_AGENT, "Accept-Language": "en"},
            timeout=30,
        )
    except requests.RequestException as exc:
        # Normalise network failures so every caller handles one error type.
        raise ScholarFetchError(f"Scholar request failed: {exc}") from exc
    if resp.status_code != 200:
        raise ScholarFetchError(f"Scholar returned HTTP {resp.status_code}")
    if "gs_captcha" in resp.text or "unusual traffic" in resp.text:
        raise ScholarFetchError("Scholar served a captcha / rate-limit page")
    return BeautifulSoup(resp.text, "html.parser")


def _parse_int(text: str) -> int:
    digits = re.sub(r"[^\d]", "", text or "")
    return int(digits) if digits else 0


def _parse_rows(soup: BeautifulSoup) -> list[dict]:
    rows = []
    for tr in soup.select("tr.gsc_a_tr"):
        link = tr.select_one("a.gsc_a_at")
        if link is None:
            continue
        href = link.get("href", "")
        qs = parse_qs(urlparse(href).query)
        scholar_id = (qs.get("citation_for_view") or [""])[0]

        grays = tr.select("div.gs_gray")
        authors = grays[0].get_text(" ", strip=True) if len(grays) > 0 else ""
        venue = ""
        if len(grays) > 1:
            venue_div = grays[1]
            # The trailing ", 2024" lives in a nested span — drop it so the
            # venue string stays clean for CORE pattern matching.
            for span in venue_div.select("span.gs_oph"):
                span.decompose()
            venue = venue_div.get_text(" ", strip=True)

        year_el = tr.select_one("td.gsc_a_y span")
        cited_el = tr.select_one("a.gsc_a_ac")
        cited_href = cited_el.get("href", "") if cited_el else ""

        rows.append(
            {
                "scholar_id": scholar_id,
                "title": link.get_text(" ", strip=True),
                "url": f"{SCHOLAR_BASE}{href}" if href.startswith("/") else href,
                "authors": authors,
                "venue": venue,
                "year": _parse_int(year_el.get_text(strip=True)) or None if year_el else None,
                "cited_by": _parse_int(cited_el.get_text(strip=True)) if cited_el else 0,
                "cited_by_url": cited_href,
            }
        )
    return rows


def _parse_citations_by_year(soup: BeautifulSoup) -> dict[str, int]:
    """Citations received per calendar year from the "Cited by" histogram.

    The graph renders year labels (``span.gsc_g_t``, oldest→newest) separately
    from the bars (``a.gsc_g_a``), and bars are emitted only for non-zero years.
    Each bar's column is encoded in its ``z-index`` (rightmost/newest = 1), so
    we map ``year = years[len(years) - z]`` rather than zipping positionally.

    Optional and best-effort: any parsing trouble yields ``{}`` so a markup
    change here never aborts an otherwise-good sync.
    """
    try:
        years = [_parse_int(t.get_text(strip=True)) for t in soup.select("span.gsc_g_t")]
        if not years:
            return {}
        out: dict[str, int] = {}
        for bar in soup.select("a.gsc_g_a"):
            count_el = bar.select_one("span.gsc_g_al")
            if count_el is None:
                continue
            style = bar.get("style", "")
            m = re.search(r"z-index:\s*(\d+)", style)
            if not m:
                continue
            z = int(m.group(1))
            idx = len(years) - z
            if 0 <= idx < len(years):
                out[str(years[idx])] = _parse_int(count_el.get_text(strip=True))
        return dict(sorted(out.items()))
    except Exception:  # noqa: BLE001 — histogram is optional, never fail the sync
        return {}


def _parse_profile(soup: BeautifulSoup, user_id: str) -> dict:
    name_el = soup.select_one("#gsc_prf_in")
    affiliation_el = soup.select_one(".gsc_prf_il")
    stats = [_parse_int(td.get_text(strip=True)) for td in soup.select("td.gsc_rsb_std")]
    # gsc_rsb_std order: citations(all, 5y), h-index(all, 5y), i10(all, 5y)
    return {
        "user_id": user_id,
        "name": name_el.get_text(strip=True) if name_el else "",
        "affiliation": affiliation_el.get_text(strip=True) if affiliation_el else "",
        "avatar_url": (
            f"https://scholar.googleusercontent.com/citations"
            f"?view_op=medium_photo&user={user_id}&citpid=1"
        ),
        "citations_all": stats[0] if len(stats) > 0 else 0,
        "h_index_all": stats[2] if len(stats) > 2 else 0,
        "i10_index_all": stats[4] if len(stats) > 4 else 0,
        "citations_by_year": _parse_citations_by_year(soup),
    }


def _fetch_serpapi(user_id: str, api_key: str) -> dict:
    """Fetch the profile via SerpApi's Google Scholar Author API.

    SerpApi scrapes Scholar from its own residential-grade IPs, so this path
    works from cloud hosts (Vercel/AWS) that Scholar 403s when hit directly.
    Returns the same {profile, publications} shape as the HTML scraper.
    """
    try:
        resp = requests.get(
            SERPAPI_BASE,
            params={
                "engine": "google_scholar_author",
                "author_id": user_id,
                "api_key": api_key,
                "num": PAGE_SIZE,
                "hl": "en",
            },
            timeout=30,
        )
    except requests.RequestException as exc:
        raise ScholarFetchError(f"SerpApi request failed: {exc}") from exc
    if resp.status_code != 200:
        raise ScholarFetchError(f"SerpApi returned HTTP {resp.status_code}")
    data = resp.json()
    if data.get("error"):
        raise ScholarFetchError(f"SerpApi error: {data['error']}")

    author = data.get("author") or {}
    # cited_by.table is a list of single-key dicts: citations / h_index / i10_index.
    table = {
        key: val
        for row in (data.get("cited_by") or {}).get("table", [])
        for key, val in row.items()
    }

    def _metric(name: str) -> int:
        return int((table.get(name) or {}).get("all", 0) or 0)

    profile = {
        "user_id": user_id,
        "name": author.get("name", ""),
        "affiliation": author.get("affiliations", ""),
        "avatar_url": _avatar_url(user_id),
        "citations_all": _metric("citations"),
        "h_index_all": _metric("h_index"),
        "i10_index_all": _metric("i10_index"),
    }

    publications = []
    for index, art in enumerate(data.get("articles") or []):
        cited = art.get("cited_by") or {}
        title = art.get("title", "")
        venue = art.get("publication", "")
        year_raw = art.get("year")
        try:
            year = int(year_raw) if year_raw else None
        except (TypeError, ValueError):
            year = None
        rank, acronym = rank_for(title, venue)
        publications.append(
            {
                "scholar_id": art.get("citation_id", ""),
                "title": title,
                "url": art.get("link", ""),
                "authors": art.get("authors", ""),
                "venue": venue,
                "year": year,
                "cited_by": int(cited.get("value") or 0),
                "cited_by_url": cited.get("link", "") or "",
                "core_rank": rank,
                "core_acronym": acronym,
                "order_index": index,
            }
        )
    return {"profile": profile, "publications": publications}


def fetch_scholar(user_id: str) -> dict:
    """Fetch the full profile: header metrics + every publication row,
    each annotated with (core_rank, core_acronym).

    Uses SerpApi when SERPAPI_KEY is set (required on cloud hosts Scholar
    blocks); otherwise scrapes the HTML directly (fine from a residential IP).
    """
    api_key = os.environ.get("SERPAPI_KEY")
    if api_key:
        return _fetch_serpapi(user_id, api_key)

    soup = _fetch_page(user_id, cstart=0)
    profile = _parse_profile(soup, user_id)
    publications = _parse_rows(soup)

    # Page through profiles longer than one page.
    cstart = PAGE_SIZE
    while len(publications) == cstart:
        more = _parse_rows(_fetch_page(user_id, cstart=cstart))
        if not more:
            break
        publications.extend(more)
        cstart += PAGE_SIZE

    for index, pub in enumerate(publications):
        rank, acronym = rank_for(pub["title"], pub["venue"])
        pub["core_rank"] = rank
        pub["core_acronym"] = acronym
        pub["order_index"] = index

    return {"profile": profile, "publications": publications}
