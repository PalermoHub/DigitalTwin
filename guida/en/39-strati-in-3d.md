# Layers in 3D and the 3D view of the map

## What «Layers in 3D» is

Keywords: layers in 3D, stack, separate layers, explode, 3D view of the layers, in development, beta, overlapping layers, 3D layers.

Typical questions: What does the «Layers in 3D» button do? Can I see the layers separately, one above the other? Why is it «In development»?

«Layers in 3D» takes the layers that are **on** in the map, "photographs" them one by one in the current view and separates them into a **stack** of overlapping planes, which you turn with the mouse or with a finger. The images come from the map itself: styles, filters and colours are those of the app. The feature carries the label **«In development»**: «Feature in development: it may change and have some rough edges».

The «Layers in 3D» button is in the toolbar (on a smartphone, in the «Layers» sheet). It is off until at least one layer is on; in that case the tooltip says «Turn on at least one layer to see it in 3D». While it prepares the stack, «Preparing the 3D layers… [n] of [tot]» appears. If something goes wrong it says «The 3D layer view did not open: try again».

---

## Which layers end up in the stack

Keywords: planes, maximum number of layers, too many layers on, 3D terrain, base map, other layers.

Typical questions: Why do I not see all my layers? How many layers can I put in? What are «Base map» and «Other layers»?

- One plane for each **layer that is on**, in the drawing order of the map (the first is at the bottom).
- The **base map** is always under everything.
- **«Other layers»**: the visible layers that do not belong to a module of the app, such as those from the RNDT catalogue, from «My layers» or the maps added.
- The **3D relief** and the **elevation** become a single **«3D terrain»** plane at the bottom of the stack, because the coloured elevation has to rest on the relief.
- A plane with nothing to show (a layer outside the view, a service layer) does not enter the stack.

**Limit**: at most **14 planes on a computer and 8 on a smartphone**. If more layers are on, the base, the terrain and those highest in the drawing order remain, and the app warns: «Too many active layers: the 3D view shows the top [n]».

---

## The «Layers in 3D» screen: list and controls

Keywords: stack list, eye, hide in the stack, explode, rotate, from above, in 3D, back to the map, point profile.

Typical questions: How do I hide a layer in the stack? What do Explode, Rotate and From above do? How do I go back to the map?

When the screen opens, the stack rises above the map at the same scale (it looks as if the map itself lifts up). At the top there are the title «Layers in 3D», the «In development» label and the **«Back to the map»** button. You can also leave with **Esc**.

**List of the layers in the stack**: a row of numbered chips, with the last layer at the top as in the stack. Each chip has:
- an **eye** to hide or show the layer **only in the stack** («Hide [name] in the stack» / «Show [name] in the stack again»); while the screen is open a hidden layer is also hidden on the map underneath, so it gives neither a speech bubble nor a profile; on closing it goes back as it was;
- the **name**: one click highlights it.

**Controls** under the list:
- **Explode**: a slider that adjusts the distance between the planes (from 0 to 1.6; it starts at 1).
- **Rotate**: turns the automatic rotation on or off. It starts on, unless the system asks to reduce animations; it stops when you use the stack and resumes after about two and a half seconds without gestures.
- **From above** / **In 3D**: brings the stack to a view from above (flat) and then tilted again; the button changes name accordingly.
- **Step between layers** / **Leave the stack**: see below.

At the bottom the tooltip appears: «Drag to turn, scroll to zoom, right-click to move. Or use the compass and joystick at the bottom left, or the W A S D keys. Press ? for the guide.» The **«How to move» guide** opens by itself only the first time; after that you call it up with the «How to move (?)» button or with the ? key. It closes with «Got it» or Esc.

---

## Profile and speech bubbles inside the stack

Keywords: click on a point, profile inside the stack, tooltip, edge of a layer, pin, everything under a point.

Typical questions: Can I open the profile of a point from the stack? What do I see when I hover with the mouse? How do I choose a layer?

- A **click on a point** of a layer opens the profile of that point, above the scene, staying in 3D. The layers are queried in order: the one touched, then those below, then those above. The profile opens on the tab of the layer touched.
- A **click on the edge of a layer** chooses it («[name]: click to pick it, again to step in (from inside: to go there)»).
- On the point clicked a **pin** appears that crosses the stack, with a dot on each layer.
- When you hover with the mouse a **speech bubble** appears as on the 2D map, with the same tooltip templates of the app: for each layer that has something at that point, the title and the attributes. It shows at most 3 items per layer and then «+ [n] more». The layer under the mouse is on top and highlighted. For cadastral parcels it writes «Sheet [n], parcel [n]».

---

## Stepping between layers and walking

Keywords: step between layers, gap, walk, on the layer, look up, look down, go down one layer, go up one layer, Page Up Page Down.

Typical questions: What does «Step between layers» mean? How do I move from one layer to another? How do I walk on the layer?

With **«Step between layers»** the eye goes into a **gap** between two planes and you can look down, up and around. The label says where you are: «Between [layer below] and [layer above]».

Controls from inside:
- **Go down one layer** / **Go up one layer** (also Page Down and Page Up).
- **Look down** / **Look up**.
- **Walk**: «Walk on the layer below you, looking ahead». You stand on the plane («On layer [n]») and with the controls **Go down to the layer below** / **Go up to the layer above** you change plane.
- The Esc key or **«Leave the stack»** take you back out.

The app's tooltips: «You are between two layers: drag sideways to turn the model, up or down to look above or below. Joystick or W/S to move, scroll to zoom, Page Up and Page Down to change gap.» and, while walking: «You are walking on the layer: hold W/S (or the joystick) to go forward and back, A/D to turn, Q/E to side-step. Drag to look around, scroll to zoom.»

---

## Controls: mouse, keyboard, touch

Keywords: 3D controls, W A S D, wheel, right button, compass, joystick, zoom, tilt, touch, two fingers.

Typical questions: Which keys do I use to move? How do I move the stack? How do I use 3D on a phone?

**Mouse**
- Drag: turns the model; while walking, you look around.
- Right button, or Shift + drag: move.
- Wheel: zoom; from inside, backwards until you leave.
- Click on a point: its profile; on the edge of a layer: chooses it.

**Keyboard**
- W S or ↑ ↓: forward and back, while held.
- A D or ← →: turn; Q E: side-step.
- R F or Shift + ↑ ↓: tilt; + and −: zoom.
- Page Up / Page Down: layer above or below; ? guide; Esc leaves.

**Touch and navigator**
- One finger turns; two fingers zoom and move.
- **Compass** (bottom left): drag the ring to turn, one click goes back to north.
- **Joystick**: drag the knob to move, the farther from the centre the faster.
- **+ / −** buttons (zoom in and out) and tilt up/down: hold them down. «Back to the centre» resets the view. «How to move (?)» opens the guide.

---

## The 3D view of the map («3D view» button)

Keywords: 3D view, tilt the map, 3D navigator, compass, joystick, W A S D, Q E, R F, right button.

Typical questions: How do I tilt the map? What changes with the 3D view? How do I move?

The **«3D view»** button in the toolbar tilts the real map (not the stack). Only in this view does the **navigator** appear at the bottom left, with compass, joystick, zoom and tilt, the same as in the stack. The tilt goes up to 65°.

Controls of the guide «How to move in the 3D view»:
- **Mouse**: dragging moves the map; right button + drag rotates and tilts; wheel zooms; a click on a feature opens its profile.
- **Keyboard**: W A S D move the map, while held; Q E turn left and right; R F tilt; + and − zoom; ? opens the guide, Esc closes it.
- **Touch**: one finger moves; two fingers zoom, rotate and tilt; compass and joystick as above.

In 3D view the **«3D buildings»** layer extrudes the buildings and the **3D relief** shows the terrain (see `03-edifici-e-popolazione.md` and `02-territorio-e-urbanistica.md`).

---

## The layers in 3D on the presentation page

Keywords: 3D presentation, all the layers in 3D, fifteen layers, demonstration model.

Typical questions: Is there a demo of the layers in 3D? Where do I find it?

The **Presentation** page of the menu has a section «All the layers, in 3D»: «The map's fifteen layers, pulled apart one above the other: turn them with the mouse or a finger, tap a layer in the list to highlight it. In the app you do it with your own active layers, from the «Layers in 3D» button.» It has the controls Explode, Rotate, From above / In 3D, Zoom in and Zoom out. Dragging turns it, the wheel with Ctrl zooms, the keyboard arrows rotate and tilt. It needs JavaScript.
