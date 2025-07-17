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
        <div>{element.props.count}</div>
      </div>
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
        class="border absolute w-full h-full top-0 left-0 grid place-items-center text-center text-white text-xl"
      >
        <div>{element.props.count}</div>
      </div>
      <ElementTransformControls elementId={elementId} />
    </>
  );
};

const stage = createStageContext({
  renderableElements: {
    circle: CircleElement,
    rectangle: RectangleElement,
  },
});

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
      <Stage
        class="w-[800px] h-[800px] bg-gray-900 border border-gray-600 relative"
        stage={stage}
      />
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

export default App;
