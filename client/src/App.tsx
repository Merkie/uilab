import { createId } from "@paralleldrive/cuid2";
import { batch, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { Dynamic } from "solid-js/web";

type ElementState = {
  rect: { x: number; y: number; width: number; height: number; zIndex: number };
  props: { color: string };
};

type StageState = {
  elements: Record<string, ElementState>;
  cursors: Record<string, { x: number; y: number }>;
  selectionBoxes: Record<
    string,
    { x: number; y: number; width: number; height: number; hidden: boolean }
  >;
  selectedElements: Record<string, string[]>;
};

// A more specific type for what is being dragged
type DragTarget = {
  type: string;
  initialRects?: Map<string, ElementState["rect"]>;
  elementId?: string;
  resizeDir?: string;
  initialRect?: ElementState["rect"];
};

function App() {
  return (
    <Stage
      class="w-full h-screen"
      initialState={{
        elements: {
          foo: {
            rect: { x: 43, y: 21, width: 100, height: 100, zIndex: 1 },
            props: { color: "blue" },
          },
          bar: {
            rect: { x: 26, y: 84, width: 100, height: 100, zIndex: 2 },
            props: { color: "red" },
          },
        },
      }}
    />
  );
}

export default App;

const [state, setState] = createStore<StageState>({
  elements: {},
  cursors: {},
  selectionBoxes: {},
  selectedElements: {},
});

function Stage({
  class: className,
  initialState,
}: {
  class?: string;
  initialState?: Partial<StageState>;
}) {
  onMount(() => {
    if (initialState?.elements)
      setState("elements", initialState?.elements || {});
  });

  let stageRef: HTMLDivElement | undefined;
  const clientId = createId();

  const [camera, setCamera] = createSignal({ x: 0, y: 0 });

  const [dragStart, setDragStart] = createSignal<
    { mouseX: number; mouseY: number; target: DragTarget } | undefined
  >(undefined);

  const [panning, setPanning] = createSignal(false);

  function getResizeCursor(resizeDir: string | undefined) {
    if (!resizeDir) return "default";
    if (resizeDir === "top left" || resizeDir === "bottom right")
      return "nwse-resize";
    if (resizeDir === "top right" || resizeDir === "bottom left")
      return "nesw-resize";
    return "default";
  }

  function onMouseDown(event: MouseEvent) {
    if (event.button === 1) {
      event.preventDefault();
      setPanning(true);
    }

    const target = event.target as HTMLElement;
    const resizeDir = target.getAttribute("data-resize-dir");
    const elementIdAttr = target.getAttribute("data-element-id");

    // Check for resize handle click first
    if (resizeDir && elementIdAttr && state.elements[elementIdAttr]) {
      event.stopPropagation(); // Prevent this from triggering an element drag
      setDragStart({
        mouseX: event.clientX,
        mouseY: event.clientY,
        target: {
          type: "resize",
          elementId: elementIdAttr,
          resizeDir,
          initialRect: { ...state.elements[elementIdAttr].rect },
        },
      });
      return;
    }

    // Then check for element click
    const elementId = target.getAttribute("data-element-id");
    if (elementId && state.elements[elementId]) {
      batch(() => {
        if (!state.selectedElements[clientId]?.includes(elementId)) {
          setState("selectedElements", clientId, [elementId]);
          const maxZ = Math.max(
            0,
            ...Object.values(state.elements).map((el) => el.rect.zIndex)
          );
          setState("elements", elementId, "rect", "zIndex", maxZ + 1);
        }

        const initialRects = new Map<string, ElementState["rect"]>();
        for (const id of state.selectedElements[clientId]) {
          initialRects.set(id, { ...state.elements[id].rect });
        }

        setDragStart({
          mouseX: event.clientX,
          mouseY: event.clientY,
          target: { type: "elements", initialRects },
        });
      });
    } else if (stageRef?.contains(target)) {
      setState("selectedElements", clientId, []);
      setDragStart({
        mouseX: event.clientX,
        mouseY: event.clientY,
        target: { type: "stage" },
      });
    }
  }

  function onMouseMove(event: MouseEvent) {
    const currentCamera = camera();
    const worldX = event.clientX - currentCamera.x;
    const worldY = event.clientY - currentCamera.y;
    setState("cursors", clientId, { x: worldX, y: worldY });

    const dragStartValue = dragStart();
    if (!dragStartValue) return;

    if (panning()) {
      setCamera((prev) => ({
        x: prev.x + event.movementX,
        y: prev.y + event.movementY,
      }));
      return;
    }

    const dx = event.clientX - dragStartValue.mouseX;
    const dy = event.clientY - dragStartValue.mouseY;

    if (dragStartValue.target.type === "resize") {
      const { elementId, resizeDir, initialRect } = dragStartValue.target;
      if (!elementId || !resizeDir || !initialRect) return;
      let { x, y, width, height } = initialRect;

      const MIN_SIZE = 20;

      // Calculate new dimensions based on direction
      if (resizeDir.includes("right")) {
        width = Math.max(MIN_SIZE, initialRect.width + dx);
      } else if (resizeDir.includes("left")) {
        width = Math.max(MIN_SIZE, initialRect.width - dx);
      }

      if (resizeDir.includes("bottom")) {
        height = Math.max(MIN_SIZE, initialRect.height + dy);
      } else if (resizeDir.includes("top")) {
        height = Math.max(MIN_SIZE, initialRect.height - dy);
      }

      // Handle aspect ratio preservation on shift key
      if (event.shiftKey) {
        const aspectRatio = initialRect.width / initialRect.height;
        const widthChange = Math.abs(width - initialRect.width);
        const heightChange = Math.abs(height - initialRect.height);

        if (widthChange > heightChange * aspectRatio) {
          height = width / aspectRatio;
        } else {
          width = height * aspectRatio;
        }
      }

      // Reposition for left and top handles after dimensions are set
      if (resizeDir.includes("left")) {
        x = initialRect.x + initialRect.width - width;
      }
      if (resizeDir.includes("top")) {
        y = initialRect.y + initialRect.height - height;
      }

      setState("elements", elementId, "rect", (prev) => ({
        ...prev,
        x,
        y,
        width,
        height,
      }));
    } else if (dragStartValue.target.type === "elements") {
      batch(() => {
        for (const [
          selectedId,
          initialRect,
        ] of dragStartValue.target.initialRects!.entries()) {
          setState("elements", selectedId, "rect", (prev) => ({
            ...prev,
            x: initialRect.x + dx,
            y: initialRect.y + dy,
          }));
        }
      });
    } else if (dragStartValue.target.type === "stage") {
      const startWorldX = dragStartValue.mouseX - currentCamera.x;
      const startWorldY = dragStartValue.mouseY - currentCamera.y;
      setState(
        "selectionBoxes",
        produce((selectionBoxes) => {
          selectionBoxes[clientId] = {
            x: Math.min(startWorldX, worldX),
            y: Math.min(startWorldY, worldY),
            width: Math.abs(worldX - startWorldX),
            height: Math.abs(worldY - startWorldY),
            hidden: false,
          };
        })
      );
    }
  }

  function onMouseUp(event: MouseEvent) {
    if (event.button === 1) setPanning(false);
    setDragStart(undefined);

    if (
      state.selectionBoxes[clientId] &&
      !state.selectionBoxes[clientId].hidden
    ) {
      const box = state.selectionBoxes[clientId];
      const selectedElements = Object.entries(state.elements)
        .filter(([_, element]) => {
          const rect = element.rect;
          return (
            rect.x < box.x + box.width &&
            rect.x + rect.width > box.x &&
            rect.y < box.y + box.height &&
            rect.y + rect.height > box.y
          );
        })
        .map(([id]) => id);
      setState("selectedElements", clientId, selectedElements);
      setState("selectionBoxes", clientId, "hidden", true);
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === " " && !panning()) {
      event.preventDefault();
      setPanning(true);
    }
  }

  function onKeyUp(event: KeyboardEvent) {
    if (event.key === " ") setPanning(false);
  }

  onMount(() => {
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
  });

  onCleanup(() => {
    document.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
  });

  return (
    <>
      <main
        ref={stageRef}
        class={`stage ${className}`}
        style={{
          cursor:
            dragStart()?.target.type === "resize"
              ? getResizeCursor(dragStart()?.target.resizeDir)
              : panning()
              ? dragStart()
                ? "grabbing"
                : "grab"
              : "default",
          "--camera-x": `${camera().x}px`,
          "--camera-y": `${camera().y}px`,
          "background-position": `var(--camera-x) var(--camera-y)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "0",
            top: "0",
            width: "100%",
            height: "100%",
            transform: `translate(var(--camera-x), var(--camera-y))`,
          }}
        >
          <For each={Object.entries(state.elements)}>
            {([id, element]) => (
              <div
                data-element-id={id}
                style={{
                  position: "absolute",
                  "z-index": element.rect.zIndex,
                  left: `${element.rect.x}px`,
                  top: `${element.rect.y}px`,
                  width: `${element.rect.width}px`,
                  height: `${element.rect.height}px`,
                  "pointer-events":
                    state.selectionBoxes[clientId]?.hidden === false
                      ? "none"
                      : "auto",
                }}
              >
                <Dynamic component={TestElement} elementId={id} />
                <Show when={state.selectedElements[clientId]?.includes(id)}>
                  <div class="w-full h-full absolute top-0 pointer-events-none left-0 border border-sky-500">
                    <div
                      data-element-id={id}
                      data-resize-dir="top left"
                      class="w-[8px] h-[8px] bg-white absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2 border border-sky-500"
                      style={{ "pointer-events": "all", cursor: "nwse-resize" }}
                    />
                    <div
                      data-element-id={id}
                      data-resize-dir="top right"
                      class="w-[8px] h-[8px] bg-white absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 border border-sky-500"
                      style={{ "pointer-events": "all", cursor: "nesw-resize" }}
                    />
                    <div
                      data-element-id={id}
                      data-resize-dir="bottom left"
                      class="w-[8px] h-[8px] bg-white absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 border border-sky-500"
                      style={{ "pointer-events": "all", cursor: "nesw-resize" }}
                    />
                    <div
                      data-element-id={id}
                      data-resize-dir="bottom right"
                      class="w-[8px] h-[8px] bg-white absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2 border border-sky-500"
                      style={{ "pointer-events": "all", cursor: "nwse-resize" }}
                    />
                  </div>
                </Show>
              </div>
            )}
          </For>
          <For each={Object.entries(state.selectionBoxes)}>
            {([_, box]) => (
              <div
                class="bg-sky-500/10 border border-sky-500"
                style={{
                  left: `${box.x}px`,
                  top: `${box.y}px`,
                  width: `${box.width}px`,
                  height: `${box.height}px`,
                  display: box.hidden ? "none" : "block",
                  position: "absolute",
                  "z-index": 99999,
                }}
              />
            )}
          </For>
        </div>
      </main>
    </>
  );
}

function TestElement({ elementId }: { elementId: string }) {
  const element = state.elements[elementId];
  return (
    <div
      style={{
        "background-color": element.props.color,
      }}
      class="border pointer-events-none absolute w-full h-full top-0 left-0 grid place-items-center"
    >
      <button class="border text-white active:bg-white cursor-pointer pointer-events-auto">
        {elementId}
      </button>
    </div>
  );
}
