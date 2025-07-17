import { onMount } from "solid-js";
import {
  CanvasElementComponent,
  createStageStore,
  ElementTransformControls,
  Stage,
} from "./solid-infinite-canvas";

const CircleElement: CanvasElementComponent = ({ element, elementId }) => {
  return (
    <>
      <div
        style={{
          "background-color": element.props.color,
        }}
        class="pointer-events-none border absolute w-full h-full top-0 left-0 rounded-full"
      ></div>
      <ElementTransformControls elementId={elementId} />
    </>
  );
};

const RectangleElement: CanvasElementComponent = ({ element, elementId }) => {
  return (
    <>
      <div
        style={{
          "background-color": element.props.color,
        }}
        class="pointer-events-none border absolute w-full h-full top-0 left-0"
      ></div>
      <ElementTransformControls elementId={elementId} />
    </>
  );
};

const stageStore = createStageStore({
  renderableElements: {
    circle: CircleElement,
    rectangle: RectangleElement,
  },
});

function App() {
  onMount(() => {
    stageStore.createElement({
      type: "circle",
      rect: { x: 50, y: 50, width: 100, height: 100 },
      props: { color: "red" },
    });
    stageStore.createElement({
      type: "rectangle",
      rect: { x: 400, y: 200, width: 100, height: 100 },
      props: { color: "blue" },
    });
  });

  function createRandomElement() {
    const types = ["circle", "rectangle"];
    const type = types[Math.floor(Math.random() * types.length)];
    const x = Math.random() * 700;
    const y = Math.random() * 700;
    const size = 50 + Math.random() * 100;

    stageStore.createElement({
      type,
      rect: { x, y, width: size, height: size },
      props: { color: type === "circle" ? "green" : "yellow" },
    });
  }

  return (
    <div class="w-full bg-gray-800 min-h-screen p-4 gap-4">
      <Stage
        class="w-[800px] h-[800px] border border-gray-600 relative"
        store={stageStore}
      />
      <button class="p-2 bg-blue-500 text-white" onClick={createRandomElement}>
        Create Element
      </button>
      <pre class="p-4 text-white text-sm pointer-events-none">
        {JSON.stringify(stageStore.state, null, 2)}
      </pre>
    </div>
  );
}

export default App;
