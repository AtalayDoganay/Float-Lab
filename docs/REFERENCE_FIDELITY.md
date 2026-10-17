# Reference fidelity: what each recreated screen rests on

Roseflow PC Mac Training is an independent trainer. It recreates the PC•MACs
windows the team uses, simulates part of their behaviour, and never connects
to anything. This file maps every recreated screen and interaction to its
evidence, lists deliberate training adaptations, and states the gaps.

Status words used below:

- **manual**: shown in a screenshot or described in the PC•MACs manual.
- **photo**: visible in the team's reference photos 01–10.
- **adapted**: a deliberate training change, labelled in the app.
- **assumed**: the trainer had to choose; no reference settles it.
- **not simulated**: drawn as in the reference; using it explains that it
  does nothing in the trainer.

## Version and sources (checked October 7, 2026)

| Source | What it establishes |
| --- | --- |
| PC•MACs manual, January 13, 2021 edition, 326 pages ([PDF](https://gilderfluke.com/wp-content/uploads/2019/12/PCMACs_Manual.pdf), SHA-256 `ce30eacc2500f950…`) | The layout, labels, menus, and behaviour of the Edit View, Control Window, Soft Console, and GilderTerm. Every page was rendered for this redesign, and the screenshots of these windows were read closely. It covers PC•MACs version 2 (it cites “2.02.216.xxx or later”, p. 21). It is still the newest manual Gilderfluke links. |
| Gilderfluke downloads page (read through Wayback snapshots, January–April 2026, because gilderfluke.com returned HTTP 500 on October 7, 2026) | The newest listed build is **PC•MACs v2.1.226.000 Beta** (first listed in 2022). No changelog exists. |
| PC•MACs cut sheet, 2011 (gilderfluke.com/wp-content/uploads/2019/09/Pc-MACs.pdf) | A second, sharper capture of the Edit View, Control Window, Edit menu, and Soft Console. It is older (Windows Classic look) and agrees with the 2021 manual's layout. |
| Br-EFB manual, May 22, 2018 | Concepts for the card: endpoints, P gain, reverse output, network settings, and “5) limit valve voltage” (p. 100). Its screens are firmware 1.00, not the photographed 1.98. |
| Team photos 01–10 (hash-identical in the handoff ZIP and the app) | The Terminal - COM3 window with Br-EFB firmware 1.98, and fragments of the PC•MACs Edit View behind it. |
| Screenshot 1 (`one-file-promot-float-lab/assets/screenshot-…png`) | The earlier trainer's crowded layout: the feedback reference for this redesign, not a PC•MACs reference. |

**Chosen target:** PC•MACs version 2 as documented and photographed in the
January 13, 2021 manual, in that manual's Windows 7/8 look. The terminal
follows the team's photos, which show a newer build than the manual's
capture: its toolbar reads “Card” where the manual's reads “Card Address:”.
The exact build on the team's laptop is unknown; Help ▸ About PCMACS on that
laptop would settle it.

No video of the running application was usable: YouTube offered only
low-resolution preview frames and the Gilderfluke videos have no captions.

## Menu bar

| Element | Status | Evidence |
| --- | --- | --- |
| File, Edit, RealTime, Offline, Channels, Preferences, Help | manual | p. 76 and p. 133 |
| Time Out, Time In, Values Out, Values In while the Edit View is active | manual | p. 76 (items F), p. 77 |
| Every item, shortcut, and greyed state of File, Edit, RealTime, Offline, Channels (first sections), Preferences (first sections), Help | manual | pp. 133–134 screenshots |
| File menu recent-show list | left out | someone else's file names |
| Menus always shown, even when the Edit View is hidden | adapted | the trainer keeps one menu bar for all windows |
| Simulated items: Edit ▸ Set Digitals Off/On, Set Analogs to a Value..., Select All, Deselect All; RealTime ▸ Show Main Controls, Show GilderTerm, Show Soft Console, Set Outputs to First/Last Frame, Play, Stop, Pause, Manual Mode, Ease-In, Auto Punch, Auto-Inbetween, Audio Cue, Looping; Time In / Time Out | manual behaviour, simulated | pp. 176–178, 201–206, 77 |
| Every other item | not simulated | it says so in the trainer note under the windows |
| Keyboard shortcuts Ctrl+0/1/2, Ctrl+A, Alt+A, Ctrl+L, F2–F5, Home, End | manual | menu screenshots; active while focus is inside the recreated windows |
| F1 for Play | adapted | F1 stays the trainer's help key; Play is the button or RealTime ▸ Play |

## Edit View (OffLine Editing Window)

| Element | Status | Evidence |
| --- | --- | --- |
| Window title “Edit View”, Windows 7/8 frame | manual | p. 76 |
| Ruler: “0 min / NN sec” at each second, frame numbers between, dotted second lines | manual | pp. 76–77, 235 |
| Frame labels every 10, 4, or 2 frames depending on zoom | adapted | the manual shows every 2 frames at its default zoom of 2–4 s; the trainer's default fits the whole 8-second show |
| Analog pane 0–100%, dashed grid at 25% steps, stair-step traces one step per frame, names bottom-left in trace colours, scale labels | manual | p. 76; colours sampled from the screenshot |
| Four analogs named “Axis n DMX 6+n” | adapted | the team's channel names are not in any reference; the names carry the photographed axis-to-address mapping |
| Default analog show data (a ramp on axis 0, holds elsewhere) | adapted | trainer-made; not photographed, not recommended values |
| Digital pane: one row per channel 12 px apart, OFF thin grey, ON 3 px black, selected 7 px | manual | p. 77; pixels sampled (the text says “light blue”, the screenshot is grey; the screenshot was followed) |
| Two digitals “Light 1 Digital”, “Light 2 Digital” | adapted | training channels with no real DMX address |
| Yellow selected stretch; selected channels fatter inside it; selected names boxed grey | manual | pp. 76–77, 81 |
| LeftClick-and-slide selects a channel or all displayed channels; Shift+LeftClick adds/removes or extends | manual | pp. 81–82 |
| Click / Ctrl+Click on names selects | manual | p. 82 |
| RightClick-and-slide on a digital draws or undraws | manual | p. 85 |
| Double-click empty space sets the Start time | manual | p. 77 |
| RightClick on empty space opens Set Start Here, Set Stop Here, Loop, Scroll While Playing, Play Selection, Loop Selection, Set to Full Show, New Trigger... | manual | pp. 79–80 screenshot wording; Scroll While Playing and New Trigger are not simulated |
| The Menu key or Shift+F10 on a focused pane opens the same shortcut menu at the selection start | adapted | a keyboard path; the manual describes only the mouse |
| Green Start, blue Punch In, orange Punch Out, dashed red Stop lines | manual | p. 77; colours sampled |
| Bottom row: left / selection start -> end / centre / (delta) / right times with clock faces; Cursor time and value; Save Offline Preset; preset list; Selected Channels...; channel under the cursor | manual | p. 76 items D, G, I, J, K, M |
| Typing the selection times | manual | p. 84 |
| Clock-face menus, digit-by-digit time editing with mouse clicks | not simulated | pp. 84, 243–246; the fields take typed times |
| Thin black play-position line during playback | assumed | the manual mentions scrolling while playing but shows no playhead |
| Zoom with Time In / Time Out (three steps) | manual behaviour, adapted steps | p. 77 |
| Values Out / In, rubberbanding, Shift/Ctrl right-drags, triggers, presets, Move to OffLine, channel sorting, name drag | not simulated | pp. 78–112 |
| Splitter between panes, vertical scroll bars | drawn only | p. 235 |

## Control Window

| Element | Status | Evidence |
| --- | --- | --- |
| Title “Control Window”, no min/max/close boxes | manual | p. 201 screenshot |
| Play, Record, Rehearse, Stop, Pause, OffLine; current mode drawn black | manual | p. 201 |
| Pause reads Continue while paused | manual | p. 203 |
| Show time hh:mm:ss.ff | manual | p. 201 |
| Auto-Punch, Manual, Ease-In (with indicator), Audio Cue, Loop, Auto-Inbetweening | manual | p. 201 |
| Manual and Loop change the simulation; the others only tick | manual behaviour / not simulated | pp. 204–205 |
| Moving a punch slider ticks Auto-Punch; moving Audio Cue off zero ticks Audio Cue | manual | pp. 204, 206 |
| Select Sequencer (fixed “Roseflow training show”), Load Preset (Shift to Save), Skew 00 | manual layout; not simulated | p. 205 |
| Start, Stop, Punch In, Punch Out, Audio Cue time fields and sliders | manual | pp. 205–206; Start and Stop drive playback and the Edit View lines |
| Stop default 00:00:07.29, the show's last frame | manual convention | p. 201 shows Stop at the show's last frame |
| Record, Rehearse, OffLine | not simulated | pp. 202–203 |
| Two empty bars at the bottom | manual; left empty | unlabelled in the screenshot |

## Soft Console

| Element | Status | Evidence |
| --- | --- | --- |
| Title segments “New Soft Console”, “No joystick found.”, “Preset: …” | manual | p. 116 |
| Preset name “Roseflow trainer” | adapted | the screenshot shows a cleared console (`<clear console>`); the trainer's has assignments |
| Analog rows: Rev, Punch Out, assignment, Value, slider, BUMP | manual | p. 116 |
| Four sliders assigned to Axis 0–3 | adapted | the screenshot shows eight unassigned |
| Value 0–255 | manual | p. 178 dialog title “Set to value (0 - 255):” |
| With Manual on, sliders and buttons drive the outputs; BUMP is 100% while held; Rev flips the slider | manual | pp. 117–118 |
| Mouse Landing Pad & Message Box, Sliders/Buttons Displayed, Find Joystick, preset list, Save Preset | manual layout; not simulated | p. 116 |
| Digital buttons 1–8, buttons 1 and 2 assigned to Light 1 and Light 2 | manual layout; assignment adapted | p. 116 |
| Punch Out, Alt | drawn only | p. 118 |

## “Set to value (0 - 255):” dialog

| Element | Status | Evidence |
| --- | --- | --- |
| Title, value field, Hexadecimal / Decimal / Percentage, OK, Cancel, vertical slider | manual | p. 178 |
| Decimal chosen by default | assumed | the screenshot shows Percentage chosen; Decimal matches the lessons' 0–255 wording |

## Terminal - COM3 (GilderTerm)

| Element | Status | Evidence |
| --- | --- | --- |
| Title “Terminal - COM3”, left-aligned with icon, Windows 7 frame | photo | photos 01, 03, 06–10 |
| Toolbar: Card [1], Character delay [None], Clear Screen, Status (greyed), Config Done, Control | photo | photos 06–07 |
| Underlined access letters (Cl̲ear Screen, S̲tatus, Config D̲one, Con̲trol) | manual | p. 209 capture (an older build; the photos are too soft to confirm) |
| Courier-style black-on-white text area, sunken | photo | photos 06–07 |
| Header, main menu, axis table, footer with “, ” separators | photo | photo 07 (values), photos 05–06 (earlier values) |
| Feedback menu, network settings screen, card and axis prompts | photo | photos 09, 10, 01, 03 |
| Configure / Config Done toggle, X then Y/N | manual | pp. 209–210 |
| Keys 1–5, i, o, g, h, 7 and network options 1–4 | not simulated | prompts never photographed |
| Uptime fixed at 0:00:19:41 | adapted | the photos show several uptimes |
| Typing straight into the terminal text | manual behaviour | a terminal takes keystrokes; the trainer's key box under the window is an adaptation |
| The card's “axis to modify” is separate from the analog selected in PC•MACs | real behaviour | GilderTerm shows the card's own menu; the two programs do not share a selection, so the trainer does not link them |
| Control window command list | manual; read only | pp. 210–211 |

## Trainer-only parts (outside the recreated windows, plum styling)

| Element | Status |
| --- | --- |
| Simulated float: two lanterns, one actuator bar for the selected axis, output source sentence | adapted |
| Output when stopped with Manual off: hold the show's values at the current frame | assumed; the manual does not say |
| Measurement model (approach a fraction of the gap per tick) | adapted; not a Br-EFB, valve, or PID model |
| Hypothetical laptop address and example travel range | adapted |
| Trainer note strip under the windows | adapted |
| Lesson panel, handbook, hover/focus tooltips, F1 help, Help ? “What's this?” mode | adapted |

## Photographed values quoted in lessons

| Value | Status | Note |
| --- | --- | --- |
| Card Address 1, First Channel 6, Resolution 8-bit, DMX Rx w/CS, 0-based | photo | consistent across photos |
| Axis to DMX mapping 6 (0), 7 (1), 8 (2), 9 (3) | photo | consistent across photos |
| Min/Max Scale 61/147, 37/88, 59/183, 38/135 | photo 07 | photos 05–06 show other values; none is “correct” |
| Vel Limit 3.00, 7.00, 3.00, 6.00 | photo | meaning unverified; the 2018 manual has no Velocity Limit entry; its “limit valve voltage” (p. 100) may or may not be the same setting |
| P gains 1.000, 3.000, 1.000, 2.500; Rev Out Yes/No/No/Yes; Axis 0 Enabled | photo 09 | not recommendations |
| IP 192.168.0.10, netmask 255.255.255.0, gateway 192.168.0.1, DHCP disabled | photo 10 | laptop address not photographed |

## Gaps that remain

- The PC•MACs build on the team's laptop, and anything that changed visually
  after the 2021 manual (v2.1.226 has no published screenshots).
- The main PC•MACs frame's own title bar, toolbar, and status bar: no
  screenshot shows them, so the trainer draws only the menu bar and windows.
- What the outputs do after Stop with Manual off.
- Velocity Limit units and algorithm, firmware 1.98 PID behaviour, PowerOn
  Default special values, how a forced output is released.
- The rig: sensor identity, travel, wiring, actuator type, valve or pump, and
  any lighting channel's real DMX address.

Each is labelled in the app where it matters, with what evidence would close it.
