// Copy for Abrechnung, checkout and done (pricing handoff, content/portal-billing.de.json).
// Lines with names, dates and amounts are the design's samples; the pages build those from data.
export const PORTAL_BILLING = {
  "tabs": [
    [
      "plan",
      "Plan"
    ],
    [
      "invoices",
      "Rechnungen"
    ]
  ],
  "h": "Abrechnung",
  "five": "Ab fünf Turnieren im Jahr lohnt sich Plus.",
  "compare": "Alle Unterschiede",
  "pass": {
    "n": "Turnier-Pass",
    "p": "CHF 29",
    "per": "einmal, für ein Turnier",
    "inc": [
      "Bis 128 Teams",
      "10 Organisatoren",
      "Warteliste, eigenes Logo, Export"
    ],
    "cta": "Pass kaufen"
  },
  "plus": {
    "n": "Plus",
    "p": "CHF 149",
    "per": "pro Jahr, eine Rechnung",
    "inc": [
      "Unbegrenzt viele Turniere gleichzeitig",
      "Bis 128 Teams pro Turnier",
      "10 Organisatoren",
      "Warteliste, eigenes Logo, Export",
      "Support am Turniertag",
      "Zahlung auf Rechnung"
    ],
    "cta": "Plus wählen"
  },
  "missingH": "Nicht in Gratis",
  "missing": [
    "Mehr als 16 Teams",
    "Mehrere Turniere gleichzeitig",
    "Warteliste",
    "Eigenes Logo und Farben",
    "Export",
    "Support am Turniertag",
    "Zahlung auf Rechnung"
  ],
  "upH": "Mehr Platz",
  "lines": {
    "h": "Dein Abo",
    "base": "Basisplan",
    "once": "Einmalig",
    "addon": "Zusatz"
  },
  "payH": "Zahlungsmittel",
  "payCta": "Ändern",
  "payAlt": "Auf Rechnung zahlen",
  "payNote": "bei Stripe",
  "contactH": "Rechnungen gehen an",
  "contactCta": "Ändern",
  "lastInv": "Letzte Rechnungen",
  "allInv": "Alle Rechnungen",
  "out": "Zu Gratis wechseln",
  "loading": {
    "label": "Abrechnung wird geladen"
  },
  "error": {
    "t": "Die Abrechnung lädt gerade nicht.",
    "s": "Deine Turniere laufen normal weiter. Versuch es in einer Minute noch einmal.",
    "retry": "Erneut versuchen",
    "status": "Status von Planary"
  },
  "overdue": {
    "banner": "Rechnung 2026-0213 über CHF 149.00 ist seit 12 Tagen offen.",
    "bannerS": "Bitte bis 7. November bezahlen.",
    "cta": "Bezahlen",
    "h": "Eine Rechnung ist offen",
    "p": "Plus läuft bis 7. November normal weiter. Danach gelten für neue Turniere die Grenzen von Gratis, bis die Rechnung bezahlt ist.",
    "keepH": "Läuft weiter",
    "keep": [
      "Alle Turniere, auch laufende und geplante",
      "Anmeldung, Resultate und Beamer",
      "Eure Daten und Rechnungen"
    ],
    "stopH": "Ab 7. November pausiert",
    "stop": [
      "Neue Turniere mit mehr als 16 Teams",
      "Mehrere neue Turniere gleichzeitig",
      "Logo, Warteliste und Export bei neuen Turnieren"
    ],
    "payH": "So bezahlst du",
    "card": "Mit Karte bezahlen",
    "qr": "QR-Rechnung als PDF",
    "paid": "Schon überwiesen? Das braucht 1 bis 2 Werktage, dann verschwindet dieser Hinweis.",
    "time": "Mehr Zeit nötig? Schreib uns"
  },
  "cardExp": {
    "banner": "Deine Karte läuft im November ab, Plus verlängert sich am 3. Februar.",
    "cta": "Neue Karte hinterlegen",
    "alt": "Auf Rechnung wechseln",
    "box": "Läuft ab 11/26, vor der Verlängerung."
  },
  "cancel": {
    "crumb": "Zu Gratis wechseln",
    "h": "Zu Gratis wechseln",
    "when": "Plus läuft bis 2. Februar 2027. Ab 3. Februar 2027 seid ihr auf Gratis. Bis dahin kannst du jederzeit bei Plus bleiben.",
    "from": "Bis 2. Februar 2027",
    "fromV": "Plus",
    "to": "Ab 3. Februar 2027",
    "toV": "Gratis",
    "keepH": "Bleibt",
    "keep": [
      "Alle Turniere mit Teams, Resultaten und Bracket",
      "Alle Rechnungen",
      "Wishlist-Listen, ab der vierten nur noch lesen"
    ],
    "loseH": "Ändert sich ab 3. Februar",
    "lose": [
      "Neue Turniere bis 16 Teams, eines gleichzeitig",
      "Logo, Warteliste und Export nur noch in bestehenden Turnieren",
      "Kein Support am Turniertag",
      "Keine Zahlung auf Rechnung"
    ],
    "seatsH": "Wer leitet weiter Turniere?",
    "seatsP": "Gratis hat 2 Plätze. Die anderen behalten ihr Konto.",
    "confirm": "Wechsel bestätigen",
    "keepPlus": "Bei Plus bleiben"
  },
  "checkout": {
    "back": "Zurück zur Abrechnung",
    "backTour": "Zurück zu Planary Winter Cup",
    "plusH": "Plus für Spielclub Thun",
    "passH": "Turnier-Pass",
    "orgH": "Organisation",
    "orgNewH": "Für wen kaufst du?",
    "orgNewP": "Pässe und Rechnungen gehören einer Organisation. Du bist ihre Inhaberin.",
    "orgName": "Name",
    "orgMail": "E-Mail für Rechnungen",
    "tourH": "Für welches Turnier?",
    "payH": "Zahlung",
    "card": "Karte",
    "cardS": "Visa, Mastercard, Amex. Eingabe bei Stripe.",
    "invoice": "Rechnung",
    "invoiceS": "Per E-Mail mit QR-Rechnung, zahlbar in 30 Tagen. Plus startet sofort.",
    "invoiceOff": "Nur mit Plus",
    "sumH": "Zusammenfassung",
    "today": "Heute belastet",
    "total": "Total",
    "plusRenew": "Verlängert sich am 24. Oktober 2027. Wir erinnern dich 30 Tage vorher, kündigen geht im Portal mit einem Klick.",
    "passRule": "Gilt für dieses Turnier, bis es abgeschlossen ist. Danach bleibt alles sichtbar.",
    "go": "Weiter zur Zahlung",
    "goInvoice": "Plus aktivieren",
    "err": "Die Zahlung ist nicht durchgegangen. Es wurde nichts belastet.",
    "errS": "Deine Bank hat die Karte abgelehnt.",
    "retry": "Erneut versuchen",
    "other": "Andere Karte"
  },
  "done": {
    "h": "Plus ist aktiv.",
    "p": "Spielclub Thun · CHF 149.00 bezahlt · Beleg an lena@spielclub-thun.ch",
    "nowH": "Jetzt freigeschaltet",
    "now": [
      "Unbegrenzt viele Turniere gleichzeitig",
      "Bis 128 Teams pro Turnier",
      "10 Organisatoren",
      "Warteliste, eigenes Logo, Export",
      "Support am Turniertag",
      "Zahlung auf Rechnung"
    ],
    "nextH": "Weiter",
    "back": "Zurück zu Planary Winter Cup",
    "team": "Team einladen",
    "logo": "Logo hochladen",
    "pdf": "Beleg als PDF"
  },
  "invoicesP": "",
  "inv": {
    "cols": [
      "Nummer",
      "Leistung",
      "Betrag",
      "Status"
    ],
    "pay": "Bezahlen",
    "pdf": "PDF",
    "detailH": "Rechnung",
    "lines": "Positionen",
    "total": "Total",
    "due": "fällig",
    "payCard": "Mit Karte bezahlen",
    "qr": "QR-Rechnung als PDF"
  }
} as const;
