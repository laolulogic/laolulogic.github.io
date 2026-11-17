# Laolu Logic - static site builder
# 1. Wraps every file in src/pages with the shared layout (head, SEO, header, footer).
# 2. Generates a full page for every case study (from the pop-ups in src/pages/work.html) at /case-studies/<slug>.
# 3. Generates the blog (src/blog/*.html) at /blog/<slug> plus the blog index at /blog/.
# 4. Writes sitemap.xml and robots.txt.
# Usage (from this folder):  powershell -ExecutionPolicy Bypass -File build.ps1
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$SITE = 'https://laolulogic.github.io'          # <- change once your domain is live, then rebuild
$utf8 = New-Object System.Text.UTF8Encoding $false
$TODAY = (Get-Date).ToString('yyyy-MM-dd')

$nav = @(
  @{ id = 'home';        href = '/';            label = 'Home' },
  @{ id = 'about';       href = '/about';       label = 'About' },
  @{ id = 'services';    href = '/services';    label = 'Services' },
  @{ id = 'real-estate'; href = '/real-estate'; label = 'Real Estate' },
  @{ id = 'work';        href = '/work';        label = 'Case Studies' },
  @{ id = 'blog';        href = '/blog/';       label = 'Blog' },
  @{ id = 'contact';     href = '/contact';     label = 'Contact' }
)

$mark = '<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><rect class="m-bg" width="40" height="40" rx="11"/><path class="m-l" d="M12 9.5v14h9" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path class="m-l" d="M19 16.5v14h9" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle class="m-n1" cx="12" cy="9.5" r="2.7"/><circle class="m-n2" cx="28" cy="30.5" r="2.7"/></svg>'

$creds = @('HighLevel Certified Admin|HighLevel','HighLevel AI Employee Certification|HighLevel','HubSpot Digital Marketing Certification|HubSpot Academy','HubSpot Marketing Software Certification|HubSpot Academy','HubSpot Revenue Operations (RevOps) Certification|HubSpot Academy','Zapier Certified|Zapier','Make Academy Certification|Make','n8n Course Certification|n8n','Klaviyo Academy Certification|Klaviyo','Zoho CRM Certification|Zoho','Airtable Builder Certification|Airtable') | ForEach-Object { $n, $o = $_.Split('|'); '{"@type":"EducationalOccupationalCredential","credentialCategory":"certification","name":"' + $n + '","recognizedBy":{"@type":"Organization","name":"' + $o + '"}}' }

$baseGraph = @"
{"@context":"https://schema.org","@graph":[
 {"@type":"ProfessionalService","@id":"$SITE/#business","name":"Laolu Logic","url":"$SITE/","logo":"$SITE/assets/img/logo.png","image":"$SITE/assets/img/og.png","description":"CRM and AI automation: CRM setup and migration, workflow automation, AI voice agents, email and SMS automation and CRM management for real estate teams and growing businesses.","email":"laolulogic@gmail.com","telephone":"+2349169731457","areaServed":"Worldwide","founder":{"@id":"$SITE/#person"},"priceRange":"Custom quotes","sameAs":["https://www.fiverr.com/lao_lu","https://www.upwork.com/freelancers/~01319b2bfa0f24446a","https://www.linkedin.com/in/ibrahim-awosanya"],"knowsAbout":["CRM implementation","AI automation","Follow Up Boss","Lofty CRM","GoHighLevel","BoldTrail","kvCORE","HubSpot","Zapier","Make.com","n8n","Vapi","Retell AI","CRM migration","Real estate CRM","AI voice agents","Email marketing automation","SMS automation","A2P 10DLC","Database reactivation","Lead routing"]},
 {"@type":"Person","@id":"$SITE/#person","name":"Ibrahim Awosanya","alternateName":"Laolu","jobTitle":"CRM & AI Automation Specialist","url":"$SITE/about","image":"$SITE/assets/img/laolu-portrait.png","worksFor":{"@id":"$SITE/#business"},"sameAs":["https://www.fiverr.com/lao_lu","https://www.upwork.com/freelancers/~01319b2bfa0f24446a","https://www.linkedin.com/in/ibrahim-awosanya"],"hasCredential":[$($creds -join ',')]},
 {"@type":"WebSite","@id":"$SITE/#website","url":"$SITE/","name":"Laolu Logic","publisher":{"@id":"$SITE/#business"},"inLanguage":"en"}
]}
"@

function Enc($s) { [System.Net.WebUtility]::HtmlEncode($s) }
function Txt($html) { [System.Net.WebUtility]::HtmlDecode(([regex]::Replace([string]$html, '<[^>]+>', ' ') -replace '\s+', ' ').Trim()) }
function Slug($s) { ((Txt $s).ToLower() -replace '&', ' and ' -replace '[^a-z0-9]+', '-').Trim('-') }
function Clip($s, $n) { $t = Txt $s; if ($t.Length -le $n) { return $t }; $c = $t.Substring(0, $n); $c.Substring(0, $c.LastIndexOf(' ')).TrimEnd(',', '.', ';', ':') + '...' }

# inner HTML of the first <div ...openTag...> block, balanced
function Get-DivBlock([string]$s, [string]$openTag) {
  $i = $s.IndexOf($openTag); if ($i -lt 0) { return $null }
  $start = $i + $openTag.Length; $depth = 1
  $m = ([regex]'<div\b[^>]*>|</div>').Match($s, $start)
  while ($m.Success) {
    if ($m.Value -eq '</div>') { $depth--; if ($depth -eq 0) { return $s.Substring($start, $m.Index - $start) } } else { $depth++ }
    $m = $m.NextMatch()
  }
  return $null
}
# inner HTML of each top-level <div> in a fragment
function Get-TopDivs([string]$s) {
  $out = New-Object System.Collections.ArrayList; $depth = 0; $st = 0
  foreach ($m in ([regex]'<div\b[^>]*>|</div>').Matches($s)) {
    if ($m.Value -eq '</div>') { $depth--; if ($depth -eq 0) { [void]$out.Add($s.Substring($st, $m.Index - $st)) } }
    else { if ($depth -eq 0) { $st = $m.Index + $m.Length }; $depth++ }
  }
  return ,$out
}

function Get-Header($active) {
  $links = ($nav | ForEach-Object { $cur = if ($_.id -eq $active) { ' aria-current="page"' } else { '' }; "<li><a href=""$($_.href)""$cur>$($_.label)</a></li>" }) -join ''
  $mlinks = ($nav | ForEach-Object { "<li><a href=""$($_.href)"">$($_.label)</a></li>" }) -join ''
@"
<header class="site-header">
  <div class="container nav">
    <a href="/" class="brand" aria-label="Laolu Logic, home">$mark<span><b>Laolu</b><em>Logic</em></span></a>
    <nav aria-label="Main"><ul class="nav-links">$links</ul></nav>
    <div class="nav-actions">
      <button class="icon-btn theme-toggle" type="button" aria-label="Switch to dark mode"><svg class="i-moon"><use href="/assets/icons.svg#moon"/></svg><svg class="i-sun"><use href="/assets/icons.svg#sun"/></svg></button>
      <a href="/contact#book" class="btn btn--solid btn--sm"><span class="dot" aria-hidden="true"></span>Book a call</a>
      <button class="icon-btn menu-btn" type="button" aria-expanded="false" aria-controls="menu-panel" aria-label="Open menu"><span></span></button>
    </div>
  </div>
</header>
<div class="menu-panel" id="menu-panel" aria-hidden="true">
  <ol>$mlinks</ol>
  <div class="menu-foot">
    <a class="btn btn--accent btn--sm" href="/contact#book">Book a strategy call</a>
    <a class="btn btn--line btn--sm" href="https://wa.me/2349169731457" target="_blank" rel="noopener">WhatsApp</a>
    <a class="btn btn--line btn--sm" href="mailto:laolulogic@gmail.com">Email</a>
  </div>
</div>
"@
}

$footer = @"
<footer class="site-footer band">
  <div class="container">
    <div class="f-cta">
      <div><h2>Ready for a CRM that follows up for you?</h2><p>Free 30-minute strategy call. You leave with a clear plan, even if we don't work together.</p></div>
      <div class="hero-cta"><a class="btn btn--accent" href="/contact#book">Book a strategy call <svg><use href="/assets/icons.svg#arrow"/></svg></a><a class="btn btn--line" href="https://wa.me/2349169731457" target="_blank" rel="noopener">WhatsApp me</a></div>
    </div>
    <div class="f-top">
      <div>
        <a href="/" class="brand" aria-label="Laolu Logic, home">$mark<span><b>Laolu</b><em>Logic</em></span></a>
        <p>CRM and AI automation for businesses that live on follow-up. Deep real estate CRM experience, certified on the platforms I build on.</p>
        <div class="socials">
          <a href="https://www.linkedin.com/in/ibrahim-awosanya" target="_blank" rel="noopener" aria-label="LinkedIn"><i style="--logo:url(/assets/logos/linkedin.svg)"></i></a>
          <a href="https://www.fiverr.com/lao_lu" target="_blank" rel="noopener" aria-label="Fiverr"><i style="--logo:url(/assets/logos/fiverr.svg)"></i></a>
          <a href="https://www.upwork.com/freelancers/~01319b2bfa0f24446a" target="_blank" rel="noopener" aria-label="Upwork"><i style="--logo:url(/assets/logos/upwork.svg)"></i></a>
          <a href="https://wa.me/2349169731457" target="_blank" rel="noopener" aria-label="WhatsApp"><i style="--logo:url(/assets/logos/whatsapp.svg)"></i></a>
          <a href="mailto:laolulogic@gmail.com" aria-label="Email laolulogic@gmail.com"><svg aria-hidden="true"><use href="/assets/icons.svg#mail"/></svg></a>
        </div>
      </div>
      <div class="f-col"><h4>Company</h4><ul><li><a href="/about">About</a></li><li><a href="/services">Services</a></li><li><a href="/services#packages">Packages</a></li><li><a href="/real-estate">Real Estate CRM</a></li><li><a href="/work">Case studies</a></li><li><a href="/blog/">Blog</a></li><li><a href="/faq">FAQ</a></li><li><a href="/contact">Contact</a></li></ul></div>
      <div class="f-col"><h4>Services</h4><ul><li><a href="/services#crm">CRM setup &amp; migration</a></li><li><a href="/services#automation">Workflow automation</a></li><li><a href="/services#ai-voice">AI voice agents</a></li><li><a href="/services#email-sms">Email &amp; SMS automation</a></li><li><a href="/services#reactivation">Database reactivation</a></li><li><a href="/services#management">CRM management</a></li></ul></div>
      <div class="f-col"><h4>Get in touch</h4><ul><li><a href="/contact#book">Book a strategy call</a></li><li><a href="mailto:laolulogic@gmail.com">laolulogic@gmail.com</a></li><li><a href="https://wa.me/2349169731457" target="_blank" rel="noopener">WhatsApp</a></li><li><a href="tel:+2349169731457">Call me</a></li><li><a href="https://www.fiverr.com/lao_lu" target="_blank" rel="noopener">Hire on Fiverr</a></li><li><a href="https://www.upwork.com/freelancers/~01319b2bfa0f24446a" target="_blank" rel="noopener">Hire on Upwork</a></li></ul></div>
    </div>
    <div class="f-bottom"><span>&copy; <span data-year>2026</span> Laolu Logic &middot; Ibrahim &ldquo;Laolu&rdquo; Awosanya</span><span><a href="/faq">FAQ</a> &middot; <a href="/privacy">Privacy</a> &middot; <a href="/terms">Terms</a> &middot; <button type="button" class="link-btn" data-cookie-settings>Cookie settings</button> &middot; <a href="/sitemap.xml">Sitemap</a></span></div>
  </div>
</footer>
<div class="m-cta" aria-label="Quick contact"><a class="btn btn--accent btn--sm" href="/contact#book">Book a free call</a><a class="btn btn--line btn--sm" href="https://wa.me/2349169731457" target="_blank" rel="noopener"><i style="--logo:url(/assets/logos/whatsapp.svg)"></i>WhatsApp</a></div>
<a class="wa-float" href="https://wa.me/2349169731457?text=Hi%20Laolu%2C%20I%20found%20you%20on%20your%20website." target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><i style="--logo:url(/assets/logos/whatsapp.svg)"></i><span class="tip">Chat on WhatsApp</span></a>
<button class="to-top" type="button" aria-label="Back to top"><svg class="ring" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="26"/></svg><svg class="arrow" aria-hidden="true"><use href="/assets/icons.svg#arrow"/></svg></button>
"@

# Free checklist sign-up card (blog posts, blog index, home). Does not replace any contact form.
function Lead-Magnet([string]$id) {
@"
<aside class="lm" data-reveal aria-labelledby="lm-h-$id">
  <div class="lm-visual" aria-hidden="true"><div class="lm-sheet"><i></i><b>The CRM Leak Checklist</b><span></span><span></span><span></span><span></span><span></span></div><div class="lm-sheet lm-sheet--back"></div></div>
  <div class="lm-copy"><span class="lm-tag">Free download &middot; PDF</span><h3 id="lm-h-$id">The CRM Leak Checklist</h3><p>32 quick checks to find where your CRM is losing leads, from speed to lead and routing to follow-up and texting compliance. Takes about 20 minutes.</p></div>
  <form class="lm-form" data-lead-magnet novalidate>
    <div class="field"><label for="lm-n-$id">First name</label><input id="lm-n-$id" name="name" autocomplete="given-name" required></div>
    <div class="field"><label for="lm-e-$id">Email</label><input id="lm-e-$id" name="email" type="email" autocomplete="email" required></div>
    <input class="hp" type="text" name="website_url" tabindex="-1" autocomplete="off" aria-hidden="true">
    <button class="btn btn--accent" type="submit"><span class="btn-text">Get the checklist</span><svg><use href="/assets/icons.svg#arrow"/></svg></button>
    <p class="lm-note" role="status">Instant download. No spam, ever.</p>
  </form>
</aside>
"@
}

# Make every internal URL root-absolute and clean (works from any folder depth, matches GitHub Pages)
function Fix-Urls([string]$h) {
  $h = [regex]::Replace($h, '(\s(?:href|src|data-src|data-preview|poster)=")(?!https?:|//|/|#|mailto:|tel:|data:|javascript:)([^"]+)"', '$1/$2"')
  $ev = [System.Text.RegularExpressions.MatchEvaluator] { param($m) $m.Groups[1].Value + '="' + (($m.Groups[2].Value.Split(',') | ForEach-Object { $p = $_.Trim(); if ($p -and $p -notmatch '^(https?:|/)') { '/' + $p } else { $p } }) -join ', ') + '"' }
  $h = [regex]::Replace($h, '(srcset|imagesrcset)="([^"]+)"', $ev)
  $h = [regex]::Replace($h, '(\shref=")/index\.html((?:#|\?)[^"]*)?"', '$1/$2"')
  $h = [regex]::Replace($h, '(\shref=")/([\w/-]+)\.html((?:#|\?)[^"]*)?"', '$1/$2$3"')
  return $h
}

function Write-Page($meta, [string]$body, [string]$outRel) {
  $canon = if ($meta.path -eq '/') { "$SITE/" } else { "$SITE$($meta.path)" }
  $schemas = @($baseGraph)
  if ($meta.schema) { foreach ($s in $meta.schema) { $schemas += $(if ($s -is [string]) { $s } else { $s | ConvertTo-Json -Depth 20 -Compress }) } }
  $schemaTags = ($schemas | ForEach-Object { "<script type=""application/ld+json"">$($_.Replace('__SITE__', $SITE))</script>" }) -join "`n  "
  $preload = if ($meta.preload) { "`n  <link rel=""preload"" as=""image"" type=""image/webp"" href=""$($meta.preload)"" imagesrcset=""assets/img/laolu-portrait-480.webp 480w, assets/img/laolu-portrait.webp 780w"" imagesizes=""(max-width: 900px) 78vw, 440px"" fetchpriority=""high"">" } else { '' }
  $title = Enc $meta.title; $desc = Enc $meta.description
  $ogType = if ($meta.ogType) { $meta.ogType } else { 'website' }
  $ogKey = ($outRel -replace '\.html$', '') -replace '\\', '-'
  $ogKey = switch -Regex ($ogKey) { '^index$' { 'home' } '^blog-index$' { 'blog' } '^case-studies-(.+)$' { 'case-' + $Matches[1] } default { $ogKey } }
  $ogImg = if (Test-Path (Join-Path $Root "assets\og\$ogKey.jpg")) { "$SITE/assets/og/$ogKey.jpg" } elseif ($meta.ogImage) { "$SITE/$($meta.ogImage.TrimStart('/'))" } else { "$SITE/assets/img/og.png" }
  $extraHead = if ($meta.extraHead) { "`n  " + $meta.extraHead } else { '' }
  $foot = if ($body -match 'class="section band big-cta"') { [regex]::Replace($footer, '(?s)\s*<div class="f-cta">.*?</div>\s*</div>', '', 1) } else { $footer }
  $html = @"
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>$title</title>
  <meta name="description" content="$desc">
  <link rel="canonical" href="$canon">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="author" content="Ibrahim Awosanya (Laolu)">
  <meta name="theme-color" content="#0c0a11">
  <meta property="og:type" content="$ogType">
  <meta property="og:site_name" content="Laolu Logic">
  <meta property="og:title" content="$title">
  <meta property="og:description" content="$desc">
  <meta property="og:url" content="$canon">
  <meta property="og:image" content="$ogImg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="$title">
  <meta name="twitter:description" content="$desc">
  <meta name="twitter:image" content="$ogImg">$extraHead
  <link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="assets/img/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
  <link rel="manifest" href="site.webmanifest">
  <link rel="alternate" type="application/rss+xml" title="Laolu Logic blog" href="$SITE/blog/feed.xml">
  <script>(function(){try{var t=localStorage.getItem('ll-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)}catch(e){}})()</script>
  <link rel="preload" href="/assets/fonts/geist-normal-300_800-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="css/fonts.css">
  <link rel="stylesheet" href="css/style.css">$preload
  $schemaTags
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"></div>
$(Get-Header $meta.active)
<main id="main">
$body
</main>
$foot
<script src="js/config.js"></script>
<script src="js/main.js" defer></script>
<script src="js/fx.js" defer></script>
<script src="js/track.js" defer></script>
</body>
</html>
"@
  $out = Join-Path $Root $outRel
  New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
  # Every WhatsApp link opens with a message that matches the page it was clicked on
  $pg = ($meta.title -replace '\s*\|\s*Laolu Logic\s*$', '').Trim()
  $rel = $outRel.Replace('/', '\')
  $wa = if ($rel -like 'blog\index.html') { "Hi Laolu, I've been reading your blog and I'd like to talk about my CRM and follow-up." }
    elseif ($rel -like 'blog\*') { "Hi Laolu, I just read your article `"$pg`" and I'd like to talk about my setup." }
    elseif ($rel -like 'case-studies\*') { "Hi Laolu, I saw your case study `"$pg`" and I want something similar for my business." }
    elseif ($rel -eq 'real-estate.html') { "Hi Laolu, I work in real estate and I'd like help with my CRM, lead follow-up and automation." }
    elseif ($rel -eq 'services.html') { "Hi Laolu, I'm interested in one of your CRM & AI automation packages. Can we talk?" }
    elseif ($rel -eq 'work.html') { "Hi Laolu, I've been looking through your case studies and I'd like to discuss a project." }
    elseif ($rel -eq 'about.html') { "Hi Laolu, I read about you and your work, and I'd like to talk about a project." }
    elseif ($rel -eq 'faq.html') { "Hi Laolu, I have a question that isn't answered on your FAQ page." }
    elseif ($rel -eq 'contact.html') { "Hi Laolu, I'd like to book a call about my CRM and automation." }
    else { "Hi Laolu, I found you on your website and I'd like to talk about CRM and AI automation for my business." }
  $waUrl = 'https://wa.me/2349169731457?text=' + [uri]::EscapeDataString($wa)
  $html = [regex]::Replace($html, 'https://wa\.me/2349169731457(?:\?text=[^"]*)?"', { param($m) $waUrl + '"' })
  [IO.File]::WriteAllText($out, (Fix-Urls $html), $utf8)
}

function Crumbs($items) { # items: @(@('Home','/'), @('Blog','/blog/'), @('Title',$null))
  $parts = $items | ForEach-Object { if ($_[1]) { "<a href=""$($_[1])"">$(Enc $_[0])</a>" } else { "<span aria-current=""page"">$(Enc $_[0])</span>" } }
  $ld = '{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[' + (((0..($items.Count - 1)) | ForEach-Object { $it = $items[$_]; $u = if ($it[1]) { "$SITE$($it[1])" } else { $null }; '{"@type":"ListItem","position":' + ($_ + 1) + ',"name":' + ($it[0] | ConvertTo-Json) + $(if ($u) { ',"item":"' + $u + '"' } else { '' }) + '}' }) -join ',') + ']}'
  return @{ html = ($parts -join '<span>/</span>'); ld = $ld }
}

# Adds ids to h2 headings, returns @{ body; toc }
function Add-Toc([string]$body) {
  $toc = New-Object System.Collections.ArrayList
  $ev = [System.Text.RegularExpressions.MatchEvaluator] {
    param($m)
    $inner = $m.Groups[2].Value; $id = Slug $inner; if (-not $id) { $id = 'section' }
    $n = 2; $base = $id; while ($toc | Where-Object { $_.id -eq $id }) { $id = "$base-$n"; $n++ }
    [void]$toc.Add(@{ id = $id; text = (Txt $inner) })
    "<h2 id=""$id""$($m.Groups[1].Value)>$inner</h2>"
  }
  $b = [regex]::Replace($body, '<h2(?![^>]*\bid=)([^>]*)>(.*?)</h2>', $ev)
  return @{ body = $b; toc = (($toc | ForEach-Object { "<li><a href=""#$($_.id)"">$(Enc $_.text)</a></li>" }) -join '') }
}

function Inline-Cta($title, $text, $btn) {
  "<aside class=""art-inline-cta""><div><strong>$title</strong><p>$text</p></div><a class=""btn btn--accent btn--sm"" href=""/contact#book"">$btn <svg><use href=""/assets/icons.svg#arrow""/></svg></a></aside>"
}

# Shared layout for case-study pages and blog posts
function Article-Html($a) {
  $kpis = if ($a.kpis) { "<div class=""container art-kpis"" data-reveal>$($a.kpis)</div>" } else { '' }
  $related = if ($a.related) { "<section class=""section band band--alt art-related"" aria-labelledby=""rel-title""><div class=""container""><div class=""sec-head""><div><h2 class=""h-lg"" id=""rel-title"">$($a.relatedTitle)</h2></div><a class=""link"" href=""$($a.allHref)"">$($a.allLabel) <svg><use href=""/assets/icons.svg#arrow-up-right""/></svg></a></div><div class=""rel-grid"">$($a.related)</div></div></section>" } else { '' }
@"
<article class="art art--$($a.kind)">
  <header class="art-hero band">
    <div class="container art-head">
      <nav class="crumbs" aria-label="Breadcrumb">$($a.crumbs)</nav>
      <p class="art-kicker">$($a.kicker)</p>
      <h1 class="art-title">$($a.title)</h1>
      <p class="art-dek">$($a.dek)</p>
      <div class="art-meta">$($a.meta)</div>
    </div>
  </header>
  <div class="container art-cover">$($a.cover)</div>
  $kpis
  <div class="container art-layout">
    <aside class="art-aside" aria-label="On this page">
      <div class="art-sticky">
        <p class="art-aside-h">On this page</p>
        <ol class="art-toc">$($a.toc)</ol>
        <div class="art-aside-cta"><strong>$($a.asideTitle)</strong><p>Free 30-minute strategy call. Clear plan, no pressure.</p><a class="btn btn--accent btn--sm" href="/contact#book">Book a call</a></div>
        <div class="art-share"><button type="button" class="link" data-copy-url><svg><use href="/assets/icons.svg#copy"/></svg>Copy link</button><a class="link" data-share="linkedin" href="#" target="_blank" rel="noopener"><i style="--logo:url(/assets/logos/linkedin.svg)"></i>Share</a></div>
      </div>
    </aside>
    <div class="art-body prose">
$($a.body)
    </div>
  </div>
  $related
</article>
"@
}

function Post-Card($p, [string]$cls = '') {
  "<a class=""post-card $cls"" href=""/blog/$($p.slug)"" data-cat=""$($p.catSlug)""><span class=""post-media""><img src=""/$($p.cover)"" alt=""$(Enc $p.coverAlt)"" width=""1440"" height=""900"" loading=""lazy"" decoding=""async""></span><span class=""post-body""><span class=""post-cat"">$(Enc $p.category)</span><b>$(Enc $p.h1)</b><span class=""post-ex"">$(Enc (Clip $p.description 150))</span><span class=""post-meta"">$($p.minutes) min read</span></span></a>"
}
function Case-Card($c) {
  $img = if ($c.cover) { "<img src=""/$($c.cover)"" alt="""" width=""1440"" height=""900"" loading=""lazy"" decoding=""async"">" } else { "<span class=""post-mock"">$($c.mock)</span>" }
  "<a class=""post-card"" href=""/case-studies/$($c.slug)""><span class=""post-media"">$img</span><span class=""post-body""><span class=""post-cat"">Case study &middot; $(Enc $c.platforms)</span><b>$(Enc $c.title)</b><span class=""post-ex"">$(Enc (Clip $c.summary 140))</span><span class=""post-meta"">$(Enc $c.client)</span></span></a>"
}

# =====================================================================
# 1) BLOG: read posts first (home page shows the latest ones)
# =====================================================================
$posts = @()
$blogDir = Join-Path $Root 'src\blog'
if (Test-Path $blogDir) {
  foreach ($f in Get-ChildItem $blogDir -Filter *.html | Sort-Object Name) {
    $raw = [IO.File]::ReadAllText($f.FullName, $utf8)
    $m = [regex]::Match($raw, '(?s)^<!--META(.*?)META-->'); if (-not $m.Success) { throw "Missing META in $($f.Name)" }
    $p = $m.Groups[1].Value | ConvertFrom-Json
    $p | Add-Member -NotePropertyName slug -NotePropertyValue $f.BaseName -Force
    $p | Add-Member -NotePropertyName html -NotePropertyValue ($raw.Substring($m.Length).Trim()) -Force
    $words = ((Txt $p.html) -split '\s+').Count
    $p | Add-Member -NotePropertyName minutes -NotePropertyValue ([Math]::Max(3, [Math]::Round($words / 230))) -Force
    $p | Add-Member -NotePropertyName catSlug -NotePropertyValue (Slug $p.category) -Force
    if (-not $p.date) { $p | Add-Member -NotePropertyName date -NotePropertyValue $TODAY -Force }
    $posts += $p
  }
  $posts = @($posts | Sort-Object @{ e = { $_.order }; a = $true })
}

# =====================================================================
# 2) CASE STUDIES: parse cards + pop-ups from src/pages/work.html
# =====================================================================
$workSrc = [IO.File]::ReadAllText((Join-Path $Root 'src\pages\work.html'), $utf8)
$cards = @{}
foreach ($m in [regex]::Matches($workSrc, '(?s)<article class="case[^"]*" data-cat="([^"]+)"[^>]*>(.*?)</article>')) {
  $h = $m.Groups[2].Value
  $id = [regex]::Match($h, 'data-open="dlg-([\w-]+)"').Groups[1].Value
  $meta = [regex]::Matches($h, '<div class="case-meta"><span>(.*?)</span><span>(.*?)</span>')
  $kp = [regex]::Match($h, '(?s)<div class="kpis">(.*?)</div>\s*<div class="case-foot">').Groups[1].Value
  $cards[$id] = @{
    cat = $m.Groups[1].Value; client = $(if ($meta.Count) { Txt $meta[0].Groups[1].Value } else { '' }); scope = $(if ($meta.Count) { Txt $meta[0].Groups[2].Value } else { '' })
    summary = [regex]::Match($h, '(?s)</h3>\s*<p>(.*?)</p>').Groups[1].Value
    cover = [regex]::Match($h, 'src="(assets/cover/[^"]+)"').Groups[1].Value
    kpis = $kp
    mock = (Get-DivBlock $h '<div class="mock">')
  }
}
$cases = @()
foreach ($m in [regex]::Matches($workSrc, '(?s)<dialog class="case-dialog" id="dlg-([\w-]+)"[^>]*>(.*?)</dialog>')) {
  $slug = $m.Groups[1].Value; $d = $m.Groups[2].Value; $card = $cards[$slug]
  $label = Txt ([regex]::Match($d, '<p class="label">(.*?)</p>').Groups[1].Value)
  $platforms = (($label -split '\s*·\s*') | Select-Object -Skip 1) -join ' · '
  $cases += [pscustomobject]@{
    slug = $slug; label = $label; platforms = $platforms
    title = Txt ([regex]::Match($d, '<h2[^>]*>(.*?)</h2>').Groups[1].Value)
    lead = [regex]::Match($d, '(?s)<p class="lead">(.*?)</p>').Groups[1].Value
    hero = (Get-DivBlock $d '<div class="dlg-hero">')
    cols = (Get-DivBlock $d '<div class="dlg-cols">')
    kpis = (Get-DivBlock $d '<div class="dlg-kpis">')
    btn = Txt ([regex]::Match($d, '(?s)<div class="hero-cta"[^>]*><a [^>]*>(.*?)</a>').Groups[1].Value)
    cat = $card.cat; client = $card.client; scope = $card.scope; summary = $card.summary; cover = $card.cover; cardKpis = $card.kpis; mock = $card.mock
  }
}

# =====================================================================
# 3) STATIC PAGES
# =====================================================================
$latest = (($posts | Select-Object -First 3) | ForEach-Object { Post-Card $_ }) -join "`n"
Get-ChildItem (Join-Path $Root 'src\pages') -Filter *.html | ForEach-Object {
  $raw = [IO.File]::ReadAllText($_.FullName, $utf8)
  $m = [regex]::Match($raw, '(?s)^<!--META(.*?)META-->')
  if (-not $m.Success) { throw "Missing META block in $($_.Name)" }
  $meta = $m.Groups[1].Value | ConvertFrom-Json
  $body = $raw.Substring($m.Length).Trim().Replace('<!--LATEST_POSTS-->', $latest).Replace('<!--LEAD_MAGNET-->', (Lead-Magnet 'home'))
  Write-Page $meta $body $_.Name
  "built $($_.Name)"
}

# =====================================================================
# 4) CASE STUDY PAGES  /case-studies/<slug>
# =====================================================================
$allKpiRx = '<div><strong>(.*?)</strong><span>(.*?)</span></div>'
foreach ($c in $cases) {
  $cr = Crumbs @(@('Home', '/'), @('Case studies', '/work'), @($c.title, $null))
  # cover: the real screenshot, whole, with zoom; or the illustrated panel
  $img = [regex]::Match([string]$c.hero, 'src="([^"]+)"').Groups[1].Value
  if ($img) {
    $cover = "<figure class=""art-shot""><div class=""art-shot-bar""><i></i><i></i><i></i><span>$(Enc $c.platforms)</span></div><button class=""art-shot-img"" type=""button"" data-zoom=""/$img"" aria-label=""Zoom screenshot""><img src=""/$img"" alt=""$(Enc $c.title): workflow screenshot"" decoding=""async"" fetchpriority=""high""></button><figcaption><span>Real build screenshot</span><span>Client details removed</span></figcaption></figure>"
  } else {
    $mk = Get-DivBlock ([string]$c.hero) '<div class="mock">'
    $cover = "<figure class=""art-shot art-shot--mock""><div class=""mock"">$mk</div></figure>"
  }
  $kp = if ($c.kpis) { $c.kpis } else { $c.cardKpis }
  $kpiHtml = ''
  if ($kp) { $kpiHtml = (([regex]::Matches($kp, $allKpiRx)) | ForEach-Object { "<div><strong>$($_.Groups[1].Value)</strong><span>$($_.Groups[2].Value)</span></div>" }) -join '' }
  # body from the pop-up columns
  $sections = @(); $builtDone = $false
  foreach ($col in (Get-TopDivs ([string]$c.cols))) {
    $h3 = [regex]::Match($col, '<h3[^>]*>(.*?)</h3>')
    $head = if ($h3.Success) { $h3.Groups[1].Value } else { 'Overview' }
    $rest = if ($h3.Success) { $col.Remove($h3.Index, $h3.Length) } else { $col }
    $rest = $rest.Replace('<div class="tool-row" style="margin:0">', '<div class="tool-row">').Replace(' style="margin-top:1.5rem"', '')
    if ($head -match '(?i)built|designed|what i did|agents|systems i') { $rest = $rest.Replace('<ul>', '<ol class="art-steps">').Replace('</ul>', '</ol>') }
    if ($head -match '(?i)^stack$') { $head = 'Tools used' }
    $sections += "<h2>$head</h2>`n$rest"
    if (-not $builtDone -and $head -match '(?i)built|designed|what i did|agents|systems i') { $sections += (Inline-Cta 'Want a system like this?' 'Tell me how your leads come in. I will map what to automate first, free.' 'Book a strategy call'); $builtDone = $true }
  }
  $toc = Add-Toc ($sections -join "`n")
  $body = $toc.body + "`n<div class=""art-end-cta""><h2 class=""no-toc"">Your version of this, built properly.</h2><p>Every system I build is tested end to end, documented and handed over in your accounts.</p><div class=""hero-cta""><a class=""btn btn--accent"" href=""/contact#book"">$(if ($c.btn) { Enc $c.btn } else { 'Book a strategy call' }) <svg><use href=""/assets/icons.svg#arrow""/></svg></a><a class=""btn btn--line"" href=""https://wa.me/2349169731457?text=$([uri]::EscapeDataString('Hi Laolu, I read your case study "' + $c.title + '" and want something similar.'))"" target=""_blank"" rel=""noopener"">WhatsApp me</a></div></div>"
  # related: same first category
  $first = ([string]$c.cat).Split(' ')[0]
  $rel = @($cases | Where-Object { $_.slug -ne $c.slug -and ([string]$_.cat).Split(' ') -contains $first } | Select-Object -First 3)
  if ($rel.Count -lt 3) { $rel += @($cases | Where-Object { $_.slug -ne $c.slug -and $rel.slug -notcontains $_.slug } | Select-Object -First (3 - $rel.Count)) }
  $chips = (($c.platforms -split ' · ') | Where-Object { $_ } | ForEach-Object { "<span class=""chip"">$(Enc $_)</span>" }) -join ''
  $metaRow = "<span><svg><use href=""/assets/icons.svg#user-check""/></svg>$(Enc $c.client)</span>" + $(if ($c.scope) { "<span><svg><use href=""/assets/icons.svg#clock""/></svg>$(Enc $c.scope)</span>" } else { '' }) + "<span><svg><use href=""/assets/icons.svg#star""/></svg>Real client project</span>"
  $desc = Clip ("$($c.title). " + (Txt $c.lead)) 158
  $coverAbs = if ($c.cover) { "$SITE/$($c.cover)" } else { "$SITE/assets/img/og.png" }
  $articleLd = '{"@context":"https://schema.org","@type":"Article","headline":' + ($c.title | ConvertTo-Json) + ',"description":' + ($desc | ConvertTo-Json) + ',"image":"' + $coverAbs + '","author":{"@id":"' + $SITE + '/#person"},"publisher":{"@id":"' + $SITE + '/#business"},"mainEntityOfPage":"' + $SITE + '/case-studies/' + $c.slug + '","articleSection":"Case studies","about":' + ($c.platforms | ConvertTo-Json) + '}'
  $a = @{
    kind = 'case'; crumbs = $cr.html; kicker = "<span class=""chip chip--accent"">Case study</span>$chips"
    title = Enc $c.title; dek = $c.lead; meta = $metaRow; cover = $cover; kpis = $kpiHtml; toc = $toc.toc
    asideTitle = 'Want results like these?'; body = $body
    relatedTitle = 'More case studies'; related = (($rel | ForEach-Object { Case-Card $_ }) -join ''); allHref = '/work'; allLabel = 'All case studies'
  }
  $meta = [pscustomobject]@{ title = "$($c.title) | Case Study | Laolu Logic"; description = $desc; path = "/case-studies/$($c.slug)"; active = 'work'; ogType = 'article'; ogImage = $c.cover; schema = @($articleLd, $cr.ld) }
  Write-Page $meta (Article-Html $a) "case-studies\$($c.slug).html"
}
"built $($cases.Count) case study pages"

# =====================================================================
# 5) BLOG POSTS  /blog/<slug>  + index + RSS
# =====================================================================
foreach ($p in $posts) {
  $cr = Crumbs @(@('Home', '/'), @('Blog', '/blog/'), @($p.h1, $null))
  $take = if ($p.takeaways) { "<div class=""art-takeaways""><p class=""art-takeaways-h"">Key takeaways</p><ul>" + (($p.takeaways | ForEach-Object { "<li>$_</li>" }) -join '') + "</ul></div>" } else { '' }
  $html = [string]$p.html
  # mid-article CTA before the 3rd h2
  $h2s = [regex]::Matches($html, '<h2')
  if ($h2s.Count -ge 3) { $html = $html.Insert($h2s[2].Index, (Inline-Cta $p.ctaTitle $p.ctaText 'Book a free strategy call') + "`n") }
  $faqHtml = ''; $faqLd = $null
  if ($p.faq) {
    $faqHtml = "<h2>Frequently asked questions</h2><div class=""faq art-faq"">" + (($p.faq | ForEach-Object { "<details><summary><span class=""q"">$(Enc $_.q)</span><span class=""pm""><svg><use href=""/assets/icons.svg#plus""/></svg></span></summary><div class=""answer""><p>$($_.a)</p></div></details>" }) -join '') + "</div>"
    $faqLd = '{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[' + (($p.faq | ForEach-Object { '{"@type":"Question","name":' + ($_.q | ConvertTo-Json) + ',"acceptedAnswer":{"@type":"Answer","text":' + ((Txt $_.a) | ConvertTo-Json) + '}}' }) -join ',') + ']}'
  }
  $author = "<div class=""art-author""><img src=""/assets/img/laolu-portrait-480.webp"" alt=""Ibrahim 'Laolu' Awosanya"" width=""72"" height=""72"" loading=""lazy""><div><p class=""art-author-h"">Written by Ibrahim &ldquo;Laolu&rdquo; Awosanya</p><p>CRM &amp; AI automation specialist, Level 2 seller on Fiverr and certified across HighLevel, HubSpot, Zapier, Make, n8n and more. I build CRMs and automations that follow up on every lead. <a class=""link"" href=""/about"">More about me</a></p></div></div>"
  $endCta = "<div class=""art-end-cta""><h2 class=""no-toc"">$($p.ctaTitle)</h2><p>$($p.ctaText)</p><div class=""hero-cta""><a class=""btn btn--accent"" href=""/contact#book"">Book a free strategy call <svg><use href=""/assets/icons.svg#arrow""/></svg></a><a class=""btn btn--line"" href=""/services#packages"">See packages</a></div></div>"
  $toc = Add-Toc ($html + $faqHtml)
  $body = $take + "`n" + $toc.body + "`n" + (Lead-Magnet "post") + "`n" + $author + "`n" + $endCta
  $relPosts = @($posts | Where-Object { $_.slug -ne $p.slug -and $_.catSlug -eq $p.catSlug } | Select-Object -First 2)
  if ($relPosts.Count -lt 2) { $relPosts += @($posts | Where-Object { $_.slug -ne $p.slug -and $relPosts.slug -notcontains $_.slug } | Select-Object -First (2 - $relPosts.Count)) }
  $relHtml = ($relPosts | ForEach-Object { Post-Card $_ }) -join ''
  $rc = $cases | Where-Object { $_.slug -eq $p.relatedCase } | Select-Object -First 1
  if ($rc) { $relHtml += (Case-Card $rc) }
  $metaRow = "<span class=""art-by""><img src=""/assets/img/laolu-portrait-480.webp"" alt="""" width=""28"" height=""28"">Ibrahim &ldquo;Laolu&rdquo; Awosanya</span><span><svg><use href=""/assets/icons.svg#calendar""/></svg><time datetime=""$($p.date)"">$((Get-Date $p.date).ToString('MMMM d, yyyy'))</time></span><span><svg><use href=""/assets/icons.svg#clock""/></svg>$($p.minutes) min read</span>"
  $cover = "<figure class=""art-shot""><div class=""art-shot-bar""><i></i><i></i><i></i><span>$(Enc $p.coverLabel)</span></div><button class=""art-shot-img"" type=""button"" data-zoom=""/$($p.cover)"" aria-label=""Zoom image""><img src=""/$($p.cover)"" alt=""$(Enc $p.coverAlt)"" width=""1440"" height=""900"" decoding=""async"" fetchpriority=""high""></button></figure>"
  $postLd = '{"@context":"https://schema.org","@type":"BlogPosting","headline":' + ($p.h1 | ConvertTo-Json) + ',"description":' + ($p.description | ConvertTo-Json) + ',"image":"' + $SITE + '/' + $p.cover + '","datePublished":"' + $p.date + '","dateModified":"' + $p.date + '","author":{"@id":"' + $SITE + '/#person"},"publisher":{"@id":"' + $SITE + '/#business"},"mainEntityOfPage":"' + $SITE + '/blog/' + $p.slug + '","articleSection":' + ($p.category | ConvertTo-Json) + ',"keywords":' + ($p.keywords | ConvertTo-Json) + ',"wordCount":' + ((Txt $p.html) -split '\s+').Count + '}'
  $a = @{
    kind = 'post'; crumbs = $cr.html; kicker = "<a class=""chip chip--accent"" href=""/blog/?cat=$($p.catSlug)"">$(Enc $p.category)</a>"
    title = Enc $p.h1; dek = Enc $p.description; meta = $metaRow; cover = $cover; kpis = $null; toc = $toc.toc
    asideTitle = $p.asideTitle; body = $body
    relatedTitle = 'Keep reading'; related = $relHtml; allHref = '/blog/'; allLabel = 'All articles'
  }
  if (-not $a.asideTitle) { $a.asideTitle = 'Want this done for you?' }
  $schema = @($postLd, $cr.ld); if ($faqLd) { $schema += $faqLd }
  $meta = [pscustomobject]@{ title = $p.title; description = $p.description; path = "/blog/$($p.slug)"; active = 'blog'; ogType = 'article'; ogImage = $p.cover; schema = $schema; extraHead = "<meta property=""article:published_time"" content=""$($p.date)""><meta name=""keywords"" content=""$(Enc $p.keywords)"">" }
  Write-Page $meta (Article-Html $a) "blog\$($p.slug).html"
}

if ($posts.Count) {
  $cats = $posts | Group-Object category | Sort-Object Name
  $filters = "<button class=""filter"" type=""button"" data-filter=""all"" aria-pressed=""true"">All<sup>$($posts.Count)</sup></button>" + (($cats | ForEach-Object { "<button class=""filter"" type=""button"" data-filter=""$(Slug $_.Name)"" aria-pressed=""false"">$(Enc $_.Name)<sup>$($_.Count)</sup></button>" }) -join '')
  $feat = $posts[0]
  $grid = (($posts | Select-Object -Skip 1) | ForEach-Object { Post-Card $_ }) -join "`n"
  $cr = Crumbs @(@('Home', '/'), @('Blog', $null))
  $blogBody = @"
<section class="page-hero band">
  <div class="container ph-grid">
    <div>
      <nav class="crumbs" aria-label="Breadcrumb">$($cr.html)</nav>
      <h1 class="h-xl">The CRM &amp; AI automation <em>playbook.</em></h1>
      <p class="lead">Practical guides on CRM setup, real estate lead follow-up, workflow automation and AI agents. Written from real client builds, not theory.</p>
    </div>
    <div class="ph-aside">
      <div><strong>$($posts.Count)</strong><span>practical guides</span></div>
      <div><strong>$($cats.Count)</strong><span>topics</span></div>
      <div><strong>Free</strong><span>strategy call if you want it built</span></div>
    </div>
  </div>
</section>
<section class="section band" style="padding-top:1rem" aria-label="Articles">
  <div class="container">
    <a class="post-feature" href="/blog/$($feat.slug)" data-cat="$($feat.catSlug)"><span class="post-media"><img src="/$($feat.cover)" alt="$(Enc $feat.coverAlt)" width="1440" height="900" decoding="async" fetchpriority="high"></span><span class="post-body"><span class="post-cat">Featured &middot; $(Enc $feat.category)</span><b>$(Enc $feat.h1)</b><span class="post-ex">$(Enc $feat.description)</span><span class="post-meta">$($feat.minutes) min read &middot; Read the guide <svg><use href="/assets/icons.svg#arrow"/></svg></span></span></a>
    <div class="filters" role="group" aria-label="Filter articles by topic">$filters</div>
    <p class="visually-hidden" aria-live="polite" data-filter-status></p>
    <div class="post-grid">
$grid
    </div>
$(Lead-Magnet 'blog')
  </div>
</section>
"@
  $listLd = '{"@context":"https://schema.org","@type":"Blog","name":"Laolu Logic blog","url":"' + $SITE + '/blog/","publisher":{"@id":"' + $SITE + '/#business"},"blogPost":[' + (($posts | ForEach-Object { '{"@type":"BlogPosting","headline":' + ($_.h1 | ConvertTo-Json) + ',"url":"' + $SITE + '/blog/' + $_.slug + '","datePublished":"' + $_.date + '"}' }) -join ',') + ']}'
  $meta = [pscustomobject]@{ title = 'Blog | CRM, Real Estate CRM & AI Automation Guides | Laolu Logic'; description = 'Practical guides on CRM setup, Follow Up Boss and Lofty, GoHighLevel, Zapier, Make and n8n automation, AI voice agents and email and SMS follow-up, from real client builds.'; path = '/blog/'; active = 'blog'; schema = @($listLd, $cr.ld) }
  Write-Page $meta $blogBody 'blog\index.html'
  # RSS
  $items = ($posts | ForEach-Object { "  <item><title>$(Enc $_.h1)</title><link>$SITE/blog/$($_.slug)</link><guid>$SITE/blog/$($_.slug)</guid><pubDate>$((Get-Date $_.date).ToString('r'))</pubDate><description>$(Enc $_.description)</description></item>" }) -join "`n"
  [IO.File]::WriteAllText((Join-Path $Root 'blog\feed.xml'), "<?xml version=""1.0"" encoding=""UTF-8""?>`n<rss version=""2.0""><channel><title>Laolu Logic blog</title><link>$SITE/blog/</link><description>CRM and AI automation guides</description>`n$items`n</channel></rss>`n", $utf8)
  "built $($posts.Count) blog posts + index + feed"
}

# =====================================================================
# 6) SITEMAP + ROBOTS
# =====================================================================
$paths = @('/', '/services', '/real-estate', '/work', '/blog/', '/about', '/contact', '/faq') + ($cases | ForEach-Object { "/case-studies/$($_.slug)" }) + ($posts | ForEach-Object { "/blog/$($_.slug)" })
$urls = $paths | ForEach-Object {
  $loc = if ($_ -eq '/') { "$SITE/" } else { "$SITE$_" }
  $pri = if ($_ -eq '/') { '1.0' } elseif ($_ -match '^/(services|real-estate|work|blog/)$') { '0.9' } elseif ($_ -like '/blog/*') { '0.7' } else { '0.6' }
  "  <url><loc>$loc</loc><lastmod>$TODAY</lastmod><priority>$pri</priority></url>"
}
[IO.File]::WriteAllText((Join-Path $Root 'sitemap.xml'), "<?xml version=""1.0"" encoding=""UTF-8""?>`n<urlset xmlns=""http://www.sitemaps.org/schemas/sitemap/0.9"">`n$($urls -join "`n")`n</urlset>`n", $utf8)
[IO.File]::WriteAllText((Join-Path $Root 'robots.txt'), "User-agent: *`nAllow: /`nDisallow: /backend/`nDisallow: /src/`n`nSitemap: $SITE/sitemap.xml`n", $utf8)
"built sitemap.xml ($($paths.Count) urls), robots.txt"
