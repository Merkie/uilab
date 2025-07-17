import {
  CanvasElementComponent,
  createInitialState,
  ElementTransformControls,
  Stage,
} from "./solid-infinite-canvas";

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
  return (
    <div class="w-full bg-gray-800 p-4 gap-4">
      <Stage
        class="w-[800px] h-[800px] border border-gray-600"
        initialState={createInitialState([
          {
            type: "circle",
            rect: { x: 50, y: 50, width: 100, height: 100 },
            props: { color: "red" },
          },
          {
            type: "rectangle",
            rect: { x: 400, y: 200, width: 100, height: 100 },
            props: { color: "blue" },
          },
        ])}
        renderableElements={renderableElements}
      />
      <div class="h-[500px]"></div>
      {/* <Stage
        class="w-full h-[500px] border border-gray-600"
        initialState={stage2InitialState}
        renderableElements={renderableElements}
      /> */}
    </div>
  );
}

export default App;
