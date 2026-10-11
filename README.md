# LINAW: See where every peso goes
STS Final Activity. Website prototype on the issue of Corruption (Philippines).

## Folder structure
linaw-sts/
  index.html        Home (built)
  understand.html   Causes, costs, people, case timeline, laws (built)
  sts.html          Six STS concepts linked to the case and to Linaw (built)
  tracker.html      Sample-data dashboard: tile map, filters, project detail (built)
  tools.html        Red Flag Detective, Risk Checker, Report Guide (built)
  css/styles.css    Design system (colors, fonts, glass, buttons, layout)
  js/main.js        Header/footer, the Lens, reveals, counters, risk reader
  js/data.js        Sample-data generator + risk scoring (shared)
  js/tracker.js     Tracker page logic
  js/tools.js       Quiz, checker, report wizard
  assets/           favicon and images
  (coming next: action.html, sources.html, team.html)

## Run it on your computer
1. Install VS Code (code.visualstudio.com).
2. In VS Code: Extensions (Ctrl+Shift+X) -> install "Live Server".
3. File -> Open Folder -> choose the linaw-sts folder.
4. Right-click index.html -> "Open with Live Server".

## Edit the menu once, it updates every page
Open js/main.js and change the NAV list near the top.

## Fonts
Fonts (Newsreader, Hanken Grotesk) load from Google Fonts, so connect to the
internet at least once. For the classroom presentation, open the site once
beforehand so the fonts are cached, or ask me for an offline-fonts version.
