import { onMount } from "solid-js";
import {
  CanvasElementComponent,
  createStageContext,
  ElementTransformControls,
  Stage,
  useStage,
} from "./solid-infinite-canvas";

const CircleElement: CanvasElementComponent = ({ element, elementId }) => {
  const { setState } = useStage();

  return (
    <>
      <div
        style={{
          "background-color": element.props.color,
        }}
        class="border absolute w-full h-full top-0 left-0 rounded-full grid place-items-center text-center text-white text-xl"
        onClick={() => {
          setState(
            "elements",
            elementId,
            "props",
            "count",
            (c) => (c || 0) + 1
          );
        }}
      >
        <div
          style={{
            "text-shadow": "1px 1px 2px black",
          }}
          class="pointer-events-none select-none"
        >
          {element.props.count}
        </div>
      </div>
      <ElementTransformControls elementId={elementId} />
    </>
  );
};

const RectangleElement: CanvasElementComponent = ({ element, elementId }) => {
  const { setState } = useStage();
  return (
    <>
      <div
        style={{
          "background-color": element.props.color,
        }}
        class="border absolute w-full h-full top-0 left-0 grid place-items-center text-center text-white text-xl"
        onClick={() => {
          const colors =
            "red green blue yellow purple orange pink brown gray black white cyan magenta lime teal navy maroon olive silver gold coral salmon turquoise violet indigo crimson orchid plum khaki beige lavender mint peach tan azure chocolate sienna steelblue lightcoral".split(
              " "
            );
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          setState("elements", elementId, "props", "color", randomColor);
        }}
      >
        <div
          style={{
            "text-shadow": "1px 1px 2px black",
          }}
          class="pointer-events-none select-none"
        >
          {element.props.color}
        </div>
      </div>
      <ElementTransformControls elementId={elementId} />
    </>
  );
};

const stage = createStageContext();

const stage2 = createStageContext();

function App() {
  onMount(() => {
    stage.createElement({
      type: "circle",
      rect: { x: 50, y: 50, width: 100, height: 100 },
      props: { color: "red", count: 0 },
    });
    stage.createElement({
      type: "rectangle",
      rect: { x: 400, y: 200, width: 100, height: 100 },
      props: { color: "blue", count: 0 },
    });
    stage.setCamera((prev) => ({
      ...prev,
      zoom: 0.75,
    }));

    stage2.createElement({
      type: "circle",
      rect: { x: 150, y: 150, width: 100, height: 100 },
      props: { color: "yellow", count: 0 },
    });
    stage2.createElement({
      type: "rectangle",
      rect: { x: 100, y: 300, width: 100, height: 100 },
      props: { color: "green", count: 0 },
    });
  });

  function createRandomElement() {
    const types = ["circle", "rectangle"];
    const type = types[Math.floor(Math.random() * types.length)];
    const x = Math.random() * 700;
    const y = Math.random() * 700;
    const size = 50 + Math.random() * 100;

    stage.createElement({
      type,
      rect: { x, y, width: size, height: size },
      props: {
        color: type === "circle" ? "green" : "purple",
        count: 0,
      },
    });
  }

  return (
    <div class="w-full bg-gray-800 min-h-screen p-4 gap-4 flex flex-col items-start">
      <div class="flex gap-4">
        <Stage
          class="w-[500px] h-[500px] bg-gray-900 border border-gray-600 relative"
          stage={stage}
          components={{
            background: CustomStageBackground,
            elements: {
              circle: CircleElement,
              rectangle: RectangleElement,
            },
          }}
        />
        <Stage
          class="w-[500px] h-[500px] bg-gray-900 border border-gray-600 relative"
          stage={stage2}
          components={{
            elements: {
              circle: CircleElement,
              rectangle: RectangleElement,
            },
          }}
        />
      </div>
      <button
        class="p-2 bg-blue-500 text-white rounded"
        onClick={createRandomElement}
      >
        Create Element
      </button>
      <div class="w-[800px] bg-gray-900 border border-gray-600 text-white p-2 h-64 overflow-auto">
        <pre class="text-xs pointer-events-none">
          {JSON.stringify(stage.state, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function CustomStageBackground() {
  const { camera } = useStage();
  return (
    <div
      style={{
        "pointer-events": "none",
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        "background-position": `${camera().x}px ${camera().y}px`,
        "background-size": `${40 * camera().zoom}px ${40 * camera().zoom}px`,
        "background-color": "var(--color-zinc-900)",
        "background-image":
          "linear-gradient(var(--color-zinc-800) 1px, transparent 1px), linear-gradient(90deg, var(--color-zinc-800) 1px, transparent 1px)",
      }}
    ></div>
  );
}

export default App;
