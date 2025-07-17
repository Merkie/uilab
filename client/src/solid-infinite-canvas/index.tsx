import { createId } from "@paralleldrive/cuid2";
import {
  batch,
  createContext,
  createEffect,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
  useContext,
  ParentComponent,
  Accessor,
  Setter,
  ValidComponent,
  Component,
} from "solid-js";
import { createStore, SetStoreFunction, Store } from "solid-js/store";
import { Dynamic } from "solid-js/web";
import gsap from "gsap";

// --- STATE AND TYPE DEFINITIONS ---

type ElementState = {
  type: string;
  rect: { x: number; y: number; width: number; height: number; zIndex: number };
  props: Record<string, any>;
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

type DragTarget = {
  type: string;
  initialRects?: Map<string, ElementState["rect"]>;
  elementId?: string;
  resizeDir?: string;
  initialRect?: ElementState["rect"];
};

type RenderableElements = Record<string, ValidComponent>;

// --- CONTEXT FOR STATE ENCAPSULATION ---

type StageContextType = {
  state: Store<StageState>;
  setState: SetStoreFunction<StageState>;
  clientId: string;
  camera: Accessor<{ x: number; y: number; zoom: number }>;
  setCamera: Setter<{ x: number; y: number; zoom: number }>;
  mousePosition: Accessor<{ x: number; y: number }>;
  setMousePosition: Setter<{ x: number; y: number }>;
  dragStart: Accessor<
    { stageX: number; stageY: number; target: DragTarget } | undefined
  >;
  setDragStart: Setter<
    { stageX: number; stageY: number; target: DragTarget } | undefined
  >;
  panning: Accessor<boolean>;
  setPanning: Setter<boolean>;
  renderableElements: RenderableElements;
};

export type ElementRendererComponent = Component<{
  elementId: string;
  renderableElements: RenderableElements;
}>;

export type CanvasElementComponent = Component<{
  elementId: string;
  element: ElementState;
}>;

const StageContext = createContext<StageContextType>();

const StageProvider: ParentComponent<{
  initialState?: Partial<StageState>;
  renderableElements: RenderableElements;
}> = (props) => {
  const [state, setState] = createStore<StageState>({
    elements: {},
    cursors: {},
    selectionBoxes: {},
    selectedElements: {},
  });

  onMount(() => {
    if (props.initialState?.elements)
      setState("elements", props.initialState.elements);
  });

  const clientId = createId();
  const [camera, setCamera] = createSignal({ x: 0, y: 0, zoom: 1 });
  const [mousePosition, setMousePosition] = createSignal({ x: 0, y: 0 });
  const [dragStart, setDragStart] = createSignal<
    { stageX: number; stageY: number; target: DragTarget } | undefined
  >(undefined);
  const [panning, setPanning] = createSignal(false);

  const store: StageContextType = {
    state,
    setState,
    clientId,
    camera,
    setCamera,
    mousePosition,
    setMousePosition,
    dragStart,
    setDragStart,
    panning,
    setPanning,
    renderableElements: props.renderableElements,
  };

  return (
    <StageContext.Provider value={store}>
      {props.children}
    </StageContext.Provider>
  );
};

export const useStage = () => {
  const context = useContext(StageContext);
  if (!context) {
    throw new Error("useStage must be used within a StageProvider");
  }
  return context;
};

// --- STAGE COMPONENT ---

export const Stage: Component<{
  class?: string;
  initialState?: Partial<StageState>;
  renderableElements: RenderableElements;
}> = (props) => {
  return (
    <StageProvider
      initialState={props.initialState}
      renderableElements={props.renderableElements}
    >
      <StageCanvas class={props.class} />
    </StageProvider>
  );
};

function StageCanvas(props: { class?: string }) {
  const {
    state,
    setState,
    clientId,
    camera,
    setCamera,
    setMousePosition,
    dragStart,
    setDragStart,
    panning,
    setPanning,
    renderableElements,
  } = useStage();

  let stageRef: HTMLDivElement | undefined;
  let viewRef: HTMLDivElement | undefined;

  const getStageCoordinates = (event: MouseEvent) => {
    if (!stageRef) return { x: 0, y: 0 };
    const rect = stageRef.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  function getResizeCursor(resizeDir: string | undefined) {
    if (!resizeDir) return "default";
    if (resizeDir === "top left" || resizeDir === "bottom right")
      return "nwse-resize";
    if (resizeDir === "top right" || resizeDir === "bottom left")
      return "nesw-resize";
    return "default";
  }

  function onMouseDown(event: MouseEvent) {
    const { x: stageX, y: stageY } = getStageCoordinates(event);

    if (event.button === 1 || (event.button === 0 && panning())) {
      event.preventDefault();
      setPanning(true);
    }

    const target = event.target as HTMLElement;
    const elementIdAttr = target.getAttribute("data-element-id");
    const resizeDir = target.getAttribute("data-resize-dir");

    if (resizeDir && elementIdAttr && state.elements[elementIdAttr]) {
      event.stopPropagation();
      setDragStart({
        stageX,
        stageY,
        target: {
          type: "resize",
          elementId: elementIdAttr,
          resizeDir,
          initialRect: { ...state.elements[elementIdAttr].rect },
        },
      });
    } else if (elementIdAttr && state.elements[elementIdAttr]) {
      batch(() => {
        if (!state.selectedElements[clientId]?.includes(elementIdAttr)) {
          setState("selectedElements", clientId, [elementIdAttr]);
          const maxZ = Math.max(
            0,
            ...Object.values(state.elements).map((el) => el.rect.zIndex)
          );
          setState("elements", elementIdAttr, "rect", "zIndex", maxZ + 1);
        }

        const initialRects = new Map<string, ElementState["rect"]>();
        for (const id of state.selectedElements[clientId]!) {
          initialRects.set(id, { ...state.elements[id].rect });
        }

        setDragStart({
          stageX,
          stageY,
          target: { type: "elements", initialRects },
        });
      });
    } else if (stageRef === target) {
      setState("selectedElements", clientId, []);
      setDragStart({ stageX, stageY, target: { type: "stage" } });
    }

    if (dragStart()) {
      window.addEventListener("mousemove", onWindowMouseMove);
      window.addEventListener("mouseup", onWindowMouseUp);
    }
  }

  function onMouseMove(event: MouseEvent) {
    const { x: stageX, y: stageY } = getStageCoordinates(event);
    setMousePosition({ x: stageX, y: stageY });

    if (dragStart()) return;

    const currentCamera = camera();
    const worldX = (stageX - currentCamera.x) / currentCamera.zoom;
    const worldY = (stageY - currentCamera.y) / currentCamera.zoom;
    setState("cursors", clientId, { x: worldX, y: worldY });
  }

  function onWindowMouseMove(event: MouseEvent) {
    const dragStartValue = dragStart();
    if (!dragStartValue) return;

    const { x: stageX, y: stageY } = getStageCoordinates(event);
    const currentCamera = camera();

    if (panning()) {
      setCamera((prev) => ({
        ...prev,
        x: prev.x + event.movementX,
        y: prev.y + event.movementY,
      }));
      return;
    }

    const worldX = (stageX - currentCamera.x) / currentCamera.zoom;
    const worldY = (stageY - currentCamera.y) / currentCamera.zoom;
    setState("cursors", clientId, { x: worldX, y: worldY });

    const dx = (stageX - dragStartValue.stageX) / currentCamera.zoom;
    const dy = (stageY - dragStartValue.stageY) / currentCamera.zoom;

    if (dragStartValue.target.type === "resize") {
      const { elementId, resizeDir, initialRect } = dragStartValue.target;
      if (!elementId || !resizeDir || !initialRect) return;
      let { x, y, width, height } = initialRect;

      const MIN_SIZE = 20 / currentCamera.zoom;

      if (resizeDir.includes("right"))
        width = Math.max(MIN_SIZE, initialRect.width + dx);
      if (resizeDir.includes("left"))
        width = Math.max(MIN_SIZE, initialRect.width - dx);
      if (resizeDir.includes("bottom"))
        height = Math.max(MIN_SIZE, initialRect.height + dy);
      if (resizeDir.includes("top"))
        height = Math.max(MIN_SIZE, initialRect.height - dy);

      if (event.shiftKey) {
        const aspectRatio = initialRect.width / initialRect.height;
        if (Math.abs(dx) > Math.abs(dy)) {
          height = width / aspectRatio;
        } else {
          width = height * aspectRatio;
        }
      }

      if (resizeDir.includes("left"))
        x = initialRect.x + initialRect.width - width;
      if (resizeDir.includes("top"))
        y = initialRect.y + initialRect.height - height;

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
          id,
          initialRect,
        ] of dragStartValue.target.initialRects!.entries()) {
          setState("elements", id, "rect", (prev) => ({
            ...prev,
            x: initialRect.x + dx,
            y: initialRect.y + dy,
          }));
        }
      });
    } else if (dragStartValue.target.type === "stage") {
      const startWorldX =
        (dragStartValue.stageX - currentCamera.x) / currentCamera.zoom;
      const startWorldY =
        (dragStartValue.stageY - currentCamera.y) / currentCamera.zoom;
      setState("selectionBoxes", clientId, {
        x: Math.min(startWorldX, worldX),
        y: Math.min(startWorldY, worldY),
        width: Math.abs(worldX - startWorldX),
        height: Math.abs(worldY - startWorldY),
        hidden: false,
      });
    }
  }

  function onWindowMouseUp(event: MouseEvent) {
    if (event.button === 1 || panning()) setPanning(false);

    const selectionBox = state.selectionBoxes[clientId];
    if (
      dragStart()?.target.type === "stage" &&
      selectionBox &&
      !selectionBox.hidden
    ) {
      const selected = Object.entries(state.elements)
        .filter(([_, el]) => {
          const rect = el.rect;
          return (
            rect.x < selectionBox.x + selectionBox.width &&
            rect.x + rect.width > selectionBox.x &&
            rect.y < selectionBox.y + selectionBox.height &&
            rect.y + rect.height > selectionBox.y
          );
        })
        .map(([id]) => id);
      setState("selectedElements", clientId, selected);
      setState("selectionBoxes", clientId, "hidden", true);
    }

    setDragStart(undefined);
    window.removeEventListener("mousemove", onWindowMouseMove);
    window.removeEventListener("mouseup", onWindowMouseUp);
  }

  function handleZoom(delta: number, stageX: number, stageY: number) {
    const currentCamera = camera();
    const targetZoom = Math.max(0.1, Math.min(currentCamera.zoom * delta, 10));

    if (targetZoom === currentCamera.zoom) return;

    gsap.killTweensOf(currentCamera);

    const mouseWorldX = (stageX - currentCamera.x) / currentCamera.zoom;
    const mouseWorldY = (stageY - currentCamera.y) / currentCamera.zoom;
    const targetX = stageX - mouseWorldX * targetZoom;
    const targetY = stageY - mouseWorldY * targetZoom;

    gsap.to(currentCamera, {
      duration: 0.2,
      ease: "power2.out",
      x: targetX,
      y: targetY,
      zoom: targetZoom,
      onUpdate: () => {
        setCamera({
          x: currentCamera.x,
          y: currentCamera.y,
          zoom: currentCamera.zoom,
        });
      },
    });
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      const zoomFactor = event.deltaY > 0 ? 1 / 1.1 : 1.1;
      const { x, y } = getStageCoordinates(event);
      handleZoom(zoomFactor, x, y);
    } else {
      setCamera((prev) => ({
        ...prev,
        x: prev.x - event.deltaX,
        y: prev.y - event.deltaY,
      }));
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === " " && !panning() && !dragStart()) {
      event.preventDefault();
      setPanning(true);
    }

    if (
      (event.metaKey || event.ctrlKey) &&
      (event.key === "=" || event.key === "-")
    ) {
      event.preventDefault();
      const zoomDirection = event.key === "=" ? 1.2 : 1 / 1.2;
      const centerOfStage = {
        x: stageRef!.clientWidth / 2,
        y: stageRef!.clientHeight / 2,
      };
      handleZoom(zoomDirection, centerOfStage.x, centerOfStage.y);
    }
  }

  function onKeyUp(event: KeyboardEvent) {
    if (event.key === " ") setPanning(false);
  }

  onMount(() => {
    if (!stageRef) return;
    stageRef.addEventListener("mousedown", onMouseDown);
    stageRef.addEventListener("mousemove", onMouseMove);
    stageRef.addEventListener("keydown", onKeyDown);
    stageRef.addEventListener("keyup", onKeyUp);
    stageRef.addEventListener("wheel", onWheel, { passive: false });
  });

  onCleanup(() => {
    if (!stageRef) return;
    stageRef.removeEventListener("mousedown", onMouseDown);
    stageRef.removeEventListener("mousemove", onMouseMove);
    stageRef.removeEventListener("keydown", onKeyDown);
    stageRef.removeEventListener("keyup", onKeyUp);
    stageRef.removeEventListener("wheel", onWheel);
    window.removeEventListener("mousemove", onWindowMouseMove);
    window.removeEventListener("mouseup", onWindowMouseUp);
  });

  createEffect(() => {
    const cam = camera();
    if (viewRef) {
      viewRef.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.zoom})`;
    }
    if (stageRef) {
      stageRef.style.backgroundPosition = `${cam.x}px ${cam.y}px`;
      stageRef.style.backgroundSize = `${40 * cam.zoom}px ${40 * cam.zoom}px`;
    }
  });

  return (
    <main
      ref={stageRef}
      tabindex="0"
      class={`stage ${props.class} focus:outline-none focus:ring-2 focus:ring-sky-500`}
      style={{
        "background-position": `${camera().x}px ${camera().y}px`,
        "background-size": `${40 * camera().zoom}px ${40 * camera().zoom}px`,
        cursor:
          dragStart()?.target.type === "resize"
            ? getResizeCursor(dragStart()?.target.resizeDir)
            : panning()
            ? "grabbing"
            : "default",
      }}
    >
      <div
        ref={viewRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          "pointer-events": "none",
          // THIS IS THE FIX 👇
          "transform-origin": "0 0",
        }}
      >
        <For each={Object.entries(state.elements)}>
          {([id, element]) => (
            <div
              data-element-id={id}
              style={{
                position: "absolute",
                "z-index": element.rect.zIndex,
                transform: `translate(${element.rect.x}px, ${element.rect.y}px)`,
                width: `${element.rect.width}px`,
                height: `${element.rect.height}px`,
                "pointer-events":
                  state.selectionBoxes[clientId]?.hidden === false
                    ? "none"
                    : "auto",
              }}
            >
              <Dynamic
                component={ElementRenderer}
                elementId={id}
                renderableElements={renderableElements}
              />
            </div>
          )}
        </For>
        <For each={Object.entries(state.selectionBoxes)}>
          {([ownerId, box]) => (
            <Show when={ownerId === clientId}>
              <div
                class="bg-sky-500/10 border border-sky-500"
                style={{
                  transform: `translate(${box.x}px, ${box.y}px)`,
                  width: `${box.width}px`,
                  height: `${box.height}px`,
                  display: box.hidden ? "none" : "block",
                  position: "absolute",
                  "z-index": 99999,
                }}
              />
            </Show>
          )}
        </For>
      </div>
    </main>
  );
}

const ElementRenderer: ElementRendererComponent = (props) => {
  const { state } = useStage();
  const element = state.elements[props.elementId];

  return (
    <Show when={element}>
      <For each={Object.entries(props.renderableElements)}>
        {([type, el]) => (
          <Show when={element.type === type}>
            <Dynamic
              component={el}
              elementId={props.elementId}
              element={element}
            />
          </Show>
        )}
      </For>
    </Show>
  );
};

export const ElementTransformControls: Component<{ elementId: string }> = (
  props
) => {
  const { state, clientId } = useStage();
  return (
    <Show when={state.selectedElements[clientId]?.includes(props.elementId)}>
      <div class="w-full h-full absolute top-0 pointer-events-none left-0 border border-sky-500">
        <div
          data-element-id={props.elementId}
          data-resize-dir="top left"
          class="w-[8px] h-[8px] bg-white absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2 border border-sky-500"
          style={{ "pointer-events": "all", cursor: "nwse-resize" }}
        />
        <div
          data-element-id={props.elementId}
          data-resize-dir="top right"
          class="w-[8px] h-[8px] bg-white absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 border border-sky-500"
          style={{ "pointer-events": "all", cursor: "nesw-resize" }}
        />
        <div
          data-element-id={props.elementId}
          data-resize-dir="bottom left"
          class="w-[8px] h-[8px] bg-white absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 border border-sky-500"
          style={{ "pointer-events": "all", cursor: "nesw-resize" }}
        />
        <div
          data-element-id={props.elementId}
          data-resize-dir="bottom right"
          class="w-[8px] h-[8px] bg-white absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2 border border-sky-500"
          style={{ "pointer-events": "all", cursor: "nwse-resize" }}
        />
      </div>
    </Show>
  );
};
