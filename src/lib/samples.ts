import type { Extraction } from "./gemini";

// What Gemini read from the two sample chits in public/samples (recorded 2026-09-30 from a live
// /api/audit call). The example button still asks Gemini first; these are used only if Gemini is
// out of quota or down, so the sample never fails while the free tier is exhausted.
export const SAMPLE_READINGS: Record<"chilli" | "paddy", Extraction> = {
  "chilli": {
    "isChit": true,
    "products": [
      {
        "written": "Monocil 36 SL",
        "brand": "Monocil",
        "actives": [
          {
            "name": "monocrotophos",
            "percent": 36
          }
        ],
        "formulation": "SL",
        "dose": {
          "amount": 2,
          "unit": "ml",
          "per": "litre",
          "pumpLitres": null
        }
      },
      {
        "written": "Confidor 17.8 SL",
        "brand": "Confidor",
        "actives": [
          {
            "name": "imidacloprid",
            "percent": 17.8
          }
        ],
        "formulation": "SL",
        "dose": {
          "amount": 1,
          "unit": "ml",
          "per": "litre",
          "pumpLitres": null
        }
      },
      {
        "written": "Karate 5 EC",
        "brand": "Karate",
        "actives": [
          {
            "name": "lambda-cyhalothrin",
            "percent": 5
          }
        ],
        "formulation": "EC",
        "dose": {
          "amount": 30,
          "unit": "ml",
          "per": "pump",
          "pumpLitres": null
        }
      },
      {
        "written": "Cypermethrin 10 EC",
        "brand": null,
        "actives": [
          {
            "name": "cypermethrin",
            "percent": 10
          }
        ],
        "formulation": "EC",
        "dose": {
          "amount": 25,
          "unit": "ml",
          "per": "pump",
          "pumpLitres": null
        }
      }
    ],
    "problem": "thrips, leaf curl",
    "cropSeen": "chilli",
    "dealer": "Kisan Agro Agencies"
  },
  "paddy": {
    "isChit": true,
    "products": [
      {
        "written": "Thimet 10 G",
        "brand": "Thimet",
        "actives": [
          {
            "name": "phorate",
            "percent": 10
          }
        ],
        "formulation": "GR",
        "dose": {
          "amount": 4,
          "unit": "kg",
          "per": "acre",
          "pumpLitres": null
        }
      },
      {
        "written": "Chloropyriphos 20 EC",
        "brand": "Chloropyriphos",
        "actives": [
          {
            "name": "chlorpyrifos",
            "percent": 20
          }
        ],
        "formulation": "EC",
        "dose": {
          "amount": 500,
          "unit": "ml",
          "per": "acre",
          "pumpLitres": null
        }
      },
      {
        "written": "Coragen 18.5 SC",
        "brand": "Coragen",
        "actives": [
          {
            "name": "chlorantraniliprole",
            "percent": 18.5
          }
        ],
        "formulation": "SC",
        "dose": {
          "amount": 60,
          "unit": "ml",
          "per": "acre",
          "pumpLitres": null
        }
      }
    ],
    "problem": "stem borer",
    "cropSeen": "paddy",
    "dealer": "Kisan Agro Agencije"
  }
};
