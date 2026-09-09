# Hi These are My Wallpapers

*[Link to walljar page](https://y-jar.github.io/wall-jar/)*

> quick note for keen viewers: some of you might see i dont have the sources for some of the artists or artist names in-file. ive had these wallpapers for a while and i grab them kinda lazylike. So if you can forgive that, Enjoy! `[if you know the artest for a file, do hit me up and i will update]`

**Contents**
- [wall-bin/](./wall-bin)| what holds my desktop wallpapers
- [wall-phone-bin/](./wall-bin)| what holds my phone wallpapers

**If people want to copy the workflow:**

1. Drop the image into wall-bin/ (desktop) or wall-phone-bin/ (phone).
2. From the repo root, run python3 scripts/gen-index.py — this is the step that makes it exist. It rescans both bins and rewrites wallpapers_database.json (size, ext, auto-tags).
3. git add the image and the JSON, commit, push.