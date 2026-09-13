# Focus room media

Drop loop footage and ambient audio here, named after the room key from
`src/data/ambiences.ts`:

    family.mp4  family.m4a  family.jpg
    meditate.mp4  meditate.m4a  meditate.jpg
    think.*  peace.*  study.*  winddown.*

Then uncomment that room's block in `src/data/ambienceMedia.ts`. A room with
no entry there renders its gradient wash instead — nothing breaks.

**Video:** silent, seamless loop, H.264 in an .mp4, 1080×1920, 10–20s.
Sound lives in the separate audio file, not in the clip.

**Audio:** .m4a (AAC), loopable, mixed quiet — it plays under a countdown,
not as the main event.
