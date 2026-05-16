#!/usr/bin/env node
// One-shot builder that creates scripts/brand-configs/<brand>.json for 22 brands.
// URL patterns derived from each brand's standard US consumer site structure as of 2026-05-13.
// Per PROJECT_STATE.md history, some brands' consumer sites are gated; notes document those gates.

import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_BLACKLIST = "(?:Promo-Banner|Global-Nav|nav[/_-]?jelly|favicon|sprite|icon|logo|placeholder|preview-thumb)";
const OUT_DIR = path.join(process.cwd(), "scripts", "brand-configs");

const configs = {
  acura: {
    notes: "Per PROJECT_STATE.md lesson #26: acura.com was gated to WebFetch during Phase 4 attempts; acuranews.com is a fallback option but also returned 403 during Phase 1 image-collection. Consumer-site URLs included here for completeness; expect possible 403s during scrape. Acura shares some CDN infrastructure with Honda.",
    model_pages: {
      "integra":         "https://www.acura.com/integra",
      "integra-type-s":  "https://www.acura.com/integra-type-s",
      "adx":             "https://www.acura.com/adx",
      "rdx":             "https://www.acura.com/rdx",
      "mdx":             "https://www.acura.com/mdx",
      "mdx-type-s":      "https://www.acura.com/mdx"
    },
    slug_variants: {
      "integra":        ["integra", "integra-sedan"],
      "integra-type-s": ["integra-type-s", "integra_type_s", "type-s", "integra-types"],
      "mdx-type-s":     ["mdx-type-s", "mdx_type_s", "mdx-types"]
    }
  },

  "aston-martin": {
    notes: "Per PROJECT_STATE.md: astonmartin.com/en-us consumer site is accessible to WebFetch; press.astonmartin.com returned ECONNREFUSED during Phase 1. Consumer-site URLs used here.",
    model_pages: {
      "vantage":          "https://www.astonmartin.com/en-us/models/vantage",
      "vantage-s":        "https://www.astonmartin.com/en-us/models/vantage-s",
      "vantage-roadster": "https://www.astonmartin.com/en-us/models/vantage-roadster",
      "db12":             "https://www.astonmartin.com/en-us/models/db12",
      "db12-s":           "https://www.astonmartin.com/en-us/models/db12-s",
      "db12-volante":     "https://www.astonmartin.com/en-us/models/db12-volante",
      "vanquish":         "https://www.astonmartin.com/en-us/models/vanquish",
      "vanquish-volante": "https://www.astonmartin.com/en-us/models/vanquish-volante",
      "dbx707":           "https://www.astonmartin.com/en-us/models/dbx707",
      "dbx-s":            "https://www.astonmartin.com/en-us/models/dbx-s",
      "valhalla":         "https://www.astonmartin.com/en-us/models/valhalla"
    },
    slug_variants: {
      "db12":             ["db12", "db-12"],
      "db12-s":           ["db12-s", "db-12-s", "db12s"],
      "db12-volante":     ["db12-volante", "db-12-volante"],
      "dbx707":           ["dbx707", "dbx-707", "dbx_707"],
      "dbx-s":            ["dbx-s", "dbxs", "dbx_s"]
    }
  },

  audi: {
    notes: "Per PROJECT_STATE.md lessons #26 and STATUS.md row: audiusa.com returned 403 to WebFetch on all model pages during Phase 1 image-collection. media.audiusa.com mostly returns logo/nav-only content. Consumer-site URLs included here; expect 403s. media.audiusa.com is the documented alternative if the consumer site continues to block.",
    model_pages: {
      "a3":                 "https://www.audiusa.com/us/web/en/models/a3/a3/2026/overview.html",
      "s3":                 "https://www.audiusa.com/us/web/en/models/a3/s3/2026/overview.html",
      "rs-3":               "https://www.audiusa.com/us/web/en/models/a3/rs-3/2026/overview.html",
      "a5":                 "https://www.audiusa.com/us/web/en/models/a5/a5-sedan/2026/overview.html",
      "s5":                 "https://www.audiusa.com/us/web/en/models/a5/s5-sedan/2026/overview.html",
      "a6-sedan":           "https://www.audiusa.com/us/web/en/models/a6/a6-sedan/2026/overview.html",
      "a6-allroad":         "https://www.audiusa.com/us/web/en/models/a6/a6-allroad/2026/overview.html",
      "a8":                 "https://www.audiusa.com/us/web/en/models/a8/a8/2026/overview.html",
      "s8":                 "https://www.audiusa.com/us/web/en/models/a8/s8/2026/overview.html",
      "rs-6-avant":         "https://www.audiusa.com/us/web/en/models/a6/rs-6-avant/2026/overview.html",
      "rs-7":               "https://www.audiusa.com/us/web/en/models/a7/rs-7/2026/overview.html",
      "q3":                 "https://www.audiusa.com/us/web/en/models/q3/q3/2026/overview.html",
      "q4-e-tron":          "https://www.audiusa.com/us/web/en/models/q4-e-tron/q4-e-tron/2026/overview.html",
      "q4-sportback-e-tron":"https://www.audiusa.com/us/web/en/models/q4-e-tron/q4-sportback-e-tron/2026/overview.html",
      "q5":                 "https://www.audiusa.com/us/web/en/models/q5/q5/2026/overview.html",
      "q5-sportback":       "https://www.audiusa.com/us/web/en/models/q5/q5-sportback/2026/overview.html",
      "sq5":                "https://www.audiusa.com/us/web/en/models/q5/sq5/2026/overview.html",
      "sq5-sportback":      "https://www.audiusa.com/us/web/en/models/q5/sq5-sportback/2026/overview.html",
      "q7":                 "https://www.audiusa.com/us/web/en/models/q7/q7/2026/overview.html",
      "sq7":                "https://www.audiusa.com/us/web/en/models/q7/sq7/2026/overview.html",
      "q8":                 "https://www.audiusa.com/us/web/en/models/q8/q8/2026/overview.html",
      "sq8":                "https://www.audiusa.com/us/web/en/models/q8/sq8/2026/overview.html",
      "rs-q8":              "https://www.audiusa.com/us/web/en/models/q8/rs-q8/2026/overview.html",
      "s-e-tron-gt":        "https://www.audiusa.com/us/web/en/models/e-tron-gt/s-e-tron-gt/2026/overview.html",
      "rs-e-tron-gt":       "https://www.audiusa.com/us/web/en/models/e-tron-gt/rs-e-tron-gt/2026/overview.html"
    },
    slug_variants: {
      "rs-3":         ["rs-3", "rs3"],
      "rs-6-avant":   ["rs-6-avant", "rs6-avant", "rs6"],
      "rs-7":         ["rs-7", "rs7"],
      "rs-q8":        ["rs-q8", "rsq8"],
      "s-e-tron-gt":  ["s-e-tron-gt", "se-tron-gt", "s_e_tron_gt"],
      "rs-e-tron-gt": ["rs-e-tron-gt", "rse-tron-gt", "rs_e_tron_gt"]
    }
  },

  cadillac: {
    notes: "cadillac.com consumer site is the primary source. Cadillac uses /<model> path tokens for most models. Some EV models use /<model>-ev or distinct paths.",
    model_pages: {
      "ct4":             "https://www.cadillac.com/sedans/ct4",
      "ct4-v":           "https://www.cadillac.com/sedans/ct4-v-series",
      "ct4-v-blackwing": "https://www.cadillac.com/sedans/ct4-v-blackwing",
      "ct5":             "https://www.cadillac.com/sedans/ct5",
      "ct5-v":           "https://www.cadillac.com/sedans/ct5-v-series",
      "ct5-v-blackwing": "https://www.cadillac.com/sedans/ct5-v-blackwing",
      "xt5":             "https://www.cadillac.com/suvs/xt5",
      "lyriq":           "https://www.cadillac.com/electric/lyriq",
      "lyriq-v":         "https://www.cadillac.com/electric/lyriq-v",
      "optiq":           "https://www.cadillac.com/electric/optiq",
      "optiq-v":         "https://www.cadillac.com/electric/optiq-v",
      "vistiq":          "https://www.cadillac.com/electric/vistiq",
      "escalade-iq":     "https://www.cadillac.com/electric/escalade-iq",
      "escalade-iql":    "https://www.cadillac.com/electric/escalade-iql",
      "escalade":        "https://www.cadillac.com/suvs/escalade",
      "escalade-esv":    "https://www.cadillac.com/suvs/escalade-esv",
      "escalade-v":      "https://www.cadillac.com/suvs/escalade-v-series",
      "celestiq":        "https://www.cadillac.com/electric/celestiq"
    },
    slug_variants: {
      "ct4-v":           ["ct4-v", "ct4v", "ct4_v"],
      "ct4-v-blackwing": ["ct4-v-blackwing", "ct4v-blackwing", "ct4-blackwing"],
      "ct5-v":           ["ct5-v", "ct5v", "ct5_v"],
      "ct5-v-blackwing": ["ct5-v-blackwing", "ct5v-blackwing", "ct5-blackwing"],
      "escalade-v":      ["escalade-v", "escaladev", "escalade-v-series"],
      "lyriq-v":         ["lyriq-v", "lyriqv"],
      "optiq-v":         ["optiq-v", "optiqv"],
      "escalade-iq":     ["escalade-iq", "escaladeiq"],
      "escalade-iql":    ["escalade-iql", "escaladeiql", "escalade-iq-l"]
    }
  },

  chevrolet: {
    notes: "chevrolet.com consumer site. Performance variants (corvette-zr1, corvette-z06) often share base configurator with toggles, but each has its own /<model> page.",
    model_pages: {
      "trax":            "https://www.chevrolet.com/suvs/trax",
      "trailblazer":     "https://www.chevrolet.com/suvs/trailblazer",
      "equinox":         "https://www.chevrolet.com/suvs/equinox",
      "equinox-ev":      "https://www.chevrolet.com/electric/equinox-ev",
      "blazer":          "https://www.chevrolet.com/suvs/blazer",
      "blazer-ev":       "https://www.chevrolet.com/electric/blazer-ev",
      "traverse":        "https://www.chevrolet.com/suvs/traverse",
      "tahoe":           "https://www.chevrolet.com/suvs/tahoe",
      "suburban":        "https://www.chevrolet.com/suvs/suburban",
      "colorado":        "https://www.chevrolet.com/trucks/colorado",
      "silverado-1500":  "https://www.chevrolet.com/trucks/silverado-1500",
      "silverado-hd":    "https://www.chevrolet.com/trucks/silverado-hd",
      "silverado-ev":    "https://www.chevrolet.com/electric/silverado-ev",
      "corvette-stingray": "https://www.chevrolet.com/performance/corvette/stingray",
      "corvette-e-ray":   "https://www.chevrolet.com/performance/corvette/e-ray",
      "corvette-z06":     "https://www.chevrolet.com/performance/corvette/z06",
      "corvette-zr1":     "https://www.chevrolet.com/performance/corvette/zr1",
      "corvette-zr1x":    "https://www.chevrolet.com/performance/corvette/zr1x"
    },
    slug_variants: {
      "silverado-1500":   ["silverado-1500", "silverado1500", "silverado"],
      "silverado-hd":     ["silverado-hd", "silveradohd", "silverado-2500", "silverado-3500", "silverado-2500hd", "silverado-3500hd"],
      "corvette-stingray":["corvette", "corvette-stingray", "stingray"],
      "corvette-e-ray":   ["corvette-e-ray", "e-ray", "corvette-eray"],
      "corvette-z06":     ["corvette-z06", "z06"],
      "corvette-zr1":     ["corvette-zr1", "zr1"],
      "corvette-zr1x":    ["corvette-zr1x", "zr1x"]
    }
  },

  ferrari: {
    notes: "Per PROJECT_STATE.md lesson #29 and STATUS.md row: ferrari.com/en-US is JS-rendered (blank to WebFetch). ferrari.com/en-EN model pages were the reliable Phase 1 source. Using en-EN URLs here. press.ferrari.com redirects to ferrari.com/media-centre which is also JS-rendered. Expect low scrape coverage; placeholder fallback in catalog is acceptable.",
    model_pages: {
      "roma-spider":          "https://www.ferrari.com/en-EN/auto/roma-spider",
      "amalfi":               "https://www.ferrari.com/en-EN/auto/amalfi",
      "296-gtb":              "https://www.ferrari.com/en-EN/auto/296-gtb",
      "296-gts":              "https://www.ferrari.com/en-EN/auto/296-gts",
      "296-speciale":         "https://www.ferrari.com/en-EN/auto/296-speciale",
      "296-speciale-a":       "https://www.ferrari.com/en-EN/auto/296-speciale-a",
      "12cilindri":           "https://www.ferrari.com/en-EN/auto/12cilindri",
      "12cilindri-spider":    "https://www.ferrari.com/en-EN/auto/12cilindri-spider",
      "849-testarossa":       "https://www.ferrari.com/en-EN/auto/849-testarossa",
      "849-testarossa-spider":"https://www.ferrari.com/en-EN/auto/849-testarossa-spider",
      "purosangue":           "https://www.ferrari.com/en-EN/auto/purosangue",
      "f80":                  "https://www.ferrari.com/en-EN/auto/f80"
    },
    slug_variants: {
      "296-gtb":             ["296-gtb", "296gtb"],
      "296-gts":             ["296-gts", "296gts"],
      "296-speciale":        ["296-speciale", "296speciale"],
      "296-speciale-a":      ["296-speciale-a", "296specialea", "speciale-a"],
      "12cilindri":          ["12cilindri", "12-cilindri", "twelve-cilindri"],
      "12cilindri-spider":   ["12cilindri-spider", "12-cilindri-spider"],
      "849-testarossa":      ["849-testarossa", "849testarossa", "testarossa"],
      "849-testarossa-spider":["849-testarossa-spider", "849testarossa-spider"]
    }
  },

  ford: {
    notes: "ford.com consumer site. Mustang variants (Dark Horse, GTD, Mach-E Rally) share the /mustang/ tree with sub-pages. F-150 specialty variants (Raptor, Raptor R) live under /trucks/f150/. Super Duty variants (F-250/350/450) live under /super-duty/.",
    model_pages: {
      "mustang":              "https://www.ford.com/cars/mustang",
      "mustang-dark-horse":   "https://www.ford.com/cars/mustang/models/mustang-dark-horse",
      "mustang-dark-horse-sc":"https://www.ford.com/cars/mustang/models/mustang-dark-horse",
      "mustang-gtd":          "https://www.ford.com/cars/mustang/mustang-gtd",
      "mustang-mach-e":       "https://www.ford.com/suvs/mach-e",
      "mustang-mach-e-rally": "https://www.ford.com/suvs/mach-e/models/mach-e-rally",
      "bronco-sport":         "https://www.ford.com/suvs/bronco-sport",
      "bronco":               "https://www.ford.com/suvs/bronco",
      "bronco-raptor":        "https://www.ford.com/suvs/bronco/models/bronco-raptor",
      "escape":               "https://www.ford.com/suvs/escape",
      "explorer":             "https://www.ford.com/suvs/explorer",
      "expedition":           "https://www.ford.com/suvs/expedition",
      "maverick":             "https://www.ford.com/trucks/maverick",
      "ranger":               "https://www.ford.com/trucks/ranger",
      "ranger-raptor":        "https://www.ford.com/trucks/ranger/models/ranger-raptor",
      "f-150":                "https://www.ford.com/trucks/f150",
      "f-150-raptor":         "https://www.ford.com/trucks/f150/models/f150-raptor",
      "f-150-raptor-r":       "https://www.ford.com/trucks/f150/models/f150-raptor-r",
      "f-150-lightning":      "https://www.ford.com/trucks/f150-lightning",
      "f-250-super-duty":     "https://www.ford.com/trucks/super-duty/models/f-250",
      "f-350-super-duty":     "https://www.ford.com/trucks/super-duty/models/f-350",
      "f-450-super-duty":     "https://www.ford.com/trucks/super-duty/models/f-450"
    },
    slug_variants: {
      "mustang-dark-horse":    ["mustang-dark-horse", "dark-horse", "darkhorse"],
      "mustang-dark-horse-sc": ["mustang-dark-horse-sc", "dark-horse-sc", "darkhorse-sc"],
      "mustang-gtd":           ["mustang-gtd", "gtd"],
      "mustang-mach-e":        ["mustang-mach-e", "mach-e", "mache"],
      "mustang-mach-e-rally":  ["mustang-mach-e-rally", "mach-e-rally", "mache-rally"],
      "bronco-raptor":         ["bronco-raptor", "broncoraptor"],
      "ranger-raptor":         ["ranger-raptor", "rangerraptor"],
      "f-150":                 ["f-150", "f150"],
      "f-150-raptor":          ["f-150-raptor", "f150-raptor", "f150raptor"],
      "f-150-raptor-r":        ["f-150-raptor-r", "f150-raptor-r", "raptorr"],
      "f-150-lightning":       ["f-150-lightning", "f150-lightning", "lightning"],
      "f-250-super-duty":      ["f-250-super-duty", "f250", "f-250", "f250-super-duty"],
      "f-350-super-duty":      ["f-350-super-duty", "f350", "f-350", "f350-super-duty"],
      "f-450-super-duty":      ["f-450-super-duty", "f450", "f-450", "f450-super-duty"]
    }
  },

  genesis: {
    notes: "genesis.com/us/en/vehicles/<model> consumer site. Electrified GV70 shares some assets with GV70; configured here as its own model_pages entry.",
    model_pages: {
      "g70":             "https://www.genesis.com/us/en/vehicles/g70.html",
      "g80":             "https://www.genesis.com/us/en/vehicles/g80.html",
      "g90":             "https://www.genesis.com/us/en/vehicles/g90.html",
      "gv60":            "https://www.genesis.com/us/en/vehicles/gv60.html",
      "gv70":            "https://www.genesis.com/us/en/vehicles/gv70.html",
      "electrified-gv70":"https://www.genesis.com/us/en/vehicles/electrified-gv70.html",
      "gv80":            "https://www.genesis.com/us/en/vehicles/gv80.html",
      "gv80-coupe":      "https://www.genesis.com/us/en/vehicles/gv80-coupe.html"
    },
    slug_variants: {
      "electrified-gv70": ["electrified-gv70", "electrifiedgv70", "gv70-electrified"],
      "gv80-coupe":       ["gv80-coupe", "gv80coupe"]
    }
  },

  hyundai: {
    notes: "hyundaiusa.com/us/en/vehicles/<model> consumer site. EV performance variants (Ioniq 5 N, Ioniq 6 N) have separate pages. Nexo is fuel cell — limited California-only availability.",
    model_pages: {
      "venue":      "https://www.hyundaiusa.com/us/en/vehicles/venue",
      "elantra":    "https://www.hyundaiusa.com/us/en/vehicles/elantra",
      "elantra-n":  "https://www.hyundaiusa.com/us/en/vehicles/elantra-n",
      "sonata":     "https://www.hyundaiusa.com/us/en/vehicles/sonata",
      "kona":       "https://www.hyundaiusa.com/us/en/vehicles/kona",
      "tucson":     "https://www.hyundaiusa.com/us/en/vehicles/tucson",
      "santa-cruz": "https://www.hyundaiusa.com/us/en/vehicles/santa-cruz",
      "santa-fe":   "https://www.hyundaiusa.com/us/en/vehicles/santa-fe",
      "palisade":   "https://www.hyundaiusa.com/us/en/vehicles/palisade",
      "ioniq-5":    "https://www.hyundaiusa.com/us/en/vehicles/ioniq-5",
      "ioniq-5-n":  "https://www.hyundaiusa.com/us/en/vehicles/ioniq-5-n",
      "ioniq-6-n":  "https://www.hyundaiusa.com/us/en/vehicles/ioniq-6-n",
      "ioniq-9":    "https://www.hyundaiusa.com/us/en/vehicles/ioniq-9",
      "nexo":       "https://www.hyundaiusa.com/us/en/vehicles/nexo"
    },
    slug_variants: {
      "elantra-n":  ["elantra-n", "elantran"],
      "santa-cruz": ["santa-cruz", "santacruz", "santa_cruz"],
      "santa-fe":   ["santa-fe", "santafe", "santa_fe"],
      "ioniq-5":    ["ioniq-5", "ioniq5"],
      "ioniq-5-n":  ["ioniq-5-n", "ioniq5n", "ioniq-5n"],
      "ioniq-6-n":  ["ioniq-6-n", "ioniq6n", "ioniq-6n"],
      "ioniq-9":    ["ioniq-9", "ioniq9"]
    }
  },

  kia: {
    notes: "kia.com/us/en/<model> consumer site. Hybrid and PHEV variants of mainstream models live on the parent model's page (e.g., sportage-hybrid points to /sportage-hybrid).",
    model_pages: {
      "k4":                       "https://www.kia.com/us/en/k4",
      "k4-hatchback":             "https://www.kia.com/us/en/k4-hatchback",
      "k5":                       "https://www.kia.com/us/en/k5",
      "seltos":                   "https://www.kia.com/us/en/seltos",
      "sportage":                 "https://www.kia.com/us/en/sportage",
      "sportage-hybrid":          "https://www.kia.com/us/en/sportage-hybrid",
      "sportage-plug-in-hybrid":  "https://www.kia.com/us/en/sportage-plug-in-hybrid",
      "sorento":                  "https://www.kia.com/us/en/sorento",
      "sorento-hybrid":           "https://www.kia.com/us/en/sorento-hybrid",
      "sorento-plug-in-hybrid":   "https://www.kia.com/us/en/sorento-plug-in-hybrid",
      "carnival":                 "https://www.kia.com/us/en/carnival",
      "carnival-hybrid":          "https://www.kia.com/us/en/carnival-hybrid",
      "niro-hybrid":              "https://www.kia.com/us/en/niro",
      "niro-ev":                  "https://www.kia.com/us/en/niro-ev",
      "ev6":                      "https://www.kia.com/us/en/ev6",
      "ev9":                      "https://www.kia.com/us/en/ev9"
    },
    slug_variants: {
      "k4-hatchback":            ["k4-hatchback", "k4hatchback", "k4_hatchback"],
      "sportage-hybrid":         ["sportage-hybrid", "sportagehybrid"],
      "sportage-plug-in-hybrid": ["sportage-plug-in-hybrid", "sportage-phev", "sportage-plugin"],
      "sorento-hybrid":          ["sorento-hybrid", "sorentohybrid"],
      "sorento-plug-in-hybrid":  ["sorento-plug-in-hybrid", "sorento-phev", "sorento-plugin"],
      "carnival-hybrid":         ["carnival-hybrid", "carnivalhybrid"],
      "niro-hybrid":             ["niro-hybrid", "nirohybrid", "niro"],
      "niro-ev":                 ["niro-ev", "niroev"]
    }
  },

  lamborghini: {
    notes: "lamborghini.com/en-us consumer site. May be JS-rendered; press.lamborghini.com is a documented alternative if consumer site is gated. Lineup is small (3 models).",
    model_pages: {
      "revuelto":  "https://www.lamborghini.com/en-us/models/revuelto",
      "temerario": "https://www.lamborghini.com/en-us/models/temerario",
      "urus-se":   "https://www.lamborghini.com/en-us/models/urus/urus-se"
    },
    slug_variants: {
      "urus-se": ["urus-se", "uruss", "urus_se"]
    }
  },

  "land-rover": {
    notes: "landroverusa.com/<lineup>/<model> consumer site. Defender variants (90/110/130/Octa) share base /defender/ tree with sub-pages. Range Rover Sport SV is the high-performance variant of Range Rover Sport.",
    model_pages: {
      "defender-90":           "https://www.landroverusa.com/defender/defender-90.html",
      "defender-110":          "https://www.landroverusa.com/defender/defender-110.html",
      "defender-130":          "https://www.landroverusa.com/defender/defender-130.html",
      "defender-octa":         "https://www.landroverusa.com/defender/defender-octa.html",
      "discovery":             "https://www.landroverusa.com/discovery/index.html",
      "discovery-sport":       "https://www.landroverusa.com/discovery-sport/index.html",
      "range-rover":           "https://www.landroverusa.com/range-rover/index.html",
      "range-rover-sport":     "https://www.landroverusa.com/range-rover-sport/index.html",
      "range-rover-sport-sv":  "https://www.landroverusa.com/range-rover-sport/range-rover-sport-sv.html",
      "range-rover-velar":     "https://www.landroverusa.com/range-rover-velar/index.html",
      "range-rover-evoque":    "https://www.landroverusa.com/range-rover-evoque/index.html"
    },
    slug_variants: {
      "defender-90":          ["defender-90", "defender90"],
      "defender-110":         ["defender-110", "defender110"],
      "defender-130":         ["defender-130", "defender130"],
      "defender-octa":        ["defender-octa", "defenderocta"],
      "range-rover":          ["range-rover", "rangerover"],
      "range-rover-sport":    ["range-rover-sport", "rangerover-sport", "rangeroversport"],
      "range-rover-sport-sv": ["range-rover-sport-sv", "rangerover-sport-sv", "rrs-sv"],
      "range-rover-velar":    ["range-rover-velar", "velar"],
      "range-rover-evoque":   ["range-rover-evoque", "evoque"]
    }
  },

  lexus: {
    notes: "Per PROJECT_STATE.md and STATUS.md row: lexus.com returned thin/no content to WebFetch during Phase 1; pressroom.lexus.com is the documented better source. Using pressroom URLs where the model-specific press kit page is reliably available; falling back to consumer site otherwise. Expect mixed coverage.",
    model_pages: {
      "is": "https://www.lexus.com/models/IS",
      "es": "https://www.lexus.com/models/ES",
      "ls": "https://www.lexus.com/models/LS",
      "lc": "https://www.lexus.com/models/LC",
      "nx": "https://www.lexus.com/models/NX",
      "rx": "https://www.lexus.com/models/RX",
      "gx": "https://www.lexus.com/models/GX",
      "lx": "https://www.lexus.com/models/LX",
      "tx": "https://www.lexus.com/models/TX",
      "ux": "https://www.lexus.com/models/UX",
      "rz": "https://www.lexus.com/models/RZ"
    },
    slug_variants: {}
  },

  mazda: {
    notes: "mazdausa.com/vehicles/<model> consumer site. Hybrid/PHEV variants share the parent model page (cx-50-hybrid, cx-70-phev). MX-5 Miata RF is the targa-roof variant.",
    model_pages: {
      "mazda3-sedan":     "https://www.mazdausa.com/vehicles/2026-mazda3-sedan",
      "mazda3-hatchback": "https://www.mazdausa.com/vehicles/2026-mazda3-hatchback",
      "cx-30":            "https://www.mazdausa.com/vehicles/2026-cx-30",
      "cx-5":             "https://www.mazdausa.com/vehicles/2026-cx-5",
      "cx-50":            "https://www.mazdausa.com/vehicles/2026-cx-50",
      "cx-50-hybrid":     "https://www.mazdausa.com/vehicles/2026-cx-50-hybrid",
      "cx-70":            "https://www.mazdausa.com/vehicles/2026-cx-70",
      "cx-70-phev":       "https://www.mazdausa.com/vehicles/2026-cx-70-phev",
      "cx-90":            "https://www.mazdausa.com/vehicles/2026-cx-90",
      "cx-90-phev":       "https://www.mazdausa.com/vehicles/2026-cx-90-phev",
      "mx-5-miata":       "https://www.mazdausa.com/vehicles/2026-mx-5-miata",
      "mx-5-miata-rf":    "https://www.mazdausa.com/vehicles/2026-mx-5-miata-rf"
    },
    slug_variants: {
      "mazda3-sedan":     ["mazda3-sedan", "mazda3sedan", "mazda3"],
      "mazda3-hatchback": ["mazda3-hatchback", "mazda3hatchback"],
      "cx-30":            ["cx-30", "cx30"],
      "cx-5":             ["cx-5", "cx5"],
      "cx-50":            ["cx-50", "cx50"],
      "cx-50-hybrid":     ["cx-50-hybrid", "cx50hybrid", "cx-50hybrid"],
      "cx-70":            ["cx-70", "cx70"],
      "cx-70-phev":       ["cx-70-phev", "cx70phev"],
      "cx-90":            ["cx-90", "cx90"],
      "cx-90-phev":       ["cx-90-phev", "cx90phev"],
      "mx-5-miata":       ["mx-5-miata", "mx5miata", "miata", "mx-5"],
      "mx-5-miata-rf":    ["mx-5-miata-rf", "mx5miata-rf", "miata-rf"]
    }
  },

  mini: {
    notes: "Recommended Phase 4 smoke-test brand. miniusa.com/model/<model> consumer site. All 38 image entries flagged needs_scraping. No prior Phase 4 history — clean slate. Press fallback: press.bmwgroup.com USA (same press infrastructure as BMW).",
    model_pages: {
      "cooper-hardtop-2-door": "https://www.miniusa.com/model/hardtop-2-door.html",
      "cooper-hardtop-4-door": "https://www.miniusa.com/model/hardtop-4-door.html",
      "cooper-convertible":    "https://www.miniusa.com/model/convertible.html",
      "jcw-2-door":            "https://www.miniusa.com/model/jcw-hardtop.html",
      "jcw-convertible":       "https://www.miniusa.com/model/jcw-convertible.html",
      "countryman":            "https://www.miniusa.com/model/countryman.html",
      "jcw-countryman-all4":   "https://www.miniusa.com/model/jcw-countryman.html"
    },
    slug_variants: {
      "cooper-hardtop-2-door": ["cooper-hardtop-2-door", "hardtop-2-door", "hardtop2door", "cooper-2-door"],
      "cooper-hardtop-4-door": ["cooper-hardtop-4-door", "hardtop-4-door", "hardtop4door", "cooper-4-door"],
      "cooper-convertible":    ["cooper-convertible", "convertible"],
      "jcw-2-door":            ["jcw-2-door", "jcw-hardtop", "jcw2door"],
      "jcw-convertible":       ["jcw-convertible", "jcwconvertible"],
      "jcw-countryman-all4":   ["jcw-countryman-all4", "jcw-countryman", "jcwcountryman"]
    }
  },

  nissan: {
    notes: "nissanusa.com/vehicles/<model> consumer site. Z NISMO and Armada NISMO are performance variants with separate pages.",
    model_pages: {
      "sentra":                 "https://www.nissanusa.com/vehicles/cars/sentra.html",
      "altima":                 "https://www.nissanusa.com/vehicles/cars/altima.html",
      "z":                      "https://www.nissanusa.com/vehicles/sports-cars/z.html",
      "z-nismo":                "https://www.nissanusa.com/vehicles/sports-cars/z/z-nismo.html",
      "leaf":                   "https://www.nissanusa.com/vehicles/electric-cars/leaf.html",
      "kicks":                  "https://www.nissanusa.com/vehicles/crossovers-suvs/kicks.html",
      "rogue":                  "https://www.nissanusa.com/vehicles/crossovers-suvs/rogue.html",
      "rogue-plug-in-hybrid":   "https://www.nissanusa.com/vehicles/crossovers-suvs/rogue/rogue-plug-in-hybrid.html",
      "murano":                 "https://www.nissanusa.com/vehicles/crossovers-suvs/murano.html",
      "pathfinder":             "https://www.nissanusa.com/vehicles/crossovers-suvs/pathfinder.html",
      "armada":                 "https://www.nissanusa.com/vehicles/crossovers-suvs/armada.html",
      "armada-nismo":           "https://www.nissanusa.com/vehicles/crossovers-suvs/armada/armada-nismo.html",
      "frontier":               "https://www.nissanusa.com/vehicles/trucks/frontier.html"
    },
    slug_variants: {
      "z-nismo":              ["z-nismo", "znismo", "z_nismo"],
      "armada-nismo":         ["armada-nismo", "armadanismo"],
      "rogue-plug-in-hybrid": ["rogue-plug-in-hybrid", "rogue-phev", "rogueplugin"]
    }
  },

  porsche: {
    notes: "porsche.com/usa/models/<model> consumer site. Performance variants (911 GT3, GT3 RS, Turbo S, Spirit 70) live under /911/ tree. Taycan/Macan EV variants live alongside ICE. Cayenne Electric is the BEV variant.",
    model_pages: {
      "911":                "https://www.porsche.com/usa/models/911/911-models/",
      "911-gt3":            "https://www.porsche.com/usa/models/911/911-gt3-models/",
      "911-gt3-rs":         "https://www.porsche.com/usa/models/911/911-gt3-models/911-gt3-rs/",
      "911-turbo-s":        "https://www.porsche.com/usa/models/911/911-turbo-models/911-turbo-s/",
      "911-spirit-70":      "https://www.porsche.com/usa/models/911/911-spirit-70/",
      "718-cayman-gt4-rs":  "https://www.porsche.com/usa/models/718/718-cayman-gt4-rs/",
      "718-spyder-rs":      "https://www.porsche.com/usa/models/718/718-spyder-rs/",
      "taycan":             "https://www.porsche.com/usa/models/taycan/taycan-models/",
      "taycan-turbo-gt":    "https://www.porsche.com/usa/models/taycan/taycan-turbo-gt/",
      "taycan-cross-turismo":"https://www.porsche.com/usa/models/taycan/taycan-cross-turismo-models/",
      "panamera":           "https://www.porsche.com/usa/models/panamera/panamera-models/",
      "cayenne":            "https://www.porsche.com/usa/models/cayenne/cayenne-models/",
      "cayenne-coupe":      "https://www.porsche.com/usa/models/cayenne/cayenne-coupe-models/",
      "cayenne-electric":   "https://www.porsche.com/usa/models/cayenne/cayenne-electric/",
      "macan":              "https://www.porsche.com/usa/models/macan/macan-models/",
      "macan-electric":     "https://www.porsche.com/usa/models/macan/macan-electric/"
    },
    slug_variants: {
      "911-gt3":              ["911-gt3", "911gt3", "gt3"],
      "911-gt3-rs":           ["911-gt3-rs", "911gt3rs", "gt3-rs"],
      "911-turbo-s":          ["911-turbo-s", "911turbos", "turbo-s"],
      "911-spirit-70":        ["911-spirit-70", "spirit-70", "spirit70"],
      "718-cayman-gt4-rs":    ["718-cayman-gt4-rs", "cayman-gt4-rs", "gt4-rs"],
      "718-spyder-rs":        ["718-spyder-rs", "spyder-rs", "spyderrs"],
      "taycan-turbo-gt":      ["taycan-turbo-gt", "taycanturbogt"],
      "taycan-cross-turismo": ["taycan-cross-turismo", "cross-turismo", "crossturismo"],
      "cayenne-coupe":        ["cayenne-coupe", "cayennecoupe"],
      "cayenne-electric":     ["cayenne-electric", "cayenneelectric", "cayenne-ev"],
      "macan-electric":       ["macan-electric", "macanelectric", "macan-ev"]
    }
  },

  "rolls-royce": {
    notes: "rolls-roycemotorcars.com/en_US consumer site. Lineup is small (7 models). Black Badge variants are performance-styling versions of the parent model.",
    model_pages: {
      "phantom":             "https://www.rolls-roycemotorcars.com/en_US/showroom/phantom.html",
      "ghost":               "https://www.rolls-roycemotorcars.com/en_US/showroom/ghost.html",
      "ghost-black-badge":   "https://www.rolls-roycemotorcars.com/en_US/showroom/ghost/black-badge.html",
      "spectre":             "https://www.rolls-roycemotorcars.com/en_US/showroom/spectre.html",
      "spectre-black-badge": "https://www.rolls-roycemotorcars.com/en_US/showroom/spectre/black-badge.html",
      "cullinan":            "https://www.rolls-roycemotorcars.com/en_US/showroom/cullinan.html",
      "cullinan-black-badge":"https://www.rolls-roycemotorcars.com/en_US/showroom/cullinan/black-badge.html"
    },
    slug_variants: {
      "ghost-black-badge":    ["ghost-black-badge", "ghost-blackbadge", "ghostbb"],
      "spectre-black-badge":  ["spectre-black-badge", "spectre-blackbadge", "spectrebb"],
      "cullinan-black-badge": ["cullinan-black-badge", "cullinan-blackbadge", "cullinanbb"]
    }
  },

  subaru: {
    notes: "subaru.com/vehicles/<model> consumer site. Solterra is the EV; Trailseeker and Uncharted are 2026 additions (Trailseeker is the Outback successor for off-road trim, Uncharted is a new compact EV).",
    model_pages: {
      "impreza":          "https://www.subaru.com/vehicles/impreza",
      "crosstrek":        "https://www.subaru.com/vehicles/crosstrek",
      "forester":         "https://www.subaru.com/vehicles/forester",
      "outback":          "https://www.subaru.com/vehicles/outback",
      "ascent":           "https://www.subaru.com/vehicles/ascent",
      "brz":              "https://www.subaru.com/vehicles/brz",
      "wrx":              "https://www.subaru.com/vehicles/wrx",
      "solterra":         "https://www.subaru.com/vehicles/solterra",
      "trailseeker":      "https://www.subaru.com/vehicles/trailseeker",
      "uncharted":        "https://www.subaru.com/vehicles/uncharted"
    },
    slug_variants: {}
  },

  tesla: {
    notes: "Per task guidance: tesla.com/en_US is the consumer site. Tesla pages are highly JS-rendered — likely low scrape coverage. Tesla performance variants (Plaid, Performance, Cyberbeast) typically share base configurator with toggles, but each has its own /<model>/ landing on the consumer site. Placeholder fallback in catalog is acceptable.",
    model_pages: {
      "model-3":              "https://www.tesla.com/model3",
      "model-3-performance":  "https://www.tesla.com/model3",
      "model-y":              "https://www.tesla.com/modely",
      "model-y-performance":  "https://www.tesla.com/modely",
      "model-s":              "https://www.tesla.com/models",
      "model-s-plaid":        "https://www.tesla.com/models",
      "model-x":              "https://www.tesla.com/modelx",
      "model-x-plaid":        "https://www.tesla.com/modelx",
      "cybertruck":           "https://www.tesla.com/cybertruck",
      "cybertruck-cyberbeast":"https://www.tesla.com/cybertruck"
    },
    slug_variants: {
      "model-3":              ["model-3", "model3"],
      "model-3-performance":  ["model-3-performance", "model3-performance", "model3p"],
      "model-y":              ["model-y", "modely"],
      "model-y-performance":  ["model-y-performance", "modely-performance", "modelyp"],
      "model-s":              ["model-s", "models"],
      "model-s-plaid":        ["model-s-plaid", "models-plaid", "modelsplaid"],
      "model-x":              ["model-x", "modelx"],
      "model-x-plaid":        ["model-x-plaid", "modelx-plaid", "modelxplaid"],
      "cybertruck-cyberbeast":["cybertruck-cyberbeast", "cyberbeast"]
    }
  },

  volkswagen: {
    notes: "vw.com/en/models/<model> consumer site. ID.4 is the EV. Performance variants (Jetta GLI, Golf GTI, Golf R, Atlas Cross Sport) have separate pages.",
    model_pages: {
      "jetta":              "https://www.vw.com/en/models/jetta.html",
      "jetta-gli":          "https://www.vw.com/en/models/jetta-gli.html",
      "golf-gti":           "https://www.vw.com/en/models/golf-gti.html",
      "golf-r":             "https://www.vw.com/en/models/golf-r.html",
      "taos":               "https://www.vw.com/en/models/taos.html",
      "tiguan":             "https://www.vw.com/en/models/tiguan.html",
      "atlas":              "https://www.vw.com/en/models/atlas.html",
      "atlas-cross-sport":  "https://www.vw.com/en/models/atlas-cross-sport.html",
      "id-4":               "https://www.vw.com/en/models/id-4.html"
    },
    slug_variants: {
      "jetta-gli":         ["jetta-gli", "jettagli", "gli"],
      "golf-gti":          ["golf-gti", "golfgti", "gti"],
      "golf-r":            ["golf-r", "golfr"],
      "atlas-cross-sport": ["atlas-cross-sport", "atlas-crosssport", "cross-sport"],
      "id-4":              ["id-4", "id4", "id_4"]
    }
  },

  volvo: {
    notes: "volvocars.com/us/cars/<model> consumer site. EX-line is the pure-EV branding (EX30, EX40, EX90); XC-line is hybrid/ICE. ES90 is the new electric sedan; V60 Cross Country is the wagon variant. ES90 US pricing not yet announced (see PROJECT_STATE.md).",
    model_pages: {
      "xc40":             "https://www.volvocars.com/us/cars/xc40/",
      "xc60":             "https://www.volvocars.com/us/cars/xc60/",
      "xc90":             "https://www.volvocars.com/us/cars/xc90/",
      "v60-cross-country":"https://www.volvocars.com/us/cars/v60-cross-country/",
      "ex30":             "https://www.volvocars.com/us/cars/ex30/",
      "ex40":             "https://www.volvocars.com/us/cars/ex40/",
      "ex90":             "https://www.volvocars.com/us/cars/ex90/",
      "es90":             "https://www.volvocars.com/us/cars/es90/"
    },
    slug_variants: {
      "v60-cross-country": ["v60-cross-country", "v60cc", "v60-cc"]
    }
  }
};

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const results = [];
  for (const [slug, cfg] of Object.entries(configs)) {
    const out = {
      brand_slug: slug,
      ...(cfg.notes ? { notes: cfg.notes } : {}),
      model_pages: cfg.model_pages,
      slug_variants: cfg.slug_variants || {},
      path_blacklist_regex: DEFAULT_BLACKLIST
    };
    const outPath = path.join(OUT_DIR, slug + ".json");
    await fs.writeFile(outPath, JSON.stringify(out, null, 2) + "\n", "utf-8");
    const modelCount = Object.keys(cfg.model_pages).length;
    const variantCount = Object.keys(cfg.slug_variants || {}).length;
    results.push(`${slug}: ${modelCount} model_pages, ${variantCount} slug_variants`);
  }
  console.log(results.join("\n"));
  console.log("\nWrote " + results.length + " configs to " + OUT_DIR);
}

main().catch(e => { console.error(e); process.exit(1); });
