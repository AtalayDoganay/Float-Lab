# Float Lab — complete project context

Handoff date: October 5, 2026, America/Los_Angeles.
Owner: Atalay Doganay. Team context: Cal Poly Pomona Rose Float.

## Purpose and user intent

Build an approachable educational app that teaches PC•MACs and the relevant controller concepts step by step. The user wants the app to walk them through explanations, ask questions, show what changes do, and explain their mistakes. They want to understand the equipment they see in the workshop, not memorize unexplained menus.

The first prototype was published as a private browser app. The user then clarified the intended direction: a real downloadable app distributed through GitHub, developed in VS Code, with this project’s knowledge carried into their separate One File project workspace.

Windows desktop is the proposed first target based on the user’s Windows development setup. The user has not chosen a desktop framework. Electron around the current local web interface is a proposed implementation path, not an existing implementation or a firm user constraint. Follow an established stack if the target repository already has one.

The user’s latest requests, in their own words:
- “So need to make an app that is gonna gonna walk you throw and ask quesitons and teach you how eveything works.”
- “something downloadable on GitHub … transfer everything, like all of the knowledge into the one file app that we build … make a prompt for a VS Code.”

## Learning style

Use plain English and short steps. Define a term before using it. Explain what each number means, why it exists, and what changes when it is adjusted. Show an example, then let the learner manipulate a clearly labeled simulation. Ask one question at a time and explain wrong answers specifically. Include a simpler explanation and opportunities to review.

Earlier confusion included whether IP and gateway were the same, what the last number in an IP means, why a netmask contains 255 values, whether 0–255 measures distance, and how a pulled position sensor could relate to resistance. Do not label a control value as centimeters or a photo’s setting as ohms without evidence. The exact physical sensor model is not identified in the supplied photos.

## Relationship to One File

One File is the user’s separate Windows desktop project-context/chat application. It has previously supported scoped file sharing and project conversations, plus an official ChatGPT ZIP/JSON conversation-import workflow. Its actual current code and importer schema were not inspected in this task.

This handoff is project documentation, not an official ChatGPT export. Share/read this single Markdown file through the existing supported context workflow, or paste its text into a dedicated Float Lab project conversation. Do not fabricate a conversations.json format, silently alter One File, mix this project into unrelated project memories, or claim the app has imported anything until it is verified.

Code changes for Float Lab belong in its own repository. The source ZIP is meant to be extracted and opened in VS Code, not assumed to be accepted by One File’s conversation importer. Preserve One File’s existing user-controlled access boundaries.

## Existing implementation

The included `app/` contains a dependency-free static HTML/CSS/JavaScript app:
- `index.html`: layout, metadata, source links, learning and question panels.
- `style.css`: responsive navy/lime workshop-style interface, readable text, keyboard focus states, reduced-motion styling.
- `app.js`: curriculum, question state, lesson navigation, demos, completion/review logic.
- Four JPGs used in the UI: controller, feedback, network, and workshop.

Ten lessons, two questions each:
1. The whole system.
2. Channels and signals.
3. Understanding 0–255.
4. Read your controller.
5. Range and calibration.
6. Feedback and PID.
7. Timing and playback.
8. Network settings.
9. Other menu settings.
10. Workshop challenge.

Demos include component-role selection, ON/OFF switching, a variable-level slider, number-to-percentage conversion, a linear calibrated-range example, screenshot-based axis/channel mapping, a target/measurement animation, an editable eight-second ON/OFF sequence, a hypothetical laptop network comparison, and menu-label explanations.

Questions give answer-specific hints on mistakes. Correct answers unlock advancement. Learners can jump between lessons. A completion checkpoint detects unfinished lessons and offers review of topics where mistakes occurred. Progress lives in JavaScript memory only and is lost on reload.

There are two optional feature-detected browser WebMCP tools: `get_learning_state` and `open_learning_lesson`. They are not needed for ordinary use and were not validated in a supported WebMCP runtime. Do not expose them as a promised desktop feature without deciding whether they are useful and testing them.

Successful checks: JavaScript syntax, ten lesson records, twenty answer keys, wrong-answer hint coverage, existence of referenced photos. Deployment reported succeeded. No rendered browser interaction test, Windows executable, installed-desktop run, or persistence test has been completed. Do not reinterpret data checks as end-to-end testing.

Hosted reference: https://float-lab.ok-frog.chatgpt.site (private). The included local source does not depend on it. No public GitHub repository or downloadable Windows release has been created in this session.

## Uploaded photo evidence

All ten original photos are included under `reference-photos/`. The names retain attachment order. The screenshots show a terminal window within PC•MACs; much of their text is the controller’s own configuration interface. Do not conflate every terminal command with a top-level PC•MACs menu.

| Attached file | Visible subject |
| --- | --- |
| 1000066743.jpg | Main configuration, axis 0 selected, prompt for card address |
| 1000066740.jpg | Close view of control enclosure marked BIG BERTHA; internal wiring and boards |
| 1000066744.jpg | Main configuration, prompt to enter axis 0–3 |
| 1000066739.jpg | Workshop overview: laptop, enclosure, and equipment on table |
| 1000066745.jpg | Main configuration, axis 3 selected, Min Scale shown as 10 |
| 1000066746.jpg | Main configuration, axis 0 selected, axis 3 Min Scale still 10 |
| 1000066747.jpg | Later main configuration: axis 0 Max Scale 147, axis 3 Min Scale 38 |
| 1000066748.jpg | Similar later main configuration view |
| 1000066749.jpg | Feedback/PID menu with P/I/D gains and output reversal |
| 1000066750.jpg | Br-EFB network configuration |

### Identity and addressing visible in screenshots

- Terminal title: Terminal – COM3.
- Header: Gilderfluke & Co. Electronic Feedback Card; version 1.98; copyright 2022.
- Network screen identifies Br-EFB.
- Serial/Card Address: 1.
- First Channel: 6.
- Resolution: 8-bit.
- DMX Rx w/CS; 0-based displayed.
- Axis selector range 0–3.
- Status text: NO ADL FILE.
- Displayed mapping: 6 (0), 7 (1), 8 (2), 9 (3).

COM3 is a serial-port designation on the computer. Card address, DMX address, axis index, and IP address are separate identifiers. The screenshot’s zero-based channel display must be accounted for when comparing it with another tool using a different convention.

### Main configuration snapshot from 1000066747.jpg

These are historical observed settings, not verified current equipment settings and not recommendations:

| Displayed DMX address | Axis | Min Scale | Max Scale | Force Pos | Power Def | Vel Limit |
| --- | --- | --- | --- | --- | --- | --- |
| 6 | 0 | 61 | 147 | 0 | 0 | 3.00 |
| 7 | 1 | 37 | 88 | 0 | 0 | 7.00 |
| 8 | 2 | 59 | 183 | 0 | 0 | 3.00 |
| 9 | 3 | 38 | 135 | 0 | 0 | 6.00 |

Earlier photos show axis 0 Max Scale = 0 rather than 147. Some show axis 3 Min Scale = 10 rather than 38. Preserve these as different snapshots. There is no evidence that all photographed values are correct, safe, or still in use.

Visible menu labels include Card Address, First Channel, Resolution, DMX Rx w/CS, 0-based, axis to modify, Set minimum range, Set maximum range, Force output to value, Set PowerOn Default, Set Velocity Limit, Network Settings, feedback configuration, Next, Last, Info, defaults, loop, Halt, and exit.

### Feedback menu from 1000066749.jpg

| Axis | Displayed DMX address | Prop Gain | Int Gain | Der Gain | Rev Out |
| --- | --- | --- | --- | --- | --- |
| 0 | 6 | 1.000 | 0.000 | 0.000 | Yes |
| 1 | 7 | 3.000 | 0.000 | 0.000 | No |
| 2 | 8 | 1.000 | 0.000 | 0.000 | No |
| 3 | 9 | 2.500 | 0.000 | 0.000 | Yes |

Axis 0 is selected and marked Enabled. Visible controls include proportional gain, integral gain, derivative gain, Reverse Axis Output, Compliance Settings, and More PID Options. Do not generalize axis 0’s enable state to every axis.

### Network screen from 1000066750.jpg

| Field | Photographed value |
| --- | --- |
| DHCP | Disabled |
| IP Address | 192.168.0.10 |
| Netmask | 255.255.255.0 |
| Gateway | 192.168.0.1 |

Confirm/discard controls are visible. The laptop’s IP is not shown. The app uses 192.168.0.20 only as a hypothetical different host on the same /24 subnet, not as a discovered or approved laptop setting. Same-subnet addressing does not prove working wiring, reachability, or a running service. The configured gateway is not proof that a router exists at that address.

## Technical concepts and uncertainty boundaries

- An 8-bit integer has 256 possible values, 0–255. The simple normalized percentage is value / 255 × 100; 128 is approximately 50.2%.
- A number has no built-in physical-distance unit. Calibration and sensor interpretation connect commands/readings to physical travel. Requested position and actual position are different facts.
- The range exercise deliberately assumes a linear 0 cm lower endpoint and a selectable 10, 20, or 40 cm upper endpoint. None of those ranges were measured on the user’s equipment.
- A potentiometer can encode position as a changing resistance ratio/sensed voltage. Which terminals are measured affects the resistance seen. The app has not established the user’s exact sensor model, electrical interface, travel, or wiring.
- The feedback animation moves its displayed actual value a fraction of the remaining gap each tick. It has no mass, friction, valve model, tuning parameters, or overshoot. It is NOT a Br-EFB simulator or a validated PID model.
- Generic PID explanations are introductory concepts. The manufacturer’s particular derivative implementation and tuning behavior must be verified before adding device-specific equations or predictions.
- The exact meaning and units of Velocity Limit on photographed firmware 1.98 remain unresolved. An earlier draft inferred target slew rate; that assertion was removed before publication. Do not reintroduce it as fact. Some controller families use similarly named limits differently.
- Min/Max values in the screenshots are not established centimeters or ohms. Force output is an override operation, not evidence of a mechanical force measurement in newtons. PowerOn Default has device/mode-specific conditions; do not promise a universal startup sequence.
- Output reversal and compliance are conceptual explanations only. Photos do not prove force/pressure feedback sensors are fitted. NO ADL FILE by itself does not identify a fault or prove live commands cannot operate.
- There is no hardware connection code. The app must not send live commands in the educational desktop milestone.

## Next desktop milestone

Use the existing source as a baseline, build a Windows desktop shell, package assets locally, add durable local progress and a resume/restart flow, and prepare a repository with reproducible build commands and a Windows CI artifact workflow. Preserve the small-step teaching loop and improve it iteratively.

The proposed Electron/Forge path minimizes replacement of working UI code. It is not installed here. Verify current official package versions and documentation before implementation. Keep renderer Node integration disabled, enable context isolation and sandboxing, and use narrow IPC only where needed. Handle source links through explicit, restricted system-browser opening. Do not permit arbitrary privileged navigation.

A GitHub source download, a CI build artifact, and a published Windows installer release are different deliverables. Do not claim one when only another exists. Public distribution of team photos and other people’s images needs an intentional audience decision. No license has been selected. Keep credentials and unrelated project files out of the repository.

Do not make progress persistence depend on One File. The learning app should save its own local lesson state; One File is the development/context workspace, not its runtime backend.

## Sources and provenance

User photographs are the source for observed settings. Manufacturer documents are references, not proof that older instructions match firmware 1.98.

- PC•MACs manual: https://gilderfluke.com/wp-content/uploads/2019/11/PCMACs_Manual.pdf — retrieved indexed excerpts identify January 13, 2021 document text on analog/digital channels and editing. Full PDF could not be opened through the web reader due to its size.
- Br-EFB manual: https://gilderfluke.com/wp-content/uploads/2021/01/Br-EFB_manual.pdf — indexed excerpts identify May 22, 2018 manual text on endpoint scaling and proportional feedback. This predates the photographed firmware header. Full PDF was not read end to end.
- Cisco IP addressing: https://www.cisco.com/c/en/us/support/docs/ip/routing-information-protocol-rip/13788-3.html
- Electron security: https://www.electronjs.org/docs/latest/tutorial/security
- Electron sandboxing: https://www.electronjs.org/docs/latest/tutorial/sandbox/
- Electron Forge existing-project setup: https://www.electronforge.io/import-existing-project
- Electron Forge Windows maker: https://www.electronforge.io/config/makers/squirrel.windows

Technical content is an introductory educational synthesis. The source code and curriculum below preserve the actual first version, including limitations. Do not describe it as complete manufacturer training or verified hardware operating instructions.

## Instructions for the next assistant

Read this file and the repository before asking the user to repeat context. Treat the requirements, facts, proposals, and unresolved items as separate categories. Continue the app rather than starting a new unrelated website. Do not infer access to GitHub, One File, a Windows machine, or controller hardware. Use the prompt in `docs/VS_CODE_PROMPT.md` when working in VS Code. Update this handoff when real implementation or validation changes the status.

## Full current curriculum

The following lesson text and answer keys are exported from the delivered prototype. Demos and their full behavior are in `app/app.js`.

### 1. How does a click become movement?

Start with the big picture. Explore the three jobs in a show-control system.

**The plan, the controller, the mechanism**

PC•MACs is where you work with the show. Controller hardware receives commands and interfaces with outputs. An actuator is the part that produces physical movement. Your workshop photo shows the computer beside the control enclosure.

**Simpler explanation:** Think of a performance: the show is the script, the controller follows it, and the mechanism performs the action.

**Remember:** Software, controller, and mechanism have different jobs.

**Demo:** flow · Photo: workshop.jpg

#### Question 1

Which part creates physical movement?

A. The actuator
B. The IP address
C. The timeline grid

**Correct:** A. An actuator turns supplied energy into movement. A timeline describes what should happen.

- If B is selected: An address identifies a network interface; it does not move anything.
- If C is selected: The grid represents timing. The physical mechanism performs the movement.

#### Question 2

You want a movement to happen later in the show. What concept matters?

A. The controller’s network address
B. The timing of the command
C. The color of the enclosure

**Correct:** B. Changing when the command happens changes its place in the sequence.

- If A is selected: An address identifies a destination, not a time.
- If C is selected: The enclosure color does not schedule actions.

### 2. A channel carries one control value.

Try an ON/OFF signal, then a variable level. Notice how many different values each can represent.

**Digital or analog?**

In PC•MACs, a digital channel has two states: on and off. An analog channel carries a variable level, such as a dimming command. “Analog” here describes the control function; show data can still be stored and transmitted digitally.

**Simpler explanation:** A switch has two choices. A dimmer has many levels.

**Remember:** Use ON/OFF for two-state actions; use a variable channel when a level matters.

**Demo:** signals

#### Question 1

Which channel fits a command that must vary from 0% to 100%?

A. An analog channel
B. A digital ON/OFF channel
C. A gateway

**Correct:** A. A variable-level channel can represent intermediate values.

- If B is selected: A single ON/OFF channel cannot directly represent 40% or 70%.
- If C is selected: A gateway routes network traffic.

#### Question 2

An ON/OFF channel is ON. What can you conclude?

A. The mechanism is at 255 cm
B. Its command is in the ON state
C. Its speed is maximum

**Correct:** B. ON tells you the state of that command. Physical behavior depends on the connected equipment.

- If A is selected: A digital state is not a distance.
- If C is selected: ON does not specify a physical speed.

### 3. 255 is a value. It is not a distance.

Your screenshot shows 8-bit resolution. Move the slider and connect the number to a percentage.

**256 possible values**

Eight bits represent 256 integer values, from 0 through 255. For a simple normalized command, percentage = value ÷ 255 × 100. About 128 is halfway. The device and its calibration determine what that command means physically.

**Simpler explanation:** Imagine 256 marks on a slider. The marks tell you where the slider is, not how many centimeters a mechanism travels.

**Remember:** 128 is about 50.2% of an 8-bit range, not automatically 128 cm, volts, or ohms.

**Demo:** value

#### Question 1

How many different values are there from 0 through 255?

A. 255
B. 256
C. 8

**Correct:** B. Count zero too: 255 − 0 + 1 = 256.

- If A is selected: Zero is also a valid value.
- If C is selected: Eight is the number of bits, not the number of possible combinations.

#### Question 2

A command is 128. How far has the mechanism moved?

A. Exactly 128 cm
B. Exactly 5 cm
C. You need the mapping and measured position

**Correct:** C. A command alone does not prove actual travel. You need the calibrated range and feedback.

- If A is selected: The number has no built-in centimeter unit.
- If B is selected: Five centimeters would depend on a specific calibration.

### 4. Card, axis, and channel are different.

Read the labels from your actual screen. Select an axis below and watch which DMX row it points to.

**Three different identifiers**

Your photo shows Card Address 1, First Channel 6, and four axes numbered 0–3. The displayed rows pair 6 with axis 0, 7 with axis 1, 8 with axis 2, and 9 with axis 3. The screen also says “0-based”; keep that numbering convention in mind when comparing displays.

**Simpler explanation:** The card is a controller. The axis is one controlled movement on that card. The channel identifies the command slot for it.

**Remember:** These are the displayed mappings in your photo, not universal settings for every controller.

**Demo:** axis · Photo: controller.jpg

#### Question 1

In this screenshot, which axis is beside displayed channel 8?

A. Axis 0
B. Axis 2
C. Axis 8

**Correct:** B. The row is labeled 8 (2), pairing displayed channel 8 with axis 2.

- If A is selected: Axis 0 is beside 6 in this photo.
- If C is selected: The axis numbers here run from 0 to 3.

#### Question 2

“Terminal – COM3” and “IP Address 192.168.0.10” appear together. Are they the same kind of address?

A. Yes, COM3 means IP ending in .3
B. No, one is a serial-port label and one is an IP address
C. Yes, both are DMX channels

**Correct:** B. COM3 identifies a computer serial port. An IP address belongs to a network interface.

- If A is selected: The number in a COM port label is not an IP octet.
- If C is selected: DMX channel numbering is separate from both.

### 5. The same command can mean a different position.

Change the example’s travel range, then move the command slider. The model assumes linear calibration.

**Give the number a physical meaning**

The Min Scale and Max Scale settings relate command endpoints to actuator travel. In this exercise only, 0 maps to 0 cm and 255 maps to your chosen endpoint. Real calibration may have offsets or reversed direction. Values photographed on your controller are not confirmed centimeter readings.

**Simpler explanation:** Halfway across a 10 cm range is 5 cm. Halfway across a 20 cm range is 10 cm. The command percentage stayed the same.

**Remember:** Calibration connects numbers to a mechanism. Do not copy example ranges onto real equipment.

**Demo:** calibration · Photo: controller.jpg

#### Question 1

In a linear 0–20 cm example, roughly where does command 128 point?

A. About 10 cm
B. 128 cm
C. 20 cm

**Correct:** A. 128 ÷ 255 × 20 is approximately 10.04 cm. This is the target in this example.

- If B is selected: The command is not itself a centimeter measurement.
- If C is selected: 20 cm is the endpoint at command 255.

#### Question 2

Your photo lists Min Scale 61 and Max Scale 147. Can we call those centimeters?

A. Yes, every scale uses centimeters
B. No, the units and calibration must be verified
C. Yes, because 147 is larger

**Correct:** B. The screenshot supplies settings, not their physical units. The controller documentation and team calibration establish their meaning.

- If A is selected: The label does not say cm.
- If C is selected: Relative size does not establish units.

### 6. “Go there” is different from “I am there.”

Set a target, then let the simulated measured position catch up. Watch the error shrink.

**Compare target with measurement**

Feedback reports the measured state. Error is target minus measured position. In a PID controller, P responds to present error, I accumulates error over time, and D responds to how quickly error changes. The animation below is just a simple approach-to-target model, not a Br-EFB or PID simulator.

**Simpler explanation:** You want your hand at a mark. Your eyes tell you where it is now. You adjust until the gap becomes small. A potentiometer is one possible position sensor: motion shifts a contact, changing resistance ratios and the sensed voltage. We have not identified your exact sensor from these photos.

**Remember:** A position command does not prove the actuator reached it. Feedback provides the measurement.

**Demo:** feedback · Photo: feedback.jpg

#### Question 1

Target = 80%, measured position = 30%. What is target minus measured position?

A. 110 percentage points
B. 50 percentage points
C. 30 percentage points

**Correct:** B. 80 − 30 = 50 percentage points of error.

- If A is selected: Subtract measurement from target; do not add them.
- If C is selected: 30% is the measured position, not the gap.

#### Question 2

What does proportional gain respond to in the basic PID idea?

A. The present error
B. The IP address
C. Only elapsed show time

**Correct:** A. The proportional contribution changes with current error. This lesson does not prescribe hardware gain values.

- If B is selected: Network identity is unrelated to this control calculation.
- If C is selected: Elapsed time alone does not tell you current position error.

### 7. A timeline tells the command when to change.

Each block is one second. Turn blocks on or off, then play your eight-second light sequence.

**A value at each moment**

A timeline organizes channel values over time. Here each block stores an ON/OFF command for a one-second interval. Playback reads the blocks in order. A motion timeline can similarly change target position over time, while the controller and mechanism determine the actual response.

**Simpler explanation:** “On” is an action. “On from second 2 to second 4” is a scheduled action.

**Remember:** Time is the horizontal direction. Channel values describe what is commanded at that time.

**Demo:** timeline

#### Question 1

To make the light turn on only during seconds 2–4, which blocks should be ON?

A. Blocks 0, 1, 2, 3
B. Blocks 2 and 3
C. Every block

**Correct:** B. Block 2 covers 2–3 seconds and block 3 covers 3–4 seconds.

- If A is selected: That would start at second 0.
- If C is selected: That would leave the light on for the whole sequence.

#### Question 2

Does an instant target jump guarantee instant physical motion?

A. Yes, software commands have no delay
B. No, actual motion has physical and controller limits
C. Only if the IP ends in .10

**Correct:** B. Mechanisms take time to move. A target change is a request, not proof of instantaneous travel.

- If A is selected: The command can change faster than a mechanism can move.
- If C is selected: An IP address does not set physical speed.

### 8. An address, a boundary, and a way out.

Your network photo shows 192.168.0.10, mask 255.255.255.0, and gateway 192.168.0.1. Try a hypothetical laptop address.

**Three fields, three jobs**

The IP identifies an interface. The mask determines its local subnet. With this /24 mask, 192.168.0 is the network portion and the last octet identifies a host. A gateway routes traffic to other networks. DHCP can supply configuration automatically; your photo shows it disabled.

**Simpler explanation:** IP: your house number. Mask: which neighborhood is local. Gateway: the exit toward other neighborhoods. This is an analogy, not a wiring diagram.

**Remember:** A matching subnet helps local communication; it does not prove cables, ports, or software are working.

**Demo:** network · Photo: network.jpg

#### Question 1

Which hypothetical laptop IP is on the same /24 subnet without duplicating the controller?

A. 192.168.1.20
B. 192.168.0.10
C. 192.168.0.20

**Correct:** C. 192.168.0.20 shares the network portion and has a different host number. This assumes the address is otherwise unused.

- If A is selected: The third octet differs under this /24 mask.
- If B is selected: That duplicates the controller address.

#### Question 2

What is the role of 192.168.0.1 in this photographed configuration?

A. It is the configured gateway
B. It is axis 1
C. It is always the computer’s address

**Correct:** A. It is listed as the gateway. The photo does not tell us the laptop’s own IP.

- If B is selected: Axes and network interfaces use different identifiers.
- If C is selected: The computer’s address is not shown here.

### 9. Read the label before changing the value.

Explore the remaining labels in your photographed main configuration menu.

**Settings affect different behaviors**

Range settings concern endpoints. Velocity Limit is a motion-control setting; its exact implementation and units must be checked for this firmware. Force output to value is a position-command override, not a force measurement in newtons. PowerOn Default concerns startup behavior. Exact units, override release, and special values depend on the controller firmware.

**Simpler explanation:** Where to go, how quickly to get there, and what to do at startup are separate questions.

**Remember:** A zero in a field does not automatically mean “disabled.” Verify the field’s documented meaning.

**Demo:** settings · Photo: controller.jpg

#### Question 1

Does “Force output to value” mean “set mechanical force in newtons”?

A. Yes, that is what Force always means
B. No, it refers to overriding the output command
C. Yes, if the axis is enabled

**Correct:** B. Here “force” is a verb: impose a command value. It is not a physical-force unit.

- If A is selected: Read the full menu action, not just one word.
- If C is selected: Enabling an axis does not change the meaning of this label.

#### Question 2

Which setting is most closely associated with startup behavior?

A. PowerOn Default
B. IP netmask
C. First Channel

**Correct:** A. The label refers to the default at power-on. Confirm the exact behavior for the team’s firmware.

- If B is selected: A netmask defines a network boundary.
- If C is selected: First Channel identifies a starting command address.

### 10. Put the pieces together.

Walk through a simplified diagnosis: the target is halfway, but the reported position stays at zero.

**Separate command from observation**

Start by identifying the intended axis and command. Then compare the requested value with feedback. A mismatch can have several causes: incorrect mapping, disabled output, missing power, a sensor issue, or a mechanical problem. These numbers alone do not establish which cause is responsible.

**Simpler explanation:** If your instruction and the result disagree, find where the chain stops matching. Do not assume the first setting you see is the cause.

**Remember:** Understand the evidence before changing hardware settings. Real movement checks belong with your team’s trained lead.

**Demo:** challenge

#### Question 1

Command is 128 but feedback stays at 0. What do you know?

A. The motor is definitely broken
B. The target and reported position disagree
C. The IP must be wrong

**Correct:** B. You know there is a mismatch. Several different faults or configuration issues could explain it.

- If A is selected: A mismatch alone does not identify the failed component.
- If C is selected: An IP problem is only one possible issue, not a proven diagnosis.

#### Question 2

What is the most useful next step with your team lead?

A. Raise every gain to maximum
B. Copy another axis’s endpoints
C. Verify the intended axis, command path, and feedback together

**Correct:** C. Check the mapping and observations with the lead before making changes. Random tuning can hide the real issue.

- If A is selected: Higher gain is not a universal repair.
- If B is selected: Another axis may have different geometry and calibration.
