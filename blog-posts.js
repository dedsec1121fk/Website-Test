/* ============================================================================
   MAINTENANCE (DedSec Blog)
   - This file renders the Blog listing.
   - Primary mode: fetch posts from GitHub (auto-detects repo on *.github.io).
   - Offline fallback: EMBEDDED_POSTS below (update when you add/remove posts).
   ============================================================================ */
(() => {
  'use strict';

  const GRID_ID = 'blog-posts-grid';
  const DEFAULT_CFG = {
    github: {
      owner: 'dedsec1121fk',
      repo: 'dedsec1121fk.github.io',
      branch: 'main',
      blogDir: 'Blog'
    }
  };

  // Offline fallback for ZIP builds / rate limits.
  // Keep this list aligned with the "final" (non-redirect) posts you want to show in the Blog listing.
  const EMBEDDED_POSTS = [
  {
    "file": "passwordless-login-passkeys-explained-for-real-life.html",
    "href": "../Blog/passwordless-login-passkeys-explained-for-real-life.html",
    "titleEn": "Passwordless Login: Passkeys Explained for Real Life",
    "titleGr": "Σύνδεση χωρίς κωδικό: Τι είναι τα Passkeys στην πράξη",
    "descEn": "A clear guide to passkeys, why they reduce phishing, and how to adopt them safely across devices.",
    "descGr": "Ένας καθαρός οδηγός για τα passkeys, γιατί μειώνουν το phishing και πώς τα υιοθετείς με ασφάλεια σε όλες τις συσκευές.",
    "date": "2026-01-26",
    "section": "Technology",
    "tags": [
      "Technology",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "edge-computing-at-home-smarter-faster-and-private.html",
    "href": "../Blog/edge-computing-at-home-smarter-faster-and-private.html",
    "titleEn": "Edge Computing at Home: Smarter, Faster, and Private",
    "titleGr": "Edge Computing στο σπίτι: Πιο έξυπνο, πιο γρήγορο, πιο ιδιωτικό",
    "descEn": "How local processing (routers, NAS, mini-PCs) can cut latency and keep more data inside your home.",
    "descGr": "Πώς η τοπική επεξεργασία (router, NAS, mini‑PC) μειώνει την καθυστέρηση και κρατά περισσότερα δεδομένα στο σπίτι.",
    "date": "2026-01-26",
    "section": "Technology",
    "tags": [
      "Technology",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "data-brokers-how-your-profile-gets-built.html",
    "href": "../Blog/data-brokers-how-your-profile-gets-built.html",
    "titleEn": "Data Brokers: How Your Profile Gets Built",
    "titleGr": "Data Brokers: Πώς χτίζεται το προφίλ σου",
    "descEn": "What data brokers collect, how they connect the dots, and practical steps to shrink your footprint.",
    "descGr": "Τι συλλέγουν οι data brokers, πώς «ενώνουν τις τελείες» και πρακτικά βήματα για να μικρύνεις το αποτύπωμά σου.",
    "date": "2026-01-26",
    "section": "Technology",
    "tags": [
      "Technology",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "backups-that-actually-work-a-modern-3-2-1-plan.html",
    "href": "../Blog/backups-that-actually-work-a-modern-3-2-1-plan.html",
    "titleEn": "Backups That Actually Work: A Modern 3‑2‑1 Plan",
    "titleGr": "Backups που δουλεύουν: Ένα σύγχρονο πλάνο 3‑2‑1",
    "descEn": "Turn the famous 3‑2‑1 rule into a simple routine that survives theft, ransomware, and mistakes.",
    "descGr": "Κάνε τον κανόνα 3‑2‑1 μια απλή ρουτίνα που αντέχει κλοπή, ransomware και λάθη.",
    "date": "2026-01-26",
    "section": "Technology",
    "tags": [
      "Technology",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "privacy-by-design-in-apps-small-choices-big-impact.html",
    "href": "../Blog/privacy-by-design-in-apps-small-choices-big-impact.html",
    "titleEn": "Privacy by Design in Apps: Small Choices, Big Impact",
    "titleGr": "Privacy by Design στις εφαρμογές: Μικρές επιλογές, μεγάλο αποτέλεσμα",
    "descEn": "Design patterns that reduce data collection without breaking the user experience.",
    "descGr": "Μοτίβα σχεδιασμού που μειώνουν τη συλλογή δεδομένων χωρίς να χαλάει το UX.",
    "date": "2026-01-26",
    "section": "Technology",
    "tags": [
      "Technology",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "phishing-in-2026-a-practical-defense-playbook.html",
    "href": "../Blog/phishing-in-2026-a-practical-defense-playbook.html",
    "titleEn": "Phishing in 2026: A Practical Defense Playbook",
    "titleGr": "Phishing το 2026: Πρακτικό playbook άμυνας",
    "descEn": "How modern phishing works (SMS, voice, QR) and a layered checklist that stops most attacks.",
    "descGr": "Πώς δουλεύει το σύγχρονο phishing (SMS, φωνή, QR) και μια πολυεπίπεδη λίστα που σταματά τις περισσότερες επιθέσεις.",
    "date": "2026-01-26",
    "section": "Cybersecurity",
    "tags": [
      "Cybersecurity",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "secure-your-home-router-in-30-minutes.html",
    "href": "../Blog/secure-your-home-router-in-30-minutes.html",
    "titleEn": "Secure Your Home Router in 30 Minutes",
    "titleGr": "Ασφάλισε το router σου σε 30 λεπτά",
    "descEn": "A step-by-step hardening guide: firmware, Wi‑Fi settings, guest networks, and logging.",
    "descGr": "Οδηγός σκλήρυνσης βήμα‑βήμα: firmware, ρυθμίσεις Wi‑Fi, guest δίκτυα και logs.",
    "date": "2026-01-26",
    "section": "Cybersecurity",
    "tags": [
      "Cybersecurity",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "incident-response-for-individuals-the-first-60-minutes.html",
    "href": "../Blog/incident-response-for-individuals-the-first-60-minutes.html",
    "titleEn": "Incident Response for Individuals: The First 60 Minutes",
    "titleGr": "Αντιμετώπιση περιστατικού για ιδιώτες: Τα πρώτα 60 λεπτά",
    "descEn": "What to do after a hack: isolate, preserve evidence, regain accounts, and prevent repeat compromise.",
    "descGr": "Τι κάνεις μετά από hack: απομόνωση, διατήρηση στοιχείων, ανάκτηση λογαριασμών και αποφυγή επανάληψης.",
    "date": "2026-01-26",
    "section": "Cybersecurity",
    "tags": [
      "Cybersecurity",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "metadata-matters-choosing-messaging-apps-wisely.html",
    "href": "../Blog/metadata-matters-choosing-messaging-apps-wisely.html",
    "titleEn": "Metadata Matters: Choosing Messaging Apps Wisely",
    "titleGr": "Τα metadata μετράνε: Πώς να διαλέξεις σωστά messaging",
    "descEn": "End‑to‑end encryption is not the whole story—learn what metadata is and how to minimize it.",
    "descGr": "Η end‑to‑end κρυπτογράφηση δεν είναι όλη η ιστορία—μάθε τι είναι τα metadata και πώς τα μειώνεις.",
    "date": "2026-01-26",
    "section": "Cybersecurity",
    "tags": [
      "Cybersecurity",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "browser-hardening-settings-that-reduce-risk.html",
    "href": "../Blog/browser-hardening-settings-that-reduce-risk.html",
    "titleEn": "Browser Hardening: Settings That Reduce Risk",
    "titleGr": "Σκλήρυνση browser: Ρυθμίσεις που μειώνουν ρίσκο",
    "descEn": "A focused checklist for privacy and security: updates, extensions, isolation, and safer defaults.",
    "descGr": "Μια στοχευμένη λίστα για ιδιωτικότητα και ασφάλεια: ενημερώσεις, πρόσθετα, απομόνωση και ασφαλείς προεπιλογές.",
    "date": "2026-01-26",
    "section": "Cybersecurity",
    "tags": [
      "Cybersecurity",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "termux-setup-basics-storage-updates-and-safety.html",
    "href": "../Blog/termux-setup-basics-storage-updates-and-safety.html",
    "titleEn": "Termux Setup Basics: Storage, Updates, and Safety",
    "titleGr": "Βασικά Termux: Αποθήκευση, ενημερώσεις και ασφάλεια",
    "descEn": "A beginner-friendly setup that avoids the most common Termux pitfalls on Android.",
    "descGr": "Ένα φιλικό setup που αποφεύγει τα πιο συχνά προβλήματα του Termux στο Android.",
    "date": "2026-01-26",
    "section": "Termux",
    "tags": [
      "Termux",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "python-on-termux-venv-pip-and-clean-projects.html",
    "href": "../Blog/python-on-termux-venv-pip-and-clean-projects.html",
    "titleEn": "Python on Termux: venv, pip, and Clean Projects",
    "titleGr": "Python στο Termux: venv, pip και καθαρά projects",
    "descEn": "How to build repeatable Python projects on Android without dependency chaos.",
    "descGr": "Πώς φτιάχνεις επαναλήψιμα Python projects στο Android χωρίς χάος εξαρτήσεων.",
    "date": "2026-01-26",
    "section": "Termux",
    "tags": [
      "Termux",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "ssh-from-your-phone-secure-remote-admin-with-termux.html",
    "href": "../Blog/ssh-from-your-phone-secure-remote-admin-with-termux.html",
    "titleEn": "SSH From Your Phone: Secure Remote Admin with Termux",
    "titleGr": "SSH από το κινητό: Ασφαλές remote admin με Termux",
    "descEn": "Use your phone as a secure terminal: keys, known_hosts, and safe defaults.",
    "descGr": "Χρησιμοποίησε το κινητό σαν ασφαλές τερματικό: κλειδιά, known_hosts και ασφαλείς προεπιλογές.",
    "date": "2026-01-26",
    "section": "Termux",
    "tags": [
      "Termux",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "backups-for-termux-saving-scripts-and-dotfiles.html",
    "href": "../Blog/backups-for-termux-saving-scripts-and-dotfiles.html",
    "titleEn": "Backups for Termux: Saving Scripts and Dotfiles",
    "titleGr": "Backups για Termux: Σώσε scripts και dotfiles",
    "descEn": "A simple backup strategy for your Termux home, configs, and scripts.",
    "descGr": "Μια απλή στρατηγική backup για το Termux home, configs και scripts.",
    "date": "2026-01-26",
    "section": "Termux",
    "tags": [
      "Termux",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "termux-networking-curl-dns-and-debugging-connectivity.html",
    "href": "../Blog/termux-networking-curl-dns-and-debugging-connectivity.html",
    "titleEn": "Termux Networking: Curl, DNS, and Debugging Connectivity",
    "titleGr": "Δικτύωση στο Termux: Curl, DNS και debugging συνδεσιμότητας",
    "descEn": "Diagnose common network issues from your phone using standard CLI tools.",
    "descGr": "Διάγνωση συνηθισμένων θεμάτων δικτύου από το κινητό με κλασικά εργαλεία CLI.",
    "date": "2026-01-26",
    "section": "Termux",
    "tags": [
      "Termux",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "linux-permissions-chmod-chown-and-umask-without-confusion.html",
    "href": "../Blog/linux-permissions-chmod-chown-and-umask-without-confusion.html",
    "titleEn": "Linux Permissions: chmod, chown, and umask without Confusion",
    "titleGr": "Δικαιώματα Linux: chmod, chown και umask χωρίς μπέρδεμα",
    "descEn": "Understand permissions with practical examples and safe defaults.",
    "descGr": "Κατανόησε τα δικαιώματα με πρακτικά παραδείγματα και ασφαλείς προεπιλογές.",
    "date": "2026-01-26",
    "section": "Linux",
    "tags": [
      "Linux",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "systemd-logs-journalctl-tips-you-ll-actually-use.html",
    "href": "../Blog/systemd-logs-journalctl-tips-you-ll-actually-use.html",
    "titleEn": "systemd Logs: journalctl Tips You’ll Actually Use",
    "titleGr": "Logs στο systemd: journalctl tips που θα χρησιμοποιήσεις",
    "descEn": "Filter logs fast, persist what matters, and troubleshoot services efficiently.",
    "descGr": "Φίλτραρε logs γρήγορα, κράτα ό,τι χρειάζεται και κάνε troubleshooting υπηρεσιών.",
    "date": "2026-01-26",
    "section": "Linux",
    "tags": [
      "Linux",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "nftables-basics-a-simple-firewall-you-can-maintain.html",
    "href": "../Blog/nftables-basics-a-simple-firewall-you-can-maintain.html",
    "titleEn": "nftables Basics: A Simple Firewall You Can Maintain",
    "titleGr": "Βασικά nftables: Ένα firewall που μπορείς να συντηρείς",
    "descEn": "A minimal ruleset for a workstation/server and how to test it safely.",
    "descGr": "Ένα minimal ruleset για workstation/server και πώς το τεστάρεις με ασφάλεια.",
    "date": "2026-01-26",
    "section": "Linux",
    "tags": [
      "Linux",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "bash-scripting-safety-writing-scripts-that-don-t-bite.html",
    "href": "../Blog/bash-scripting-safety-writing-scripts-that-don-t-bite.html",
    "titleEn": "Bash Scripting Safety: Writing Scripts That Don’t Bite",
    "titleGr": "Ασφάλεια σε Bash scripting: Scripts που δεν «δαγκώνουν»",
    "descEn": "Quoting, set -e, traps, and patterns that prevent costly mistakes.",
    "descGr": "Quoting, set -e, traps και μοτίβα που αποτρέπουν ακριβά λάθη.",
    "date": "2026-01-26",
    "section": "Linux",
    "tags": [
      "Linux",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "performance-triage-top-free-iostat-and-what-they-mean.html",
    "href": "../Blog/performance-triage-top-free-iostat-and-what-they-mean.html",
    "titleEn": "Performance Triage: top, free, iostat, and What They Mean",
    "titleGr": "Γρήγορο performance triage: top, free, iostat και τι σημαίνουν",
    "descEn": "A practical workflow to spot CPU, RAM, disk, and IO bottlenecks.",
    "descGr": "Πρακτικό workflow για να εντοπίσεις CPU, RAM, δίσκο και IO bottlenecks.",
    "date": "2026-01-26",
    "section": "Linux",
    "tags": [
      "Linux",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "android-privacy-checklist-settings-worth-changing.html",
    "href": "../Blog/android-privacy-checklist-settings-worth-changing.html",
    "titleEn": "Android Privacy Checklist: Settings Worth Changing",
    "titleGr": "Android privacy checklist: Ρυθμίσεις που αξίζουν",
    "descEn": "Quick wins for privacy: permissions, ads ID, DNS, and safer backups.",
    "descGr": "Γρήγορα κέρδη για privacy: άδειες, ads ID, DNS και πιο ασφαλή backups.",
    "date": "2026-01-26",
    "section": "Android",
    "tags": [
      "Android",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "app-permissions-explained-what-to-allow-and-when.html",
    "href": "../Blog/app-permissions-explained-what-to-allow-and-when.html",
    "titleEn": "App Permissions Explained: What to Allow and When",
    "titleGr": "Άδειες εφαρμογών: Τι να επιτρέπεις και πότε",
    "descEn": "A practical guide to Android permission prompts and how to say ‘no’ safely.",
    "descGr": "Πρακτικός οδηγός για prompts αδειών στο Android και πώς λες «όχι» με ασφάλεια.",
    "date": "2026-01-26",
    "section": "Android",
    "tags": [
      "Android",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "adb-basics-safely-useful-commands-without-bricking-anything.html",
    "href": "../Blog/adb-basics-safely-useful-commands-without-bricking-anything.html",
    "titleEn": "ADB Basics (Safely): Useful Commands without Bricking Anything",
    "titleGr": "ADB basics (με ασφάλεια): Χρήσιμες εντολές χωρίς brick",
    "descEn": "What ADB can do, how to enable it safely, and a small set of low-risk commands.",
    "descGr": "Τι κάνει το ADB, πώς το ενεργοποιείς με ασφάλεια και ένα μικρό σετ χαμηλού ρίσκου εντολών.",
    "date": "2026-01-26",
    "section": "Android",
    "tags": [
      "Android",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "security-updates-on-android-what-they-fix-and-how-to-track-them.html",
    "href": "../Blog/security-updates-on-android-what-they-fix-and-how-to-track-them.html",
    "titleEn": "Security Updates on Android: What They Fix and How to Track Them",
    "titleGr": "Security updates στο Android: Τι διορθώνουν και πώς τα παρακολουθείς",
    "descEn": "How monthly patches work, why OEM delays matter, and how to check your patch level.",
    "descGr": "Πώς δουλεύουν τα μηνιαία patches, γιατί μετράνε οι καθυστερήσεις OEM και πώς βλέπεις το patch level.",
    "date": "2026-01-26",
    "section": "Android",
    "tags": [
      "Android",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "back-up-an-android-phone-the-right-way.html",
    "href": "../Blog/back-up-an-android-phone-the-right-way.html",
    "titleEn": "Back Up an Android Phone the Right Way",
    "titleGr": "Κάνε backup Android σωστά",
    "descEn": "A balanced approach: local, encrypted cloud, and app-specific exports.",
    "descGr": "Ισορροπημένη προσέγγιση: τοπικά, κρυπτογραφημένο cloud και exports ανά εφαρμογή.",
    "date": "2026-01-26",
    "section": "Android",
    "tags": [
      "Android",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "iphone-privacy-and-safety-checklist.html",
    "href": "../Blog/iphone-privacy-and-safety-checklist.html",
    "titleEn": "iPhone Privacy & Safety Checklist",
    "titleGr": "Privacy & ασφάλεια στο iPhone: Checklist",
    "descEn": "Tighten privacy on iOS: permissions, location, analytics, and safer sharing.",
    "descGr": "Σφίξε το privacy στο iOS: άδειες, τοποθεσία, analytics και ασφαλέστερο sharing.",
    "date": "2026-01-26",
    "section": "iOS",
    "tags": [
      "iOS",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "icloud-security-2fa-recovery-and-what-to-turn-on.html",
    "href": "../Blog/icloud-security-2fa-recovery-and-what-to-turn-on.html",
    "titleEn": "iCloud Security: 2FA, Recovery, and What to Turn On",
    "titleGr": "Ασφάλεια iCloud: 2FA, ανάκτηση και τι να ενεργοποιήσεις",
    "descEn": "Protect your Apple ID with recovery plans that still work when you lose a device.",
    "descGr": "Προστάτεψε το Apple ID με σχέδια ανάκτησης που δουλεύουν ακόμη κι αν χάσεις συσκευή.",
    "date": "2026-01-26",
    "section": "iOS",
    "tags": [
      "iOS",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "app-tracking-transparency-what-it-does-and-doesn-t.html",
    "href": "../Blog/app-tracking-transparency-what-it-does-and-doesn-t.html",
    "titleEn": "App Tracking Transparency: What It Does (and Doesn’t)",
    "titleGr": "App Tracking Transparency: Τι κάνει (και τι δεν κάνει)",
    "descEn": "Understand ATT, fingerprints, and how to reduce tracking beyond the pop-up.",
    "descGr": "Κατανόησε το ATT, τα fingerprints και πώς μειώνεις το tracking πέρα από το pop‑up.",
    "date": "2026-01-26",
    "section": "iOS",
    "tags": [
      "iOS",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "safari-hardening-extensions-settings-and-safer-browsing.html",
    "href": "../Blog/safari-hardening-extensions-settings-and-safer-browsing.html",
    "titleEn": "Safari Hardening: Extensions, Settings, and Safer Browsing",
    "titleGr": "Σκλήρυνση Safari: Επεκτάσεις, ρυθμίσεις και ασφαλέστερο browsing",
    "descEn": "Reduce drive-by risk with updates, content blockers, and smart defaults.",
    "descGr": "Μείωσε ρίσκο με ενημερώσεις, content blockers και έξυπνες προεπιλογές.",
    "date": "2026-01-26",
    "section": "iOS",
    "tags": [
      "iOS",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "lockdown-mode-when-it-makes-sense.html",
    "href": "../Blog/lockdown-mode-when-it-makes-sense.html",
    "titleEn": "Lockdown Mode: When It Makes Sense",
    "titleGr": "Lockdown Mode: Πότε έχει νόημα",
    "descEn": "Who should enable it, what breaks, and how to prepare for targeted threats.",
    "descGr": "Για ποιους είναι, τι «σπάει» και πώς προετοιμάζεσαι για στοχευμένες απειλές.",
    "date": "2026-01-26",
    "section": "iOS",
    "tags": [
      "iOS",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "why-conspiracy-theories-feel-convincing.html",
    "href": "../Blog/why-conspiracy-theories-feel-convincing.html",
    "titleEn": "Why Conspiracy Theories Feel Convincing",
    "titleGr": "Γιατί οι θεωρίες συνωμοσίας φαίνονται πειστικές",
    "descEn": "A psychology-and-media guide to the patterns that make extraordinary claims stick.",
    "descGr": "Οδηγός ψυχολογίας και media για τα μοτίβα που κάνουν τους ισχυρισμούς να «κολλάνε».",
    "date": "2026-01-26",
    "section": "Conspiracy Theories",
    "tags": [
      "Conspiracy Theories",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "a-simple-framework-to-check-extraordinary-claims.html",
    "href": "../Blog/a-simple-framework-to-check-extraordinary-claims.html",
    "titleEn": "A Simple Framework to Check Extraordinary Claims",
    "titleGr": "Ένα απλό πλαίσιο ελέγχου για «μεγάλους» ισχυρισμούς",
    "descEn": "Use sources, incentives, and falsifiability to separate curiosity from certainty.",
    "descGr": "Χρησιμοποίησε πηγές, κίνητρα και διαψευσιμότητα για να ξεχωρίζεις την περιέργεια από τη βεβαιότητα.",
    "date": "2026-01-26",
    "section": "Conspiracy Theories",
    "tags": [
      "Conspiracy Theories",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "ufo-stories-curiosity-without-jumping-to-conclusions.html",
    "href": "../Blog/ufo-stories-curiosity-without-jumping-to-conclusions.html",
    "titleEn": "UFO Stories: Curiosity without Jumping to Conclusions",
    "titleGr": "Ιστορίες UFO: Περιέργεια χωρίς άλματα συμπερασμάτων",
    "descEn": "How to evaluate sightings: data quality, alternative explanations, and uncertainty.",
    "descGr": "Πώς αξιολογείς θεάσεις: ποιότητα δεδομένων, εναλλακτικές εξηγήσεις και αβεβαιότητα.",
    "date": "2026-01-26",
    "section": "Conspiracy Theories",
    "tags": [
      "Conspiracy Theories",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "the-crisis-actor-myth-how-it-spreads-and-how-to-respond.html",
    "href": "../Blog/the-crisis-actor-myth-how-it-spreads-and-how-to-respond.html",
    "titleEn": "The ‘Crisis Actor’ Myth: How It Spreads and How to Respond",
    "titleGr": "Ο μύθος των «crisis actors»: Πώς διαδίδεται και πώς απαντάς",
    "descEn": "A case study in online rumor dynamics and respectful debunking.",
    "descGr": "Μελέτη περίπτωσης για τη δυναμική φημών online και πώς κάνεις debunk με σεβασμό.",
    "date": "2026-01-26",
    "section": "Conspiracy Theories",
    "tags": [
      "Conspiracy Theories",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "chemtrails-vs-contrails-what-science-actually-says.html",
    "href": "../Blog/chemtrails-vs-contrails-what-science-actually-says.html",
    "titleEn": "Chemtrails vs Contrails: What Science Actually Says",
    "titleGr": "Chemtrails vs Contrails: Τι λέει πραγματικά η επιστήμη",
    "descEn": "What you see in the sky, why it persists, and where misinformation enters.",
    "descGr": "Τι βλέπεις στον ουρανό, γιατί μένει και πού μπαίνει η παραπληροφόρηση.",
    "date": "2026-01-26",
    "section": "Conspiracy Theories",
    "tags": [
      "Conspiracy Theories",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "the-scientific-method-in-the-internet-age.html",
    "href": "../Blog/the-scientific-method-in-the-internet-age.html",
    "titleEn": "The Scientific Method in the Internet Age",
    "titleGr": "Η επιστημονική μέθοδος στην εποχή του internet",
    "descEn": "How hypotheses, replication, and peer review work—and how they fail sometimes.",
    "descGr": "Πώς δουλεύουν υποθέσεις, αναπαραγωγή και peer review—και πού αποτυγχάνουν μερικές φορές.",
    "date": "2026-01-26",
    "section": "Science",
    "tags": [
      "Science",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "climate-models-what-they-are-and-what-they-aren-t.html",
    "href": "../Blog/climate-models-what-they-are-and-what-they-aren-t.html",
    "titleEn": "Climate Models: What They Are and What They Aren’t",
    "titleGr": "Κλιματικά μοντέλα: Τι είναι και τι δεν είναι",
    "descEn": "A practical explanation of models, uncertainty, and why ‘one graph’ is never the full story.",
    "descGr": "Πρακτική εξήγηση για μοντέλα, αβεβαιότητα και γιατί «ένα γράφημα» δεν είναι ποτέ όλη η ιστορία.",
    "date": "2026-01-26",
    "section": "Science",
    "tags": [
      "Science",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "vaccines-and-trials-reading-medical-claims-carefully.html",
    "href": "../Blog/vaccines-and-trials-reading-medical-claims-carefully.html",
    "titleEn": "Vaccines and Trials: Reading Medical Claims Carefully",
    "titleGr": "Εμβόλια και κλινικές δοκιμές: Διάβαζε τους ισχυρισμούς σωστά",
    "descEn": "Phases, endpoints, and how to spot bad statistics in viral posts.",
    "descGr": "Φάσεις, endpoints και πώς εντοπίζεις κακή στατιστική σε viral posts.",
    "date": "2026-01-26",
    "section": "Science",
    "tags": [
      "Science",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "space-telescopes-how-we-turn-light-into-knowledge.html",
    "href": "../Blog/space-telescopes-how-we-turn-light-into-knowledge.html",
    "titleEn": "Space Telescopes: How We Turn Light into Knowledge",
    "titleGr": "Διαστημικά τηλεσκόπια: Πώς κάνουμε το φως γνώση",
    "descEn": "From spectra to images: the basics behind JWST-style observations.",
    "descGr": "Από φάσματα σε εικόνες: τα βασικά πίσω από παρατηρήσεις τύπου JWST.",
    "date": "2026-01-26",
    "section": "Science",
    "tags": [
      "Science",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "p-hacking-and-significant-results-a-reader-s-guide.html",
    "href": "../Blog/p-hacking-and-significant-results-a-reader-s-guide.html",
    "titleEn": "P‑Hacking and ‘Significant’ Results: A Reader’s Guide",
    "titleGr": "P‑hacking και «σημαντικά» αποτελέσματα: Οδηγός αναγνώστη",
    "descEn": "What p-values mean, common tricks, and what to look for in a good study.",
    "descGr": "Τι σημαίνουν τα p-values, συχνά κόλπα και τι να ψάχνεις σε μια καλή μελέτη.",
    "date": "2026-01-26",
    "section": "Science",
    "tags": [
      "Science",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "crispr-basics-what-gene-editing-can-and-can-t-do.html",
    "href": "../Blog/crispr-basics-what-gene-editing-can-and-can-t-do.html",
    "titleEn": "CRISPR Basics: What Gene Editing Can (and Can’t) Do",
    "titleGr": "Βασικά CRISPR: Τι μπορεί (και τι δεν μπορεί) η γονιδιακή επεξεργασία",
    "descEn": "A grounded guide to CRISPR, off-target effects, and real-world applications.",
    "descGr": "Γειωμένος οδηγός για CRISPR, off‑target effects και εφαρμογές στον πραγματικό κόσμο.",
    "date": "2026-01-26",
    "section": "Biology",
    "tags": [
      "Biology",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "the-microbiome-hype-vs-reality.html",
    "href": "../Blog/the-microbiome-hype-vs-reality.html",
    "titleEn": "The Microbiome: Hype vs Reality",
    "titleGr": "Το μικροβίωμα: Hype vs πραγματικότητα",
    "descEn": "What we know, what is still uncertain, and how to evaluate probiotic claims.",
    "descGr": "Τι ξέρουμε, τι παραμένει αβέβαιο και πώς αξιολογείς claims για προβιοτικά.",
    "date": "2026-01-26",
    "section": "Biology",
    "tags": [
      "Biology",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "sleep-biology-circadian-rhythms-and-better-habits.html",
    "href": "../Blog/sleep-biology-circadian-rhythms-and-better-habits.html",
    "titleEn": "Sleep Biology: Circadian Rhythms and Better Habits",
    "titleGr": "Βιολογία ύπνου: Κιρκάδιος ρυθμός και καλύτερες συνήθειες",
    "descEn": "A practical look at light, melatonin, and routines that support recovery.",
    "descGr": "Πρακτική ματιά σε φως, μελατονίνη και ρουτίνες που βοηθούν την αποκατάσταση.",
    "date": "2026-01-26",
    "section": "Biology",
    "tags": [
      "Biology",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "antibiotic-resistance-why-finish-the-course-is-nuanced.html",
    "href": "../Blog/antibiotic-resistance-why-finish-the-course-is-nuanced.html",
    "titleEn": "Antibiotic Resistance: Why ‘Finish the Course’ is Nuanced",
    "titleGr": "Αντοχή στα αντιβιοτικά: Γιατί το «τέλειωσέ το» είναι πιο σύνθετο",
    "descEn": "How resistance emerges and what responsible antibiotic use looks like today.",
    "descGr": "Πώς εμφανίζεται η αντοχή και πώς μοιάζει η υπεύθυνη χρήση σήμερα.",
    "date": "2026-01-26",
    "section": "Biology",
    "tags": [
      "Biology",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "nutrition-basics-metabolism-without-myths.html",
    "href": "../Blog/nutrition-basics-metabolism-without-myths.html",
    "titleEn": "Nutrition Basics: Metabolism without Myths",
    "titleGr": "Βασικά διατροφής: Μεταβολισμός χωρίς μύθους",
    "descEn": "Calories, protein, fiber, and how to think in patterns rather than hacks.",
    "descGr": "Θερμίδες, πρωτεΐνη, ίνες και πώς σκέφτεσαι σε μοτίβα αντί για «κόλπα».",
    "date": "2026-01-26",
    "section": "Biology",
    "tags": [
      "Biology",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "how-large-language-models-work-without-the-hype.html",
    "href": "../Blog/how-large-language-models-work-without-the-hype.html",
    "titleEn": "How Large Language Models Work (Without the Hype)",
    "titleGr": "Πώς δουλεύουν τα Large Language Models (χωρίς hype)",
    "descEn": "Tokens, training, and why LLMs sound confident even when they’re wrong.",
    "descGr": "Tokens, εκπαίδευση και γιατί τα LLM ακούγονται σίγουρα ακόμη κι όταν κάνουν λάθος.",
    "date": "2026-01-26",
    "section": "Artificial Intelligence",
    "tags": [
      "Artificial Intelligence",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "prompt-injection-the-sneaky-security-risk-for-ai-apps.html",
    "href": "../Blog/prompt-injection-the-sneaky-security-risk-for-ai-apps.html",
    "titleEn": "Prompt Injection: The Sneaky Security Risk for AI Apps",
    "titleGr": "Prompt Injection: Το ύπουλο ρίσκο για AI εφαρμογές",
    "descEn": "What prompt injection is, why it works, and practical mitigations.",
    "descGr": "Τι είναι prompt injection, γιατί δουλεύει και πρακτικά μέτρα άμυνας.",
    "date": "2026-01-26",
    "section": "Artificial Intelligence",
    "tags": [
      "Artificial Intelligence",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "bias-in-ai-where-it-comes-from-and-how-to-reduce-it.html",
    "href": "../Blog/bias-in-ai-where-it-comes-from-and-how-to-reduce-it.html",
    "titleEn": "Bias in AI: Where It Comes From and How to Reduce It",
    "titleGr": "Μεροληψία στην AI: Από πού έρχεται και πώς τη μειώνεις",
    "descEn": "A practical toolkit: data audits, evals, and human feedback.",
    "descGr": "Πρακτικό toolkit: έλεγχος δεδομένων, αξιολογήσεις και ανθρώπινο feedback.",
    "date": "2026-01-26",
    "section": "Artificial Intelligence",
    "tags": [
      "Artificial Intelligence",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "ai-in-healthcare-promise-risk-and-safe-deployment.html",
    "href": "../Blog/ai-in-healthcare-promise-risk-and-safe-deployment.html",
    "titleEn": "AI in Healthcare: Promise, Risk, and Safe Deployment",
    "titleGr": "AI στην υγεία: Υπόσχεση, ρίσκο και ασφαλής εφαρμογή",
    "descEn": "Where AI helps, where it fails, and what good oversight looks like.",
    "descGr": "Πού βοηθά η AI, πού αποτυγχάνει και πώς μοιάζει η σωστή επίβλεψη.",
    "date": "2026-01-26",
    "section": "Artificial Intelligence",
    "tags": [
      "Artificial Intelligence",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "ai-regulation-101-what-risk-based-rules-mean.html",
    "href": "../Blog/ai-regulation-101-what-risk-based-rules-mean.html",
    "titleEn": "AI Regulation 101: What ‘Risk-Based’ Rules Mean",
    "titleGr": "AI Regulation 101: Τι σημαίνουν οι «κανόνες βάσει ρίσκου»",
    "descEn": "A readable overview of risk tiers, documentation, and accountability.",
    "descGr": "Εύληπτη επισκόπηση για επίπεδα ρίσκου, τεκμηρίωση και λογοδοσία.",
    "date": "2026-01-26",
    "section": "Artificial Intelligence",
    "tags": [
      "Artificial Intelligence",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "gdpr-for-creators-a-practical-starter-kit.html",
    "href": "../Blog/gdpr-for-creators-a-practical-starter-kit.html",
    "titleEn": "GDPR for Creators: A Practical Starter Kit",
    "titleGr": "GDPR για creators: Πρακτικό starter kit",
    "descEn": "If you run a site or newsletter, here are the basics to avoid common compliance mistakes.",
    "descGr": "Αν τρέχεις site ή newsletter, εδώ είναι τα βασικά για να αποφύγεις συχνά λάθη συμμόρφωσης.",
    "date": "2026-01-26",
    "section": "Law",
    "tags": [
      "Law",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "cybercrime-laws-in-the-eu-what-unauthorized-access-means.html",
    "href": "../Blog/cybercrime-laws-in-the-eu-what-unauthorized-access-means.html",
    "titleEn": "Cybercrime Laws in the EU: What ‘Unauthorized Access’ Means",
    "titleGr": "Νόμοι κυβερνοεγκλήματος στην ΕΕ: Τι σημαίνει «μη εξουσιοδοτημένη πρόσβαση»",
    "descEn": "A high-level guide to common offences and why intent and authorization matter.",
    "descGr": "Υψηλού επιπέδου οδηγός για συνηθισμένα αδικήματα και γιατί μετράνε πρόθεση και εξουσιοδότηση.",
    "date": "2026-01-26",
    "section": "Law",
    "tags": [
      "Law",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "online-contracts-terms-of-service-in-plain-language.html",
    "href": "../Blog/online-contracts-terms-of-service-in-plain-language.html",
    "titleEn": "Online Contracts: Terms of Service in Plain Language",
    "titleGr": "Online συμβάσεις: Όροι χρήσης σε απλά λόγια",
    "descEn": "How to read ToS like a checklist: payments, data, disputes, and termination.",
    "descGr": "Πώς διαβάζεις ToS σαν checklist: πληρωμές, δεδομένα, διαφορές και λήξη.",
    "date": "2026-01-26",
    "section": "Law",
    "tags": [
      "Law",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "defamation-online-opinion-facts-and-safer-posting.html",
    "href": "../Blog/defamation-online-opinion-facts-and-safer-posting.html",
    "titleEn": "Defamation Online: Opinion, Facts, and Safer Posting",
    "titleGr": "Δυσφήμιση online: Γνώμη, γεγονότα και ασφαλέστερη δημοσίευση",
    "descEn": "How to reduce legal risk when writing about people or companies—without giving legal advice.",
    "descGr": "Πώς μειώνεις νομικό ρίσκο όταν γράφεις για πρόσωπα ή εταιρείες—χωρίς να είναι νομική συμβουλή.",
    "date": "2026-01-26",
    "section": "Law",
    "tags": [
      "Law",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "digital-evidence-basics-screenshots-logs-and-chain-of-custody.html",
    "href": "../Blog/digital-evidence-basics-screenshots-logs-and-chain-of-custody.html",
    "titleEn": "Digital Evidence Basics: Screenshots, Logs, and Chain of Custody",
    "titleGr": "Βασικά ψηφιακών αποδείξεων: screenshots, logs και αλυσίδα φύλαξης",
    "descEn": "Preserving digital evidence for disputes or reports: what to capture and how to store it.",
    "descGr": "Διατήρηση ψηφιακών στοιχείων για διαφορές ή αναφορές: τι κρατάς και πώς το αποθηκεύεις.",
    "date": "2026-01-26",
    "section": "Law",
    "tags": [
      "Law",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "corruption-in-greece-the-mechanics-not-the-rumors.html",
    "href": "../Blog/corruption-in-greece-the-mechanics-not-the-rumors.html",
    "titleEn": "Corruption in Greece: The Mechanics, Not the Rumors",
    "titleGr": "Διαφθορά στην Ελλάδα: Οι μηχανισμοί, όχι οι φήμες",
    "descEn": "A systems view of corruption risks: incentives, weak controls, and how transparency helps.",
    "descGr": "Συστημική ματιά σε ρίσκα διαφθοράς: κίνητρα, αδύναμοι έλεγχοι και πώς βοηθά η διαφάνεια.",
    "date": "2026-01-26",
    "section": "Corruption Of Greece",
    "tags": [
      "Corruption Of Greece",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "public-procurement-transparency-what-citizens-can-check.html",
    "href": "../Blog/public-procurement-transparency-what-citizens-can-check.html",
    "titleEn": "Public Procurement Transparency: What Citizens Can Check",
    "titleGr": "Διαφάνεια στις δημόσιες συμβάσεις: Τι μπορεί να ελέγξει ο πολίτης",
    "descEn": "Where procurement data lives, how to read it, and red flags worth noting.",
    "descGr": "Πού υπάρχουν τα δεδομένα συμβάσεων, πώς τα διαβάζεις και ποια red flags αξίζει να προσέξεις.",
    "date": "2026-01-26",
    "section": "Corruption Of Greece",
    "tags": [
      "Corruption Of Greece",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "whistleblowing-in-greece-and-the-eu-rights-and-realistic-steps.html",
    "href": "../Blog/whistleblowing-in-greece-and-the-eu-rights-and-realistic-steps.html",
    "titleEn": "Whistleblowing in Greece & the EU: Rights and Realistic Steps",
    "titleGr": "Whistleblowing στην Ελλάδα & την ΕΕ: Δικαιώματα και ρεαλιστικά βήματα",
    "descEn": "A non-legal guide to protections, safe reporting channels, and risk management.",
    "descGr": "Μη νομικός οδηγός για προστασίες, ασφαλή κανάλια αναφοράς και διαχείριση ρίσκου.",
    "date": "2026-01-26",
    "section": "Corruption Of Greece",
    "tags": [
      "Corruption Of Greece",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "open-data-and-diavgeia-turning-documents-into-accountability.html",
    "href": "../Blog/open-data-and-diavgeia-turning-documents-into-accountability.html",
    "titleEn": "Open Data and ‘Diavgeia’: Turning Documents into Accountability",
    "titleGr": "Ανοικτά δεδομένα και «Διαύγεια»: Από τα έγγραφα στη λογοδοσία",
    "descEn": "How open data portals help journalists and citizens follow decisions and spending.",
    "descGr": "Πώς οι πύλες ανοικτών δεδομένων βοηθούν δημοσιογράφους και πολίτες να παρακολουθούν αποφάσεις και δαπάνες.",
    "date": "2026-01-26",
    "section": "Corruption Of Greece",
    "tags": [
      "Corruption Of Greece",
      "Guide",
      "Checklist",
      "How-to"
    ]
  },
  {
    "file": "integrity-tools-audits-conflict-of-interest-and-simple-controls.html",
    "href": "../Blog/integrity-tools-audits-conflict-of-interest-and-simple-controls.html",
    "titleEn": "Integrity Tools: Audits, Conflict-of-Interest, and Simple Controls",
    "titleGr": "Εργαλεία ακεραιότητας: Έλεγχοι, σύγκρουση συμφερόντων και απλοί κανόνες",
    "descEn": "Practical controls that reduce corruption risk in organizations and municipalities.",
    "descGr": "Πρακτικοί έλεγχοι που μειώνουν ρίσκο διαφθοράς σε οργανισμούς και δήμους.",
    "date": "2026-01-26",
    "section": "Corruption Of Greece",
    "tags": [
      "Corruption Of Greece",
      "Guide",
      "Checklist",
      "How-to"
    ]
  }
];
function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fileNameToTitle(name) {
    return String(name || '')
      .replace(/\.html?$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function getCurrentLang() {
    return (localStorage.getItem('language') || 'en').toLowerCase();
  }

  async function loadConfig() {
    try {
      const res = await fetch('../site-config.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('config fetch failed');
      const cfg = await res.json();
      return { ...DEFAULT_CFG, ...cfg, github: { ...DEFAULT_CFG.github, ...(cfg.github || {}) } };
    } catch (_) {
      return DEFAULT_CFG;
    }
  }

  function detectGitHubRepoFromLocation() {
    // If the site is hosted on *.github.io, derive owner/repo from the URL so copied repos work automatically.
    const host = String(location.hostname || '').toLowerCase();
    if (!host.endsWith('github.io')) return null;

    const owner = host.split('.')[0];
    const parts = String(location.pathname || '').split('/').filter(Boolean);

    // User/organization site: https://owner.github.io/       => repo is owner.github.io
    // Project site:          https://owner.github.io/repo/  => repo is the first path segment
    const repo = parts.length ? parts[0] : `${owner}.github.io`;
    return { owner, repo };
  }

  async function fetchRepoDirectory({ owner, repo, branch, blogDir }) {
    const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(blogDir)}`;
    const withRef = branch ? `${base}?ref=${encodeURIComponent(branch)}` : base;

    let res = await fetch(withRef, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    });

    // If the branch name is wrong (common when copying the site to a new repo),
    // retry without specifying a ref so GitHub uses the repo’s default branch.
    if (!res.ok && branch) {
      res = await fetch(base, {
        headers: { Accept: 'application/vnd.github+json' },
        cache: 'no-store'
      });
    }

    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter((x) => x && x.type === 'file' && /\.html?$/i.test(x.name));
  }

  function parseMetaRefreshRedirect(doc) {
    const m = doc.querySelector('meta[http-equiv="refresh" i]');
    if (!m) return null;
    const content = String(m.getAttribute('content') || '');
    // formats: "0; url=target.html" or "0;url=target.html"
    const match = content.match(/url\s*=\s*([^;]+)\s*$/i);
    if (!match) return null;
    const url = String(match[1] || '').trim().replace(/^['"]|['"]$/g, '');
    return url || null;
  }

  async function fetchPostMeta(entry) {
    let titleEn = fileNameToTitle(entry.name);
    let titleGr = titleEn;
    let descEn = '';
    let descGr = '';
    let date = '';
    let section = '';
    let tags = [];
    let isRedirect = false;
    let redirectTo = '';

    try {
      const htmlText = await (await fetch(entry.download_url, { cache: 'no-store' })).text();
      const doc = new DOMParser().parseFromString(htmlText, 'text/html');

      // Detect "Moved" stub pages (meta refresh) and remove them from the listing later.
      const redir = parseMetaRefreshRedirect(doc);
      if (redir) {
        isRedirect = true;
        redirectTo = redir;
      }

      const h1 = doc.querySelector('.page-header h1');
      const p = doc.querySelector('.page-header p');

      const metaDesc = doc.querySelector('meta[name="description"]');
      const published = doc.querySelector('meta[property="article:published_time"]');
      const sectionMeta = doc.querySelector('meta[property="article:section"]');
      const tagMetas = Array.from(doc.querySelectorAll('meta[property="article:tag"]'));

      if (h1) {
        titleEn = (h1.getAttribute('data-en') || h1.textContent || titleEn).trim();
        titleGr = (h1.getAttribute('data-gr') || titleGr).trim();
      }
      if (p) {
        descEn = (p.getAttribute('data-en') || p.textContent || '').trim();
        descGr = (p.getAttribute('data-gr') || descGr).trim();
      } else if (metaDesc) {
        descEn = (metaDesc.getAttribute('content') || '').trim();
        descGr = descEn;
      }

      if (published) date = (published.getAttribute('content') || '').trim();
      if (sectionMeta) section = String(sectionMeta.getAttribute('content') || '').trim();
      if (tagMetas && tagMetas.length) {
        tags = tagMetas
          .map(m => String(m.getAttribute('content') || '').trim())
          .filter(Boolean);
      }
    } catch (_) {
      // keep fallbacks
    }

    return {
      file: entry.name,
      href: `../Blog/${entry.name}`,
      titleEn,
      titleGr,
      descEn,
      descGr,
      date,
      section,
      tags,
      isRedirect,
      redirectTo
    };
  }

  function renderPosts(grid, posts) {
    if (!posts.length) {
      grid.innerHTML = `
        <div class="feature-card" style="grid-column: 1 / -1;">
          <h3 class="feature-title" data-en="No posts found" data-gr="Δεν βρέθηκαν άρθρα">No posts found</h3>
          <p data-en="Upload an HTML file into the /Blog folder and it will appear here automatically." data-gr="Ανέβασε ένα HTML αρχείο στον φάκελο /Blog και θα εμφανιστεί εδώ αυτόματα.">
            Upload an HTML file into the /Blog folder and it will appear here automatically.
          </p>
        </div>`;
      return;
    }

    const cards = posts.map((p) => {
      const titleEn = escapeHtml(p.titleEn);
      const titleGr = escapeHtml(p.titleGr || p.titleEn);
      const descEn = escapeHtml(p.descEn || '');
      const descGr = escapeHtml(p.descGr || p.descEn || '');

      const taxonomy = (() => {
        const out = [];
        if (p.section) out.push(`<span class="badge">${escapeHtml(p.section)}</span>`);
        if (Array.isArray(p.tags)) {
          p.tags.slice(0, 3).forEach(t => out.push(`<span class="badge">#${escapeHtml(t)}</span>`));
        }
        return out.length
          ? `<div class="blog-taxonomy">${out.join('')}</div>`
          : '';
      })();

      const badge = p.date
        ? `<span class="badge" data-en="Updated ${escapeHtml(p.date)}" data-gr="Ενημέρωση ${escapeHtml(p.date)}">Updated ${escapeHtml(p.date)}</span>`
        : '';

      return `
        <a class="feature-card" href="${escapeHtml(p.href)}">
          <div class="feature-icon"><i class="fas fa-book-open"></i></div>
          <h3 class="feature-title" data-en="${titleEn}" data-gr="${titleGr}">${titleEn}</h3>
          <p data-en="${descEn}" data-gr="${descGr}">${descEn}</p>
          ${taxonomy}
          ${badge}
        </a>`;
    });

    grid.innerHTML = cards.join('');
  }

  function setupFilters(posts, grid) {
    const catWrap = document.getElementById('category-chips');
    const tagWrap = document.getElementById('tag-chips');
    const filtersBox = document.getElementById('blog-filters');
    if (!catWrap || !tagWrap) return;

    const allCats = Array.from(new Set(posts.map(p => (p.section || '').trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b));
    const allTags = Array.from(new Set(posts.flatMap(p => Array.isArray(p.tags) ? p.tags : []).map(t => String(t).trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b));

    // Hide the whole filter UI if there is nothing to filter by
    if ((!allCats.length) && (!allTags.length)) {
      if (filtersBox) filtersBox.style.display = 'none';
      return;
    }

    const params = new URLSearchParams(location.search || '');
    let selectedCat = params.get('cat') || 'All';
    let selectedTag = params.get('tag') || 'All';

    function mkChip(labelEn, labelGr, value, selected, onPick) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (selected === value ? ' is-active' : '');
      b.setAttribute('data-en', labelEn);
      b.setAttribute('data-gr', labelGr);
      b.textContent = labelEn;
      b.addEventListener('click', () => onPick(value));
      return b;
    }

    function renderChips(wrap, items, selected, onPick) {
      wrap.innerHTML = '';
      wrap.appendChild(mkChip('All', 'Όλα', 'All', selected, onPick));
      items.forEach(v => {
        // Categories/tags are stored in English (SEO). Keep label the same in both languages.
        const label = String(v);
        wrap.appendChild(mkChip(label, label, v, selected, onPick));
      });
      wrap.parentElement?.classList.toggle('is-empty', items.length === 0);
    }

    function apply() {
      const filtered = posts.filter(p => {
        const okCat = (selectedCat === 'All') || (String(p.section || '') === selectedCat);
        const okTag = (selectedTag === 'All') || (Array.isArray(p.tags) && p.tags.includes(selectedTag));
        return okCat && okTag;
      });

      // keep query params in sync (clean URLs)
      const next = new URLSearchParams(location.search || '');
      if (selectedCat === 'All') next.delete('cat'); else next.set('cat', selectedCat);
      if (selectedTag === 'All') next.delete('tag'); else next.set('tag', selectedTag);
      const nextStr = next.toString();
      const nextUrl = nextStr ? `${location.pathname}?${nextStr}` : location.pathname;
      history.replaceState(null, '', nextUrl);

      renderChips(catWrap, allCats, selectedCat, (v) => { selectedCat = v; apply(); });
      renderChips(tagWrap, allTags, selectedTag, (v) => { selectedTag = v; apply(); });

      renderPosts(grid, filtered);

      // Re-apply language on dynamically injected nodes
      if (typeof window.changeLanguage === 'function') {
        window.changeLanguage(getCurrentLang());
      }
    }

    apply();
  }

  function normalizePosts(posts) {
    // Remove redirect "Moved" stub pages from the listing.
    const out = (Array.isArray(posts) ? posts : []).filter(p => !p?.isRedirect);
    // Also remove duplicates by file/href
    const seen = new Set();
    return out.filter(p => {
      const key = String(p.href || p.file || '');
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async function main() {
    const grid = document.getElementById(GRID_ID);
    if (!grid) return;

    const cfg = await loadConfig();

    // If this is a GitHub Pages URL (owner.github.io[/repo]/...), auto-detect the repo so the blog works in any copied/testing repository.
    const detected = detectGitHubRepoFromLocation();
    if (detected) {
      cfg.github = { ...cfg.github, ...detected, branch: '' };
    }

    let posts = [];
    try {
      const entries = await fetchRepoDirectory(cfg.github);
      const metas = await Promise.all(entries.map(fetchPostMeta));

      metas.sort((a, b) => {
        const d = (b.date || '').localeCompare(a.date || '');
        if (d) return d;
        return (a.titleEn || '').localeCompare(b.titleEn || '');
      });

      posts = metas;
    } catch (_) {
      // ignore and fall back to embedded list
    }

    // If GitHub API failed (offline / rate limit), use embedded posts from the ZIP build.
    if (!posts.length && Array.isArray(EMBEDDED_POSTS) && EMBEDDED_POSTS.length) {
      posts = EMBEDDED_POSTS.slice();
    }

    posts = normalizePosts(posts);

    if (!posts.length) {
      grid.innerHTML = `
        <div class="feature-card" style="grid-column: 1 / -1;">
          <h3 class="feature-title" data-en="Couldn’t load posts" data-gr="Αδυναμία φόρτωσης άρθρων">Couldn’t load posts</h3>
          <p data-en="Posts exist, but the list couldn’t be generated. If you’re viewing locally, open the site with a local server (not file://). On GitHub Pages, try refreshing." data-gr="Τα άρθρα υπάρχουν, αλλά η λίστα δεν μπόρεσε να δημιουργηθεί. Αν το βλέπεις τοπικά, άνοιξε το site με local server (όχι file://). Στο GitHub Pages δοκίμασε ανανέωση.">
            Posts exist, but the list couldn’t be generated. If you’re viewing locally, open the site with a local server (not file://). On GitHub Pages, try refreshing.
          </p>
        </div>`;
      return;
    }

    renderPosts(grid, posts);
    try { setupFilters(posts, grid); } catch (_) {}

    // Apply the saved language after rendering
    if (typeof window.changeLanguage === 'function') {
      window.changeLanguage(getCurrentLang());
    }
  }

  document.addEventListener('DOMContentLoaded', main);
})();
