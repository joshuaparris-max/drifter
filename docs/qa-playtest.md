# Dreadnought Drifters — Narrative Slice QA

Run `npm run dev`, open the local URL, and test without the automated `testPosition` query parameter.

- [ ] Click the canvas: the mouse pointer locks and moving the mouse rotates the camera smoothly.
- [ ] Press W, A, S, and D: each moves in the expected direction and the player remains inside the chamber.
- [ ] Press Escape while exploring: pointer lock releases and the page remains responsive.
- [ ] Walk toward the glowing Left Eye Nerve Oracle: the interaction prompt appears only at close range.
- [ ] Press E near the Oracle: dialogue opens, pointer lock releases, and movement pauses.
- [ ] Verify the speaker, flavour text, normal response, and Persuasion response are readable.
- [ ] Select Persuasion: natural roll, modifier, total, DC 11, and success/failure appear.
- [ ] Verify success adds 10 reputation and failure subtracts 5 reputation.
- [ ] Close with the × button, then repeat using Escape: both return to the scene.
- [ ] Press E again while nearby: the Oracle dialogue can be retried normally.
- [ ] Refresh the browser: the scene returns to its initial spawn and transient dialogue/reputation state resets.

## Automation boundaries

Playwright covers sustained WASD movement from the real spawn, proximity arrival, movement resuming after dialogue, both dialogue choices, deterministic natural 1 and natural 20 outcomes, reputation changes, retrying, and refresh reset.

The following remain manual checks because browser automation cannot reliably reproduce their physical feel:

- Pointer-lock permission and Escape unlock behavior in each supported browser.
- Mouse-look sensitivity, smoothness, and motion comfort.
- Whether the Oracle is visually discoverable without knowing its location.
- Whether the 2.75-unit prompt distance feels fair during natural play.

## Playtest observations — 1 July 2026

- Normal spawn frames the cortex clearly; the Oracle glow is visible at the far-right edge, but the eye is partly off-screen and can be mistaken for ambient light.
- The 2.75-unit interaction radius is mechanically fair: it requires a deliberate approach without forcing the player into the model.
- Dialogue is readable, clearly pauses play, and presents both choices and reputation without ambiguity.
- The normal response closes cleanly with no reputation change. Natural 1 and natural 20 checks route to the correct failure/success text and apply -5/+10 reputation.
- Closing and retrying work, movement resumes, and refresh resets transient state as currently intended.
- Pointer-lock and subjective mouse-look feel still require a human-controlled browser pass; the QA browser does not grant pointer lock.
