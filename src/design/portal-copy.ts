// Generated from portal.de.json.
export const PORTAL = {
  "app": "Portal",
  "tabs": [
    {
      "id": "overview",
      "label": "Übersicht"
    },
    {
      "id": "tournaments",
      "label": "Turniere"
    },
    {
      "id": "wishlists",
      "label": "Wunschlisten"
    },
    {
      "id": "billing",
      "label": "Abrechnung"
    },
    {
      "id": "team",
      "label": "Team"
    },
    {
      "id": "support",
      "label": "Support"
    },
    {
      "id": "settings",
      "label": "Einstellungen"
    }
  ],
  "switchOrg": "Organisation wechseln",
  "theme": {
    "dark": "Dunkles Design",
    "light": "Helles Design"
  },
  "create": "Turnier erstellen",
  "footer": {
    "copy": "© 2026 Planary, Schweiz",
    "links": [
      [
        "Hilfe",
        "https://planary.ch/tournament#faq"
      ],
      [
        "Impressum",
        "https://planary.ch/impressum"
      ],
      [
        "Datenschutz",
        "https://planary.ch/datenschutz"
      ],
      [
        "AGB",
        "https://planary.ch/agb"
      ]
    ]
  },
  "overdue": {
    "t": "Rechnung 2026-0213 über CHF 149.00 ist seit 12 Tagen offen.",
    "s": "Plus läuft bis 7. November normal weiter.",
    "cta": "Bezahlen"
  },
  "incident": {
    "t": "Störung bei Planary: Live-Resultate kommen verzögert an.",
    "s": "Seit 19:58. Eure Resultate sind gespeichert, die Beamer-Ansicht holt sie nach. Wir melden uns hier, sobald es wieder läuft."
  },
  "overview": {
    "plan": "Dein Plan",
    "included": "Inbegriffen",
    "change": "Plan ändern",
    "usage": "Nutzung 2026",
    "upcoming": "Kommende Turniere",
    "past": "Vergangene Turniere",
    "all": "Alle Turniere",
    "openReq": "Offene Anfrage",
    "replied": "Planary hat geantwortet"
  },
  "newOrg": {
    "h": "Willkommen, Lena.",
    "p": "Spielclub Thun ist eingerichtet.",
    "steps": [
      {
        "t": "Organisation angelegt",
        "p": "Name und Kontakt gespeichert.",
        "done": true
      },
      {
        "t": "Logo hochladen",
        "p": "Erscheint im Turnier, mit Turnier-Pass oder Plus auch auf dem Beamer.",
        "cta": "Logo hochladen",
        "go": "settings"
      },
      {
        "t": "Team einladen",
        "p": "Wer mit dir Turniere leitet. Gratis hat zwei Plätze.",
        "cta": "Einladen",
        "go": "team"
      },
      {
        "t": "Erstes Turnier erstellen",
        "p": "Spiel, Format, Datum.",
        "cta": "Turnier erstellen",
        "go": "create"
      }
    ],
    "emptyH": "Noch keine Turniere",
    "emptyP": "Hier erscheinen eure Turniere."
  },
  "tournaments": {
    "h": "Turniere"
  },
  "billing": {
    "h": "Abrechnung",
    "payH": "Zahlungsmittel",
    "payNote": "Verwaltet von Stripe",
    "payCta": "Bei Stripe ändern",
    "addrH": "Rechnungsadresse",
    "invH": "Rechnungen",
    "plansH": "Plan wechseln"
  },
  "team": {
    "h": "Team",
    "roles": [
      {
        "n": "Inhaber",
        "p": "Alles, auch Abrechnung und Team."
      },
      {
        "n": "Mitglied",
        "p": "Turniere und Wunschlisten, ohne Abrechnung."
      }
    ],
    "inviteH": "Jemanden einladen",
    "inviteP": "Die Einladung kommt per E-Mail.",
    "invite": "Einladung senden",
    "seats": "3 von 10 Plätzen im Plan Plus"
  },
  "support": {
    "h": "Support",
    "new": "Etwas stimmt nicht",
    "st": {
      "open": "Offen",
      "waiting": "Wartet auf dich",
      "done": "Erledigt"
    }
  },
  "newReq": {
    "h": "Etwas stimmt nicht",
    "topicL": "Worum geht es?",
    "topics": [
      "Ein Turnier",
      "Abrechnung",
      "Team und Konto",
      "Etwas anderes"
    ],
    "tourL": "Welches Turnier?",
    "whatL": "Was ist passiert?",
    "whatPh": "Zum Beispiel: Seit 19:55 zeigt die Beamer-Ansicht alte Resultate.",
    "attL": "Bildschirmfoto oder Foto",
    "attP": "PNG oder JPG, bis 10 MB.",
    "liveL": "Das Turnier läuft gerade",
    "liveP": "Dann sehen wir uns die Anfrage zuerst an.",
    "send": "Anfrage senden",
    "tipsH": "Was uns hilft",
    "tips": [
      "Welches Spiel oder welche Runde betroffen ist",
      "Was du erwartet hast und was stattdessen passiert ist",
      "Ein Foto vom Beamer oder ein Bildschirmfoto"
    ]
  },
  "settings": {
    "h": "Einstellungen",
    "orgH": "Organisation",
    "nameL": "Name",
    "slugL": "Kurzname",
    "logoL": "Logo",
    "logoP": "Quadratisch, ab 512 × 512 px. Mit Turnier-Pass oder Plus auch auf dem Beamer.",
    "contactH": "Kontakt",
    "mailL": "E-Mail für Rechnungen",
    "phoneL": "Telefon (freiwillig)",
    "addrL": "Rechnungsadresse",
    "save": "Änderungen speichern",
    "dangerH": "Organisation löschen",
    "dangerP": "Nach 30 Tagen ist alles gelöscht, auch Turniere und Wunschlisten.",
    "danger": "Organisation löschen"
  }
} as const;
