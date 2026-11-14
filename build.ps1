# Laolu Logic — tiny static site builder
# Wraps every file in src/pages with the shared layout (head, SEO, header, footer).
# Usage (from this folder):  powershell -ExecutionPolicy Bypass -File build.ps1
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$SITE = 'https://laolulogic.github.io'          # <- change once your domain is live, then rebuild
$utf8 = New-Object System.Text.UTF8Encoding $false

$nav = @(
  @{ id = 'home';        href = 'index.html';       label = 'Home' },
  @{ id = 'services';    href = 'services.html';    label = 'Services' },
  @{ id = 'real-estate'; href = 'real-estate.html'; label = 'Real Estate CRM' },
  @{ id = 'work';        href = 'work.html';        label = 'Work' },
  @{ id = 'about';       href = 'about.html';       label = 'About' },
  @{ id = 'contact';     href = 'contact.html';     label = 'Contact' }
)

$mark = '<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><rect class="m-bg" width="40" height="40" rx="11"/><path class="m-l" d="M12 9.5v14h9" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path class="m-l" d="M19 16.5v14h9" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle class="m-n1" cx="12" cy="9.5" r="2.7"/><circle class="m-n2" cx="28" cy="30.5" r="2.7"/></svg>'

$baseGraph = @"
{"@context":"https://schema.org","@graph":[
 {"@type":"ProfessionalService","@id":"$SITE/#business","name":"Laolu Logic","url":"$SITE/","logo":"$SITE/assets/img/logo.png","image":"$SITE/assets/img/og.png","description":"CRM setup, workflow automation and AI voice agents for real estate teams, agencies and growing businesses.","email":"laolulogic@gmail.com","telephone":"+2349169731457","areaServed":"Worldwide","founder":{"@id":"$SITE/#person"},"priceRange":"Custom quotes","sameAs":["https://www.fiverr.com/lao_lu","https://www.upwork.com/freelancers/~01319b2bfa0f24446a","https://www.linkedin.com/in/ibrahim-awosanya"],"knowsAbout":["Follow Up Boss","Lofty CRM","GoHighLevel","BoldTrail","kvCORE","HubSpot","Zapier","Make.com","n8n","Vapi","Retell AI","CRM migration","Real estate CRM","AI voice agents","Email marketing automation","Database reactivation","Lead routing"]},
 {"@type":"Person","@id":"$SITE/#person","name":"Ibrahim Awosanya","alternateName":"Laolu","jobTitle":"CRM Expert & AI Automation Specialist","url":"$SITE/about","image":"$SITE/assets/img/laolu-portrait.png","worksFor":{"@id":"$SITE/#business"},"sameAs":["https://www.fiverr.com/lao_lu","https://www.upwork.com/freelancers/~01319b2bfa0f24446a","https://www.linkedin.com/in/ibrahim-awosanya"],"hasCredential":[{"@type":"EducationalOccupationalCredential","name":"GoHighLevel Certified"},{"@type":"EducationalOccupationalCredential","name":"Zapier Certified"},{"@type":"EducationalOccupationalCredential","name":"HubSpot Digital Marketing Certification"}]},
 {"@type":"WebSite","@id":"$SITE/#website","url":"$SITE/","name":"Laolu Logic","publisher":{"@id":"$SITE/#business"},"inLanguage":"en"}
]}
"@

function Get-Header($active) {
  $links = ($nav | ForEach-Object {
    $cur = if ($_.id -eq $active) { ' aria-current="page"' } else { '' }
    "<li><a href=""$($_.href)""$cur>$($_.label)</a></li>"
  }) -join ''
  $mlinks = ($nav | ForEach-Object { "<li><a href=""$($_.href)"">$($_.label)</a></li>" }) -join ''
@"
<header class="site-header">
  <div class="container nav">
    <a href="index.html" class="brand" aria-label="Laolu Logic, home">$mark<span><b>Laolu</b><em>Logic</em></span></a>
    <nav aria-label="Main"><ul class="nav-links">$links</ul></nav>
    <div class="nav-actions">
      <button class="icon-btn theme-toggle" type="button" aria-label="Switch to dark mode"><svg class="i-moon"><use href="assets/icons.svg#moon"/></svg><svg class="i-sun"><use href="assets/icons.svg#sun"/></svg></button>
      <a href="contact.html#book" class="btn btn--solid btn--sm" data-magnetic><span class="dot" aria-hidden="true"></span>Book a call</a>
      <button class="icon-btn menu-btn" type="button" aria-expanded="false" aria-controls="menu-panel" aria-label="Open menu"><span></span></button>
    </div>
  </div>
</header>
<div class="menu-panel" id="menu-panel" aria-hidden="true">
  <ol>$mlinks</ol>
  <div class="menu-foot">
    <a class="btn btn--accent btn--sm" href="contact.html#book">Book a strategy call</a>
    <a class="btn btn--line btn--sm" href="https://wa.me/2349169731457" target="_blank" rel="noopener">WhatsApp</a>
    <a class="btn btn--line btn--sm" href="mailto:laolulogic@gmail.com">Email</a>
  </div>
</div>
"@
}

$footer = @"
<footer class="site-footer band">
  <div class="container">
    <div class="f-top">
      <div>
        <a href="index.html" class="brand" aria-label="Laolu Logic, home">$mark<span><b>Laolu</b><em>Logic</em></span></a>
        <p>CRM systems, workflow automation and AI voice agents for real estate teams, agencies and businesses that live on follow-up.</p>
        <div class="socials">
          <a href="https://www.linkedin.com/in/ibrahim-awosanya" target="_blank" rel="noopener" aria-label="LinkedIn"><i style="--logo:url(/assets/logos/linkedin.svg)"></i></a>
          <a href="https://www.fiverr.com/lao_lu" target="_blank" rel="noopener" aria-label="Fiverr"><i style="--logo:url(/assets/logos/fiverr.svg)"></i></a>
          <a href="https://www.upwork.com/freelancers/~01319b2bfa0f24446a" target="_blank" rel="noopener" aria-label="Upwork"><i style="--logo:url(/assets/logos/upwork.svg)"></i></a>
          <a href="https://wa.me/2349169731457" target="_blank" rel="noopener" aria-label="WhatsApp"><i style="--logo:url(/assets/logos/whatsapp.svg)"></i></a>
          <a href="mailto:laolulogic@gmail.com" aria-label="Email laolulogic@gmail.com"><svg aria-hidden="true"><use href="assets/icons.svg#mail"/></svg></a>
        </div>
      </div>
      <div class="f-col"><h4>Explore</h4><ul><li><a href="index.html">Home</a></li><li><a href="services.html">Services</a></li><li><a href="real-estate.html">Real Estate CRM</a></li><li><a href="work.html">Case studies</a></li><li><a href="about.html">About</a></li><li><a href="contact.html">Contact</a></li></ul></div>
      <div class="f-col"><h4>Services</h4><ul><li><a href="services.html#crm">CRM setup &amp; migration</a></li><li><a href="services.html#automation">Workflow automation</a></li><li><a href="services.html#ai-voice">AI voice agents</a></li><li><a href="services.html#email-sms">Email &amp; SMS automation</a></li><li><a href="services.html#reactivation">Database reactivation</a></li><li><a href="services.html#management">CRM management</a></li></ul></div>
      <div class="f-col"><h4>Get in touch</h4><ul><li><a href="contact.html#book">Book a strategy call</a></li><li><a href="mailto:laolulogic@gmail.com">laolulogic@gmail.com</a></li><li><a href="https://wa.me/2349169731457" target="_blank" rel="noopener">WhatsApp</a></li><li><a href="tel:+2349169731457">+234 916 973 1457</a></li><li><a href="https://www.fiverr.com/lao_lu" target="_blank" rel="noopener">Hire on Fiverr</a></li><li><a href="https://www.upwork.com/freelancers/~01319b2bfa0f24446a" target="_blank" rel="noopener">Hire on Upwork</a></li><li><a href="https://www.linkedin.com/in/ibrahim-awosanya" target="_blank" rel="noopener">LinkedIn</a></li></ul></div>
    </div>
    <p class="f-giant" aria-hidden="true">Laolu <em>Logic</em></p>
    <div class="f-bottom"><span>&copy; <span data-year>2026</span> Laolu Logic &middot; Ibrahim &ldquo;Laolu&rdquo; Awosanya</span><span>Remote &middot; Working with teams worldwide</span></div>
  </div>
</footer>
<a class="wa-float" href="https://wa.me/2349169731457?text=Hi%20Laolu%2C%20I%20found%20you%20on%20your%20website." target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><i style="--logo:url(/assets/logos/whatsapp.svg)"></i><span class="tip">Chat on WhatsApp</span></a>
<button class="to-top" type="button" aria-label="Back to top"><svg class="ring" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="26"/></svg><svg class="arrow" aria-hidden="true"><use href="assets/icons.svg#arrow"/></svg></button>
"@

$introHtml = @"
<div class="intro" aria-hidden="true">
  <div class="intro-inner">$($mark -replace 'class="mark"','class="mark"')<div class="word"><span>L</span><span>a</span><span>o</span><span>l</span><span>u</span><span><em>Logic</em></span></div></div>
  <div class="intro-bar"><i></i></div>
  <button class="intro-skip" type="button">Skip</button>
</div>
"@

Get-ChildItem (Join-Path $Root 'src\pages') -Filter *.html | ForEach-Object {
  $raw = [IO.File]::ReadAllText($_.FullName, $utf8)
  $m = [regex]::Match($raw, '(?s)^<!--META(.*?)META-->')
  if (-not $m.Success) { throw "Missing META block in $($_.Name)" }
  $meta = $m.Groups[1].Value | ConvertFrom-Json
  $body = $raw.Substring($m.Length).Trim()
  $canon = if ($meta.path -eq '/') { "$SITE/" } else { "$SITE$($meta.path)" }
  $schemas = @($baseGraph)
  if ($meta.schema) { foreach ($s in $meta.schema) { $schemas += ($s | ConvertTo-Json -Depth 20 -Compress) } }
  $schemaTags = ($schemas | ForEach-Object { "<script type=""application/ld+json"">$($_.Replace('__SITE__', $SITE))</script>" }) -join "`n  "
  $intro = if ($meta.intro) { $introHtml } else { '' }
  $preload = if ($meta.preload) { "`n  <link rel=""preload"" as=""image"" href=""$($meta.preload)"" fetchpriority=""high"">" } else { '' }
  $title = [System.Net.WebUtility]::HtmlEncode($meta.title)
  $desc = [System.Net.WebUtility]::HtmlEncode($meta.description)

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
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Laolu Logic">
  <meta property="og:title" content="$title">
  <meta property="og:description" content="$desc">
  <meta property="og:url" content="$canon">
  <meta property="og:image" content="$SITE/assets/img/og.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Laolu Logic: CRM and AI automation by Ibrahim (Laolu) Awosanya">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="$title">
  <meta name="twitter:description" content="$desc">
  <meta name="twitter:image" content="$SITE/assets/img/og.png">
  <link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
  <script>(function(){try{var t=localStorage.getItem('ll-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)}catch(e){}})()</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap">
  <link rel="stylesheet" href="css/style.css">$preload
  $schemaTags
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"></div>
$intro
$(Get-Header $meta.active)
<main id="main">
$body
</main>
$footer
<script src="js/config.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.11/dist/lenis.min.js" defer></script>
<script src="js/main.js" defer></script>
</body>
</html>
"@
  [IO.File]::WriteAllText((Join-Path $Root $_.Name), $html, $utf8)
  "built $($_.Name)"
}

# sitemap.xml
$today = (Get-Date).ToString('yyyy-MM-dd')
$urls = @('/', '/services', '/real-estate', '/work', '/about', '/contact') | ForEach-Object {
  $loc = if ($_ -eq '/') { "$SITE/" } else { "$SITE$_" }
  $pri = if ($_ -eq '/') { '1.0' } else { '0.8' }
  "  <url><loc>$loc</loc><lastmod>$today</lastmod><priority>$pri</priority></url>"
}
[IO.File]::WriteAllText((Join-Path $Root 'sitemap.xml'), "<?xml version=""1.0"" encoding=""UTF-8""?>`n<urlset xmlns=""http://www.sitemaps.org/schemas/sitemap/0.9"">`n$($urls -join "`n")`n</urlset>`n", $utf8)
[IO.File]::WriteAllText((Join-Path $Root 'robots.txt'), "User-agent: *`nAllow: /`nDisallow: /backend/`nDisallow: /src/`n`nSitemap: $SITE/sitemap.xml`n", $utf8)
"built sitemap.xml, robots.txt"
