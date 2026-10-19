# Street View

## How Street View works

Keywords: Street View, pegman, little man, panorama, Google Maps, blue cone, viewing direction, window, street at eye level, Google account.

Typical questions: How do I see a street at eye level? How do I choose the direction? Why is the window empty? Do I need a Google account?

The button with the little man (**«Street View: press a point and drag to pick the direction»**) is in the toolbar at the top right. Once pressed, the tool is active: the button appears pressed, the cursor becomes a **crosshair** and the map no longer moves when dragged. The tooltip becomes «Street View on: press a point and drag, Esc to exit».

**How to use it**
1. You **press** on the point of the map that interests you (mouse or finger).
2. **Keeping it pressed**, you drag to choose the direction of the view: a **blue cone** 90° wide appears, showing where the panorama will look. The direction takes into account any rotation of the map.
3. On **release** the window with the panorama opens.

If the drag is less than about 6 pixels it is a simple click: the panorama opens without a direction chosen (it looks north). With two fingers on the screen the gesture does not start.

**The window**
- It is a floating, non-modal window: the map stays visible.
- It is **moved** by dragging the bar at the top and **resized** from the corner. It remembers its position for the next opening.
- It contains the Google Street View panorama of the point. The **«Open in Google Maps ↗»** link in the bar opens it full screen in a new tab; the **✕** button («Close») closes it. Opening a new panorama closes the previous one.
- No API key and no Google account is needed.

**Leaving the tool**: **Esc** or a new click on the button. The cone and the point disappear and the map can be dragged again.

**Limits**: where Google has no images the window stays empty or shows the nearest panorama. The panorama is an external Google service and is not part of the map data: when it opens, the browser contacts Google's servers (see `51-pagine-privacy-lingua-e-offline.md`).
