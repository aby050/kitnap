#!/usr/bin/env python3
"""Compose App Store iPad screenshots (2064x2752, 13-inch) from raw captures.

Matches the iPhone set: eyebrow, two-line serif headline (second line green),
one-line subline, then the real iPad capture inside a device frame.

  python3 scripts/compose-ipad-shots.py RAW_DIR OUT_DIR

RAW_DIR holds <key>.png captures from the 13-inch iPad simulator; keys are the
entries of SHOTS below. Renders with headless Google Chrome.
"""
import html, pathlib, subprocess, sys

W, H = 2064, 2752
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

SHOTS = [
    ("01-gate", "MOVE TO UNLOCK", "No ignore button.", "Eight push-ups gets you in.",
     "The camera counts reps on your device. Nothing is recorded."),
    ("02-intensity", "STEADY OR STRICT", "Answer something,", "or do something.",
     "Choose what it takes to earn three minutes back."),
    ("03-timer", "A LOCK THAT HOLDS", "Not a reminder.", "A door that is shut.",
     "Once a session starts, it cannot be paused or waited out."),
    ("04-breath", "OR A SLOW BREATH", "Getting back in", "costs something.",
     "A question or a breathing pause when you cannot move."),
    ("05-rooms", "SOMEWHERE ELSE TO BE", "A quiet screen", "is not the point.",
     "Timed rooms give the hour somewhere to go."),
    ("06-why", "WHY THIS ONE", "Most blockers let you out.", "This one does not.",
     "No dismiss button, no password you already know."),
]

PAGE = """<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,400;1,9..144,700&family=Inter:wght@400;600&display=block" rel="stylesheet">
<style>
 html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden}}
 body{{background:linear-gradient(180deg,#000 0%,#02090b 45%,#0b3640 100%);
   font-family:Inter,-apple-system,sans-serif;color:#fff}}
 .copy{{position:absolute;left:150px;top:150px;right:150px}}
 .eyebrow{{color:#2fd3c3;font-weight:600;font-size:46px;letter-spacing:2px}}
 h1{{margin:26px 0 0;font-family:Fraunces,serif;font-style:italic;font-weight:400;
   font-size:112px;line-height:1.08;letter-spacing:-1px}}
 h1 b{{display:block;color:#35e38b;font-weight:700}}
 .sub{{margin-top:34px;color:#c9d1d3;font-size:46px}}
 .device{{position:absolute;left:50%;transform:translateX(-50%);top:{DT}px;
   width:{DW}px;height:{DH}px;border-radius:84px;background:#0c0f10;
   border:6px solid #3a4043;box-shadow:0 30px 120px rgba(0,0,0,.6);padding:34px;box-sizing:border-box}}
 .device img{{width:100%;height:100%;border-radius:52px;object-fit:cover;display:block}}
</style></head><body>
<div class="copy"><div class="eyebrow">{eyebrow}</div><h1>{l1}<b>{l2}</b></h1><div class="sub">{sub}</div></div>
<div class="device"><img src="{img}"></div>
</body></html>"""


def main(raw_dir, out_dir):
    raw, out = pathlib.Path(raw_dir).resolve(), pathlib.Path(out_dir).resolve()
    out.mkdir(parents=True, exist_ok=True)
    # Device frame keeps the capture's 3:4 aspect and fills the space below the copy.
    dt = 760
    dh = H - dt - 110
    dw = round((dh - 68) * 2064 / 2752) + 68
    for key, eyebrow, l1, l2, sub in SHOTS:
        img = raw / f"{key}.png"
        if not img.exists():
            print("missing", img); continue
        page = out / f"{key}.html"
        page.write_text(PAGE.format(W=W, H=H, DT=dt, DW=dw, DH=dh, img=img.as_uri(),
                                    eyebrow=html.escape(eyebrow), l1=html.escape(l1),
                                    l2=html.escape(l2), sub=html.escape(sub)))
        png = out / f"{key}.png"
        subprocess.run([CHROME, "--headless=new", "--hide-scrollbars", "--force-device-scale-factor=1",
                        f"--window-size={W},{H}", "--virtual-time-budget=8000",
                        "--allow-file-access-from-files", "--user-data-dir=/tmp/phonewise-shots-chrome", "--no-first-run", f"--screenshot={png}", page.as_uri()],
                       check=True, capture_output=True)
        page.unlink()
        print("wrote", png)


if __name__ == "__main__":
    main(*sys.argv[1:3])
