import { createId } from "@paralleldrive/cuid2";
import {
  CanvasElementComponent,
  ElementTransformControls,
  Stage,
} from "./solid-infinite-canvas";

type ElementState = {
  type: string;
  rect: { x: number; y: number; width: number; height: number; zIndex: number };
  props: Record<string, any>;
};

const CircleElement: CanvasElementComponent = ({ element, elementId }) => {
  return (
    <>
      <div
        style={{
          "background-color": element.props.color,
          "border-radius": "9999px",
        }}
        class="pointer-events-none border absolute w-full h-full top-0 left-0"
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

const renderableElements = {
  circle: CircleElement,
  rectangle: RectangleElement,
};

function App() {
  const stage1InitialState = {
    elements: [
      {
        type: "circle",
        rect: { x: 50, y: 50, width: 100, height: 100, zIndex: 1 },
        props: { color: "red" },
      },
      {
        type: "rectangle",
        rect: { x: 200, y: 50, width: 100, height: 100, zIndex: 2 },
        props: { color: "blue" },
      },
    ].reduce((acc, el) => {
      acc[createId()] = el;
      return acc;
    }, {} as Record<string, ElementState>),
  };

  const stage2InitialState = {
    elements: [
      {
        type: "rectangle",
        rect: { x: 80, y: 150, width: 120, height: 80, zIndex: 1 },
        props: { color: "purple" },
      },
      {
        type: "circle",
        rect: { x: 250, y: 100, width: 60, height: 60, zIndex: 2 },
        props: { color: "green" },
      },
    ].reduce((acc, el) => {
      acc[createId()] = el;
      return acc;
    }, {} as Record<string, ElementState>),
  };

  return (
    <div class="w-full bg-gray-800 p-4 gap-4">
      <Stage
        class="w-[400px] h-[500px] border border-gray-600"
        initialState={stage1InitialState}
        renderableElements={renderableElements}
      />
      <div class="h-[500px]"></div>
      <Stage
        class="w-full h-[500px] border border-gray-600"
        initialState={stage2InitialState}
        renderableElements={renderableElements}
      />
    </div>
  );
}

export default App;
