# Reference fidelity: observed, simplified, or unverified

Every element of the training workspace is listed here with the evidence
behind it. "Observed" means it is visible in one of the ten supplied photos.
"Manual" means it follows the manufacturer manual read locally for this app
(PC•MACs manual, January 13, 2021; Br-EFB manual, May 22, 2018). "Simplified"
means it is a teaching simplification that the app labels as such. "Unverified"
means no supplied reference establishes it.

## The headline gap

None of the ten photos shows the PC•MACs main window with the terminal dialog
closed. Behind the dialog only a time ruler (`0 min 04 sec … 24 sec`), dashed
grid lines, and purple and red trace fragments are visible. The app therefore
does **not** claim an exact reproduction of the main PC•MACs workspace. The
timeline workspace follows the manual's description of the OffLine Editing
Window and is labeled a simplification in the app. A readable full-window
screenshot of PC•MACs with the show, channel list, and transport visible would
let a later version compare element by element.

## Terminal - COM3 dialog

| Element | Status | Evidence |
| --- | --- | --- |
| Window title "Terminal - COM3" | observed | photos 01, 03, 06–10 |
| Toolbar: Card [1], Character delay [None], Clear Screen, Status (greyed), Config Done, Control | observed | photos 01, 06–10; meanings from PC•MACs manual p. 209–211 |
| Status greyed while in configuration mode | observed + manual | photos; manual p. 210 says the button is unavailable in configuration mode |
| Header line "Gilderfluke & Co. - Electronic Feedback Card - version 1.98 - copyright 2022", Serial Address 1, IP 192.168.0.10, NO ADL FILE! | observed | all terminal photos |
| Main configuration menu lines a/c/d/e/f, s, 1–6 and the Min/Max/Force/Power/Vel table | observed | photo 07 (values), photos 05–06 (earlier values) |
| Feedback menu lines s, 1–7 and the P/I/D/Rev table | observed | photo 09 |
| Network settings screen | observed | photo 10 |
| Prompt "Enter the card address (0 - 255):" | observed | photo 01 |
| Prompt "Enter the axis (0 - 3):" | observed | photo 03 |
| Footer key lists | observed | photos 07 and 09 |
| Two-column layout (menu left, table right) | simplified | the photos show this arrangement; column widths were narrowed to fit the trainer |
| Response to keys 1–5, i, o, g, h, 7 and to network options 1–4 | unverified, not simulated | prompts never photographed; the app says "not simulated" |
| X then Y/N to exit configuration mode | manual | PC•MACs manual p. 210 |
| Control window command list | manual | PC•MACs manual p. 210–211; read-only in the app |
| Uptime value | simplified | a fixed placeholder; the photos show several different uptimes |

## Timeline workspace

| Element | Status | Evidence |
| --- | --- | --- |
| Time ruler along the top with "0 min / NN sec" two-line labels, major markers each second | observed + manual | ruler fragments in photos 01 and 09; manual p. 77 |
| Analog pane above, digital pane below, channel names at the left | manual | p. 76–78 |
| Analog shown as 0–100% | manual | p. 76 |
| Digital OFF drawn light blue, ON drawn black and thicker | manual | p. 77 |
| Green start and red end transport markers | manual | p. 77 |
| Show times at the lower left and right, hh:mm:ss.ff, 30 FPS | manual | p. 77 and p. 136; format seen in Br-EFB manual screens |
| Play and Stop buttons | manual | Main Control Window Play [F1] and Stop [space] (section titles p. 201–203) |
| Eight one-second toggle blocks | simplified | the real editor draws digitals with a right mouse click over a selected time range (p. 85) |
| Two training channels "Light 1", "Light 2" with no DMX address | simplified | no lighting channels appear in the references |
| Dashed "simulated measurement" line | simplified | the real window shows programmed values, not live feedback |
| Command slider and readouts under the panes | simplified | trainer-only controls |
| Purple command trace color | observed | trace color in photos 01, 03, 05, 09 |
| Grey-blue dashed grid | observed | background grid in the photos |
| Zoom, selection ranges, presets, drag-and-drop triggers, many channels | not implemented | p. 77–80 |

## Photographed values quoted in lessons

| Value | Status | Note |
| --- | --- | --- |
| Card Address 1, First Channel 6, Resolution 8-bit, DMX Rx w/CS, 0-based | observed | consistent across photos |
| Axis to DMX mapping 6 (0), 7 (1), 8 (2), 9 (3) | observed | consistent across photos |
| Min/Max Scale 61/147, 37/88, 59/183, 38/135 | observed (photo 07) | photos 05–06 show 61/0 and 10/135; snapshots differ and none is "correct" |
| Vel Limit 3.00, 7.00, 3.00, 6.00 | observed | units and meaning unverified; absent from the 2018 manual |
| P gains 1.000, 3.000, 1.000, 2.500; Rev Out Yes/No/No/Yes; Axis 0 Enabled | observed (photo 09) | not recommendations |
| IP 192.168.0.10, netmask 255.255.255.0, gateway 192.168.0.1, DHCP disabled | observed (photo 10) | laptop address not photographed; 192.168.0.20 is hypothetical |

## Things the app deliberately leaves unresolved

Velocity Limit units and algorithm; firmware 1.98 PID behavior; PowerOn Default
special values on this firmware; how a forced output is released; the position
sensor's identity, travel, and wiring; the actuator type on the team's rig
(hydraulic, pneumatic, or electric); any lighting channel's real DMX address.
Each is labeled "unverified" in the handbook with a note on what evidence would
establish it (firmware-matched documentation, or inspection with the team lead).
