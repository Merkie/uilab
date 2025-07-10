import { createId } from "@paralleldrive/cuid2";
import {
  Accessor,
  batch,
  createEffect,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { createStore } from "solid-js/store";
import { Dynamic } from "solid-js/web";
import useMeasure from "./lib/hooks/useMeasure";
import useOutsideClick from "./lib/hooks/useOutsideClick";
import ELK from "elkjs/lib/elk.bundled.js";
import gsap from "gsap";

const elk = new ELK();

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
        elements: [
          {
            type: "component",
            rect: { x: 50, y: 50, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <button class="px-6 py-3 bg-yellow-400 border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all">
                  Submit
                </button>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 200, y: 50, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <button class="px-6 py-3 bg-white border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all">
                  Cancel
                </button>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 350, y: 50, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <button class="px-6 py-3 bg-red-500 text-white border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all">
                  Delete
                </button>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 500, y: 50, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <button class="px-8 py-3 bg-black text-yellow-400 border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_rgba(251,191,36,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all">
                  Create New
                </button>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 700, y: 50, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <button class="px-6 py-3 bg-lime-400 border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all">
                  <span class="flex items-center gap-2">
                    <span>Upload</span>
                    <span class="text-lg">↑</span>
                  </span>
                </button>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 150, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <span class="inline-block px-4 py-2 bg-black text-white font-mono text-sm uppercase shadow-[2px_2px_0px_0px_rgba(251,191,36,1)]">
                  JavaScript
                </span>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 180, y: 150, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <span class="inline-block px-4 py-2 border-2 border-black text-black font-mono text-sm uppercase bg-cyan-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  React.js
                </span>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 300, y: 150, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <span class="inline-block px-4 py-2 bg-orange-500 text-black font-bold text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  HOT
                </span>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 380, y: 150, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <span class="inline-block px-4 py-2 bg-purple-600 text-white font-mono text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  BETA
                </span>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 470, y: 150, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <span class="inline-block px-4 py-2 bg-yellow-400 text-black font-bold text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  NEW
                </span>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 250, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="p-4 bg-green-400 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full">
                  <p class="font-bold uppercase text-black">Success!</p>
                  <p class="text-sm text-black">
                    Your deployment is live at production.
                  </p>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 350, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="p-4 bg-red-500 text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full">
                  <p class="font-bold uppercase">Error: Build Failed</p>
                  <p class="text-sm font-mono">Check console for details</p>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 450, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="p-4 bg-yellow-400 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full">
                  <p class="font-black uppercase">⚠ Warning</p>
                  <p class="text-sm">Dependencies are out of date</p>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 550, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <input
                  type="text"
                  placeholder="USERNAME"
                  class="w-[400px] p-3 border-2 border-black font-mono uppercase placeholder-gray-500 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white transition-all"
                />
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 620, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <input
                  type="email"
                  placeholder="email@example.com"
                  class="w-[400px] p-3 border-2 border-black font-mono lowercase bg-gray-100 focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 690, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <select class="w-[400px] p-3 border-2 border-black font-mono uppercase bg-white focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all appearance-none cursor-pointer">
                  <option>Select Framework</option>
                  <option>React</option>
                  <option>Vue</option>
                  <option>Angular</option>
                </select>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 700, y: 250, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="w-[500px] bg-black border-2 border-gray-700 shadow-[6px_6px_0px_0px_rgba(75,85,99,1)]">
                  <div class="bg-gray-800 px-4 py-2 border-b-2 border-gray-700 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="w-3 h-3 bg-red-500 border border-red-600"></span>
                      <span class="w-3 h-3 bg-yellow-500 border border-yellow-600"></span>
                      <span class="w-3 h-3 bg-green-500 border border-green-600"></span>
                    </div>
                    <span class="text-gray-400 font-mono text-sm">bash</span>
                  </div>
                  <div class="p-4 font-mono text-sm text-green-400">
                    <div class="space-y-1">
                      <p class="text-gray-500"># Deploy to production</p>
                      <p>
                        <span class="text-cyan-400">$</span> npm run build
                      </p>
                      <p class="text-gray-400">Building project...</p>
                      <p class="text-green-300">✓ Build completed in 3.2s</p>
                      <p>
                        <span class="text-cyan-400">$</span> vercel deploy
                        --prod
                      </p>
                      <p class="text-yellow-300">Deploying to production...</p>
                      <p class="text-green-400">✓ Deployed successfully</p>
                      <p>
                        <span class="text-cyan-400">$</span>{" "}
                        <span class="animate-pulse">_</span>
                      </p>
                    </div>
                  </div>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 800, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full">
                  <h3 class="font-black text-xl uppercase mb-2">
                    Project Alpha
                  </h3>
                  <p class="text-sm mb-4">
                    Next-gen development platform with AI integration.
                  </p>
                  <div class="flex gap-2">
                    <span class="text-xs font-mono bg-black text-white px-2 py-1 border-2 border-black">
                      v2.0
                    </span>
                    <span class="text-xs font-mono bg-yellow-400 text-black px-2 py-1 border-2 border-black">
                      LIVE
                    </span>
                  </div>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 400, y: 800, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="border-2 border-black p-6 bg-purple-500 text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full">
                  <h3 class="font-black text-xl uppercase mb-2">
                    Beta Feature
                  </h3>
                  <p class="text-sm mb-4 opacity-90">
                    Experimental build system with 10x performance.
                  </p>
                  <button class="bg-black text-white px-4 py-2 font-bold uppercase text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                    Try Now
                  </button>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 750, y: 800, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="border-2 border-black p-6 bg-lime-400 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full">
                  <h3 class="font-black text-xl uppercase mb-2">
                    Documentation
                  </h3>
                  <p class="text-sm mb-4">Complete API reference and guides.</p>
                  <a
                    href="#"
                    class="text-black font-bold underline uppercase text-sm"
                  >
                    Read Docs →
                  </a>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 1050, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" class="hidden peer" />
                  <div class="w-14 h-8 bg-gray-300 border-2 border-black peer-checked:bg-green-400 relative transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div class="absolute w-6 h-6 bg-black top-[3px] left-[3px] peer-checked:translate-x-6 transition-transform"></div>
                  </div>
                  <span class="font-bold uppercase">Dark Mode</span>
                </label>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 300, y: 1050, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" class="hidden peer" checked={true} />
                  <div class="w-14 h-8 bg-gray-300 border-2 border-black peer-checked:bg-yellow-400 relative transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div class="absolute w-6 h-6 bg-black top-[3px] left-[3px] peer-checked:translate-x-6 transition-transform"></div>
                  </div>
                  <span class="font-bold uppercase">Notifications</span>
                </label>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 1150, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="w-full">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-bold text-sm uppercase mr-2">
                      Build Progress
                    </span>
                    <span class="font-mono text-sm">75%</span>
                  </div>
                  <div class="h-8 bg-gray-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div
                      class="h-full bg-lime-400 border-r-2 border-black"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 1250, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="w-full">
                  <div class="flex justify-between mb-2 items-center">
                    <span class="font-bold text-sm uppercase mr-2">
                      Memory Usage
                    </span>
                    <span class="font-mono text-sm">89%</span>
                  </div>
                  <div class="h-8 bg-gray-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div
                      class="h-full bg-red-500"
                      style={{ width: "89%" }}
                    ></div>
                  </div>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 600, y: 1050, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <span class="inline-flex items-center gap-1 px-3 py-1 bg-red-500 text-white font-bold text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <span class="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  LIVE
                </span>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 680, y: 1050, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <span class="inline-block px-3 py-1 bg-black text-yellow-400 font-mono text-xs border-2 border-yellow-400 shadow-[2px_2px_0px_0px_rgba(251,191,36,1)]">
                  PRO
                </span>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 750, y: 1050, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <span class="inline-block px-3 py-1 bg-purple-600 text-white font-bold text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  NEW
                </span>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 820, y: 1050, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <span class="inline-block px-3 py-1 bg-cyan-400 text-black font-bold text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  BETA
                </span>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 700, y: 550, width: 0, height: 0, zIndex: 2 },
            props: {
              component: () => (
                <div class="w-full bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  <div class="bg-black text-white p-4 flex justify-between items-center">
                    <h3 class="font-bold uppercase">Confirm Action</h3>
                    <button class="text-2xl hover:text-yellow-400">×</button>
                  </div>
                  <div class="p-6">
                    <p class="mb-6">
                      Are you sure you want to deploy to production? This action
                      cannot be undone.
                    </p>
                    <div class="flex gap-3">
                      <button class="flex-1 px-4 py-2 bg-yellow-400 border-2 border-black font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                        Deploy
                      </button>
                      <button class="flex-1 px-4 py-2 bg-white border-2 border-black font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 1350, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <table class="w-[600px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <thead>
                    <tr class="bg-black text-white">
                      <th class="p-3 text-left font-bold uppercase border-r-2 border-gray-800">
                        Project
                      </th>
                      <th class="p-3 text-left font-bold uppercase border-r-2 border-gray-800">
                        Status
                      </th>
                      <th class="p-3 text-left font-bold uppercase border-r-2 border-gray-800">
                        Build
                      </th>
                      <th class="p-3 text-left font-bold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-t-2 border-black bg-white">
                      <td class="p-3 font-mono border-r-2 border-gray-200">
                        app-frontend
                      </td>
                      <td class="p-3 border-r-2 border-gray-200">
                        <span class="inline-block px-2 py-1 bg-green-400 text-black font-bold text-xs border border-black">
                          ACTIVE
                        </span>
                      </td>
                      <td class="p-3 font-mono text-sm border-r-2 border-gray-200">
                        #1247
                      </td>
                      <td class="p-3">
                        <button class="px-3 py-1 bg-yellow-400 text-black font-bold text-sm border-2 border-black hover:bg-yellow-300">
                          VIEW
                        </button>
                      </td>
                    </tr>
                    <tr class="border-t-2 border-black bg-gray-50">
                      <td class="p-3 font-mono border-r-2 border-gray-200">
                        api-service
                      </td>
                      <td class="p-3 border-r-2 border-gray-200">
                        <span class="inline-block px-2 py-1 bg-yellow-400 text-black font-bold text-xs border border-black">
                          BUILDING
                        </span>
                      </td>
                      <td class="p-3 font-mono text-sm border-r-2 border-gray-200">
                        #1248
                      </td>
                      <td class="p-3">
                        <button class="px-3 py-1 bg-yellow-400 text-black font-bold text-sm border-2 border-black hover:bg-yellow-300">
                          VIEW
                        </button>
                      </td>
                    </tr>
                    <tr class="border-t-2 border-black bg-white">
                      <td class="p-3 font-mono border-r-2 border-gray-200">
                        worker-task
                      </td>
                      <td class="p-3 border-r-2 border-gray-200">
                        <span class="inline-block px-2 py-1 bg-red-500 text-white font-bold text-xs border border-black">
                          FAILED
                        </span>
                      </td>
                      <td class="p-3 font-mono text-sm border-r-2 border-gray-200">
                        #1246
                      </td>
                      <td class="p-3">
                        <button class="px-3 py-1 bg-yellow-400 text-black font-bold text-sm border-2 border-black hover:bg-yellow-300">
                          VIEW
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 900, y: 1350, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="space-y-3 w-full">
                  <label class="flex items-center gap-3 cursor-pointer p-3 border-2 border-black hover:bg-yellow-50 bg-white transition-colors">
                    <input type="radio" name="deployment" class="hidden peer" />
                    <div class="w-5 h-5 border-2 border-black peer-checked:bg-black peer-checked:shadow-[inset_0_0_0_3px_rgba(251,191,36,1)]"></div>
                    <span class="font-bold uppercase">Production</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer p-3 border-2 border-black hover:bg-yellow-50 bg-white transition-colors">
                    <input
                      type="radio"
                      name="deployment"
                      class="hidden peer"
                      checked={true}
                    />
                    <div class="w-5 h-5 border-2 border-black peer-checked:bg-black peer-checked:shadow-[inset_0_0_0_3px_rgba(251,191,36,1)]"></div>
                    <span class="font-bold uppercase">Staging</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer p-3 border-2 border-black hover:bg-yellow-50 bg-white transition-colors">
                    <input type="radio" name="deployment" class="hidden peer" />
                    <div class="w-5 h-5 border-2 border-black peer-checked:bg-black peer-checked:shadow-[inset_0_0_0_3px_rgba(251,191,36,1)]"></div>
                    <span class="font-bold uppercase">Development</span>
                  </label>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 600, y: 1150, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="space-y-3 w-full">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" class="hidden peer" />
                    <div class="w-6 h-6 border-2 border-black peer-checked:bg-yellow-400 peer-checked:shadow-[inset_0_0_0_3px_rgba(0,0,0,1)] transition-all"></div>
                    <span class="font-bold uppercase">Enable Analytics</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" class="hidden peer" checked={true} />
                    <div class="w-6 h-6 border-2 border-black peer-checked:bg-yellow-400 peer-checked:shadow-[inset_0_0_0_3px_rgba(0,0,0,1)] transition-all"></div>
                    <span class="font-bold uppercase">Send Notifications</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" class="hidden peer" />
                    <div class="w-6 h-6 border-2 border-black peer-checked:bg-yellow-400 peer-checked:shadow-[inset_0_0_0_3px_rgba(0,0,0,1)] transition-all"></div>
                    <span class="font-bold uppercase">Auto Deploy</span>
                  </label>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 1650, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="w-full">
                  <div class="flex">
                    <button class="px-6 py-3 bg-yellow-400 border-2 border-black border-b-0 font-bold uppercase -mb-[2px] z-10">
                      Overview
                    </button>
                    <button class="px-6 py-3 bg-gray-200 border-2 border-black border-b-2 border-l-0 font-bold uppercase hover:bg-gray-100">
                      Settings
                    </button>
                    <button class="px-6 py-3 bg-gray-200 border-2 border-black border-b-2 border-l-0 font-bold uppercase hover:bg-gray-100">
                      Logs
                    </button>
                  </div>
                  <div class="border-2 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h3 class="font-bold uppercase mb-3">Project Overview</h3>
                    <p class="text-sm">
                      Monitor your deployments, check build status, and manage
                      your infrastructure all in one place.
                    </p>
                  </div>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 700, y: 1650, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="flex items-center gap-2">
                  <button class="px-4 py-2 bg-white border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    ←
                  </button>
                  <button class="px-4 py-2 bg-yellow-400 border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    1
                  </button>
                  <button class="px-4 py-2 bg-white border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    2
                  </button>
                  <button class="px-4 py-2 bg-white border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    3
                  </button>
                  <span class="px-2 font-bold">...</span>
                  <button class="px-4 py-2 bg-white border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    12
                  </button>
                  <button class="px-4 py-2 bg-white border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    →
                  </button>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 1850, width: 0, height: 0, zIndex: 2 },
            props: {
              component: () => (
                <div class="relative inline-block">
                  <button class="px-6 py-3 bg-yellow-400 border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center gap-2">
                    <span>Options</span>
                    <span>▼</span>
                  </button>
                  <div class="mt-2 w-48 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <a
                      href="#"
                      class="block px-4 py-3 font-bold uppercase hover:bg-yellow-400 border-b-2 border-gray-200"
                    >
                      Profile
                    </a>
                    <a
                      href="#"
                      class="block px-4 py-3 font-bold uppercase hover:bg-yellow-400 border-b-2 border-gray-200"
                    >
                      Settings
                    </a>
                    <a
                      href="#"
                      class="block px-4 py-3 font-bold uppercase hover:bg-yellow-400 border-b-2 border-gray-200"
                    >
                      Billing
                    </a>
                    <a
                      href="#"
                      class="block px-4 py-3 font-bold uppercase hover:bg-yellow-400"
                    >
                      Logout
                    </a>
                  </div>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 300, y: 1850, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <nav class="flex items-center gap-2 text-sm font-bold uppercase">
                  <a href="#" class="hover:text-yellow-600">
                    Home
                  </a>
                  <span>/</span>
                  <a href="#" class="hover:text-yellow-600">
                    Projects
                  </a>
                  <span>/</span>
                  <span class="text-yellow-600">Deploy Settings</span>
                </nav>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 700, y: 1850, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="w-[500px]">
                  <div class="relative">
                    <input
                      type="search"
                      placeholder="SEARCH PROJECTS..."
                      class="w-full pl-4 pr-12 py-3 border-2 border-black font-mono uppercase placeholder-gray-500 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white transition-all"
                    />
                    <button class="absolute right-0 top-0 h-full px-4 bg-black text-yellow-400 border-l-2 border-black font-bold hover:bg-gray-800 transition-colors">
                      SEARCH
                    </button>
                  </div>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 1950, width: 0, height: 0, zIndex: 2 },
            props: {
              component: () => (
                <div class="relative group">
                  <button class="px-4 py-2 bg-yellow-400 border-2 border-black font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    Hover Me
                  </button>
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm font-bold uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    This is a tooltip
                    <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-4 border-transparent border-t-black"></div>
                  </div>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 250, y: 1950, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <form class="bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
                  <h3 class="text-xl font-black uppercase mb-6">
                    Deploy Configuration
                  </h3>

                  <div class="space-y-6">
                    <div>
                      <label class="block font-bold uppercase mb-2">
                        Project Name
                      </label>
                      <input
                        type="text"
                        id="project-name"
                        class="w-full p-3 border-2 border-black font-mono focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                      />
                    </div>

                    <div>
                      <label class="block font-bold uppercase mb-2">
                        Environment
                      </label>
                      <select
                        id="environment"
                        class="w-full p-3 border-2 border-black font-mono uppercase bg-white focus:outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all appearance-none"
                      >
                        <option>Production</option>
                        <option>Staging</option>
                        <option>Development</option>
                      </select>
                    </div>

                    <div>
                      <label class="block font-bold uppercase mb-2">
                        Deploy Options
                      </label>
                      <div class="space-y-2">
                        <label class="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" class="hidden peer" />
                          <div class="w-5 h-5 border-2 border-black peer-checked:bg-yellow-400 peer-checked:shadow-[inset_0_0_0_2px_rgba(0,0,0,1)]"></div>
                          <span class="font-mono">Auto-scale enabled</span>
                        </label>
                        <label class="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            class="hidden peer"
                            checked={true}
                          />
                          <div class="w-5 h-5 border-2 border-black peer-checked:bg-yellow-400 peer-checked:shadow-[inset_0_0_0_2px_rgba(0,0,0,1)]"></div>
                          <span class="font-mono">Enable monitoring</span>
                        </label>
                      </div>
                    </div>

                    <div class="flex gap-3 pt-4">
                      <button
                        type="submit"
                        class="flex-1 px-6 py-3 bg-yellow-400 border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
                      >
                        Deploy Now
                      </button>
                      <button
                        type="button"
                        class="flex-1 px-6 py-3 bg-white border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ),
            },
          },

          // STATS CARDS
          {
            type: "component",
            rect: { x: 50, y: 2450, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full">
                  <div class="text-3xl font-black">1,247</div>
                  <div class="text-sm font-bold uppercase text-gray-600">
                    Total Builds
                  </div>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 280, y: 2450, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="bg-yellow-400 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full">
                  <div class="text-3xl font-black">98.5%</div>
                  <div class="text-sm font-bold uppercase">Success Rate</div>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 510, y: 2450, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="bg-lime-400 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full">
                  <div class="text-3xl font-black">3.2s</div>
                  <div class="text-sm font-bold uppercase">Avg Build Time</div>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 740, y: 2450, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="bg-purple-500 text-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full">
                  <div class="text-3xl font-black">42</div>
                  <div class="text-sm font-bold uppercase">Active Projects</div>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 2900, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="bg-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(251,191,36,1)]">
                  <div class="flex">
                    <a
                      href="#"
                      class="px-6 py-4 bg-yellow-400 text-black font-bold uppercase border-r-2 border-black hover:bg-yellow-300 transition-colors"
                    >
                      Home
                    </a>
                    <a
                      href="#"
                      class="px-6 py-4 text-white font-bold uppercase border-r-2 border-gray-800 hover:bg-gray-900 transition-colors"
                    >
                      Projects
                    </a>
                    <a
                      href="#"
                      class="px-6 py-4 text-white font-bold uppercase border-r-2 border-gray-800 hover:bg-gray-900 transition-colors"
                    >
                      About
                    </a>
                    <a
                      href="#"
                      class="px-6 py-4 text-white font-bold uppercase hover:bg-gray-900 transition-colors"
                    >
                      Contact
                    </a>
                  </div>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 3050, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <div class="bg-gray-900 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div class="bg-black text-yellow-400 px-4 py-2 font-mono text-sm border-b-2 border-gray-700">
                    component.jsx
                  </div>
                  <pre class="p-4 text-gray-300 font-mono text-sm overflow-x-auto">
                    <code>{`const Button = ({ children, variant = 'primary' }) => {
  const styles = {
    primary: 'bg-yellow-400',
    secondary: 'bg-white',
    danger: 'bg-red-500 text-white'
  };

  return (
    <button class={\`
      px-6 py-3 \${styles[variant]}
      border-2 border-black font-bold uppercase
      shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
      hover:shadow-none hover:translate-x-[3px]
      hover:translate-y-[3px] transition-all
    \`}>
      {children}
    </button>
  );
};`}</code>
                  </pre>
                </div>
              ),
            },
          },
          {
            type: "component",
            rect: { x: 50, y: 3350, width: 0, height: 0, zIndex: 1 },
            props: {
              component: () => (
                <footer class="w-[1200px] bg-black text-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(251,191,36,1)]">
                  <div class="p-8">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div>
                        <h4 class="font-black uppercase mb-3 text-yellow-400">
                          Platform
                        </h4>
                        <ul class="space-y-2 font-mono text-sm">
                          <li>
                            <a href="#" class="hover:text-yellow-400">
                              Documentation
                            </a>
                          </li>
                          <li>
                            <a href="#" class="hover:text-yellow-400">
                              API Reference
                            </a>
                          </li>
                          <li>
                            <a href="#" class="hover:text-yellow-400">
                              Status
                            </a>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 class="font-black uppercase mb-3 text-yellow-400">
                          Company
                        </h4>
                        <ul class="space-y-2 font-mono text-sm">
                          <li>
                            <a href="#" class="hover:text-yellow-400">
                              About
                            </a>
                          </li>
                          <li>
                            <a href="#" class="hover:text-yellow-400">
                              Blog
                            </a>
                          </li>
                          <li>
                            <a href="#" class="hover:text-yellow-400">
                              Careers
                            </a>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 class="font-black uppercase mb-3 text-yellow-400">
                          Connect
                        </h4>
                        <ul class="space-y-2 font-mono text-sm">
                          <li>
                            <a href="#" class="hover:text-yellow-400">
                              GitHub
                            </a>
                          </li>
                          <li>
                            <a href="#" class="hover:text-yellow-400">
                              Twitter
                            </a>
                          </li>
                          <li>
                            <a href="#" class="hover:text-yellow-400">
                              Discord
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div class="mt-8 pt-8 border-t-2 border-gray-800 text-center font-mono text-sm">
                      <p>© 2025 BRUTALIST UI. ALL RIGHTS RESERVED.</p>
                    </div>
                  </div>
                </footer>
              ),
            },
          },
        ].reduce((acc, el) => {
          const id = createId();
          acc[id] = el;
          return acc;
        }, {} as Record<string, ElementState>),
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

const clientId = createId();

const [camera, setCamera] = createSignal({ x: 0, y: 0, zoom: 1 });
const [mousePosition, setMousePosition] = createSignal({ x: 0, y: 0 });

const [dragStart, setDragStart] = createSignal<
  { mouseX: number; mouseY: number; target: DragTarget } | undefined
>(undefined);

const [panning, setPanning] = createSignal(false);
const [contextMenuPosition, setContextMenuPosition] = createSignal<{
  x: number;
  y: number;
} | null>(null);

let stageRef: HTMLDivElement | undefined;
let viewRef: HTMLDivElement | undefined;

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

  function getResizeCursor(resizeDir: string | undefined) {
    if (!resizeDir) return "default";
    if (resizeDir === "top left" || resizeDir === "bottom right")
      return "nwse-resize";
    if (resizeDir === "top right" || resizeDir === "bottom left")
      return "nesw-resize";
    return "default";
  }

  function onMouseDown(event: MouseEvent) {
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

    if (elementIdAttr && state.elements[elementIdAttr]) {
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
        for (const id of state.selectedElements[clientId]) {
          initialRects.set(id, { ...state.elements[id].rect });
        }

        setDragStart({
          mouseX: event.clientX,
          mouseY: event.clientY,
          target: { type: "elements", initialRects },
        });
      });
    } else if (stageRef === target) {
      setState("selectedElements", clientId, []);
      setDragStart({
        mouseX: event.clientX,
        mouseY: event.clientY,
        target: { type: "stage" },
      });
    }
  }

  function onMouseMove(event: MouseEvent) {
    setMousePosition({ x: event.clientX, y: event.clientY });
    const currentCamera = camera();

    if (panning()) {
      setCamera((prev) => ({
        ...prev,
        x: prev.x + event.movementX,
        y: prev.y + event.movementY,
      }));
      return;
    }

    const worldX = (event.clientX - currentCamera.x) / currentCamera.zoom;
    const worldY = (event.clientY - currentCamera.y) / currentCamera.zoom;
    setState("cursors", clientId, { x: worldX, y: worldY });

    const dragStartValue = dragStart();
    if (!dragStartValue) return;

    const dx = (event.clientX - dragStartValue.mouseX) / currentCamera.zoom;
    const dy = (event.clientY - dragStartValue.mouseY) / currentCamera.zoom;

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
        (dragStartValue.mouseX - currentCamera.x) / currentCamera.zoom;
      const startWorldY =
        (dragStartValue.mouseY - currentCamera.y) / currentCamera.zoom;
      setState("selectionBoxes", clientId, {
        x: Math.min(startWorldX, worldX),
        y: Math.min(startWorldY, worldY),
        width: Math.abs(worldX - startWorldX),
        height: Math.abs(worldY - startWorldY),
        hidden: false,
      });
    }
  }

  function onMouseUp(event: MouseEvent) {
    if (event.button === 1) setPanning(false);
    setDragStart(undefined);

    const selectionBox = state.selectionBoxes[clientId];
    if (selectionBox && !selectionBox.hidden) {
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
  }

  function handleZoom(delta: number, mouseX: number, mouseY: number) {
    const currentCamera = camera();

    // Calculate the target zoom level and clamp it within min/max bounds.
    const targetZoom = Math.max(0.1, Math.min(currentCamera.zoom * delta, 10));

    // If the zoom is already at its limit, do nothing.
    if (targetZoom === currentCamera.zoom) {
      return;
    }

    // Stop any existing zoom animation to ensure a responsive feel.
    gsap.killTweensOf(currentCamera);

    // Calculate the world coordinates under the mouse before the zoom.
    const mouseWorldX = (mouseX - currentCamera.x) / currentCamera.zoom;
    const mouseWorldY = (mouseY - currentCamera.y) / currentCamera.zoom;

    // Calculate the target camera position to keep the world point under the cursor.
    const targetX = mouseX - mouseWorldX * targetZoom;
    const targetY = mouseY - mouseWorldY * targetZoom;

    // Use GSAP to animate the camera properties.
    gsap.to(currentCamera, {
      duration: 0.5,
      ease: "power3.out",
      x: targetX,
      y: targetY,
      zoom: targetZoom,
      // On every frame of the animation, update the SolidJS signal.
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
    // pan the camera up and down
    setCamera((prev) => ({
      ...prev,
      y: prev.y + event.deltaY / prev.zoom,
    }));
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === " " && !panning() && !dragStart()) {
      event.preventDefault();
      setPanning(true);
    }

    if (event.metaKey || event.ctrlKey) {
      if (event.key === "=" || event.key === "-") {
        event.preventDefault();
        const zoomDirection = event.key === "=" ? 1.2 : 1 / 1.2;
        const currentMousePos = mousePosition();
        handleZoom(zoomDirection, currentMousePos.x, currentMousePos.y);
      }
    }
  }

  function onKeyUp(event: KeyboardEvent) {
    if (event.key === " ") setPanning(false);
  }

  function onContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
  }

  onMount(() => {
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    stageRef?.addEventListener("wheel", onWheel, { passive: false });
    stageRef?.addEventListener("contextmenu", onContextMenu);
  });

  onCleanup(() => {
    document.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
    stageRef?.removeEventListener("wheel", onWheel);
    stageRef?.removeEventListener("contextmenu", onContextMenu);
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
            "transform-origin": "top left",
            "pointer-events": "none",
          }}
        >
          {/* Elements and Selection Boxes are rendered inside this transformed div */}
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
                  component={TestElement}
                  elementId={id}
                  clientId={clientId}
                />
              </div>
            )}
          </For>
          <For each={Object.entries(state.selectionBoxes)}>
            {([_, box]) => (
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
            )}
          </For>
        </div>
        <ContextMenu
          position={contextMenuPosition}
          close={() => setContextMenuPosition(null)}
          clientId={clientId}
        />
      </main>
    </>
  );
}

function ContextMenu({
  position,
  close,
  clientId,
}: {
  position: Accessor<{ x: number; y: number } | null>;
  close: () => void;
  clientId: string;
}) {
  const [menuRef, setMenuRef] = createSignal<HTMLDivElement | undefined>(
    undefined
  );

  useOutsideClick(menuRef, () => {
    if (position() !== null) {
      close();
    }
  });

  return (
    <Show when={position() !== null}>
      <div
        ref={setMenuRef}
        class="absolute bg-white border border-gray-300 shadow-lg rounded-md p-1"
        style={{
          left: `${position()!.x}px`,
          top: `${position()!.y}px`,
        }}
      >
        <button
          onClick={async () => {
            const selectedElements = state.selectedElements[clientId].map(
              (id) => ({
                id,
                x: state.elements[id].rect.x,
                y: state.elements[id].rect.y,
                width: state.elements[id].rect.width,
                height: state.elements[id].rect.height,
              })
            );

            // Calculate the center of the initial bounding box to position the new layout
            const graphNodes = selectedElements.map((el) => ({
              id: el.id,
              width: el.width,
              height: el.height,
            }));

            const graph = {
              id: "root",
              layoutOptions: {
                "elk.algorithm": "box",
              },
              children: graphNodes,
            };

            const layout = await elk.layout(graph);

            const timeline = gsap.timeline();

            layout.children?.forEach((node) => {
              const originalElement = state.elements[node.id];
              if (!originalElement) return;

              const animProxy = {
                x: originalElement.rect.x,
                y: originalElement.rect.y,
              };

              timeline.to(
                animProxy,
                {
                  duration: 0.3,
                  ease: "power2.out",
                  x: Math.round(node.x!),
                  y: Math.round(node.y!),
                  scale: 1,
                  rotation: 0,
                  onUpdate: () => {
                    setState("elements", node.id, "rect", {
                      x: Math.round(animProxy.x),
                      y: Math.round(animProxy.y),
                      width: node.width,
                      height: node.height,
                      zIndex: originalElement.rect.zIndex,
                    });
                  },
                  onComplete: () => {
                    setState("elements", node.id, "rect", {
                      x: Math.round(node.x!),
                      y: Math.round(node.y!),
                      width: node.width,
                      height: node.height,
                      zIndex: originalElement.rect.zIndex,
                    });
                  },
                },
                0
              );
            });
          }}
          class="hover:bg-zinc-100 rounded-md p-1 px-2 cursor-pointer text-sm"
        >
          Organize Elements
        </button>
        <button
          onClick={async () => {
            if (!stageRef) return;
            const viewportWidth = stageRef.clientWidth;
            const viewportHeight = stageRef.clientHeight;

            const selectedIds = state.selectedElements[clientId] || [];
            const targetIds =
              selectedIds.length > 0
                ? selectedIds
                : Object.keys(state.elements);

            if (targetIds.length === 0) return;

            const elementRects = targetIds.map((id) => state.elements[id].rect);

            // 1. Calculate the bounding box of all elements
            let minX = Infinity,
              minY = Infinity,
              maxX = -Infinity,
              maxY = -Infinity;

            elementRects.forEach((rect) => {
              minX = Math.min(minX, rect.x);
              minY = Math.min(minY, rect.y);
              maxX = Math.max(maxX, rect.x + rect.width);
              maxY = Math.max(maxY, rect.y + rect.height);
            });

            const boundingWidth = maxX - minX;
            const boundingHeight = maxY - minY;

            // Handle cases where elements have no area
            if (boundingWidth <= 0 || boundingHeight <= 0) return;

            // 2. Calculate the ideal zoom level with padding
            const padding = 100; // Sets a 100px margin around the content
            const targetZoom = Math.min(
              (viewportWidth - padding * 2) / boundingWidth,
              (viewportHeight - padding * 2) / boundingHeight,
              2 // Cap zoom at 100% to avoid zooming in too far
            );

            // 3. Find the center of the bounding box
            const boundingCenterX = minX + boundingWidth / 2;
            const boundingCenterY = minY + boundingHeight / 2;

            // 4. Calculate the camera's target position to center the content
            const targetX = viewportWidth / 2 - boundingCenterX * targetZoom;
            const targetY = viewportHeight / 2 - boundingCenterY * targetZoom;

            // 5. Animate the camera to the new state using GSAP
            const currentCamera = camera();
            gsap.killTweensOf(currentCamera); // Stop any other camera animations

            gsap.to(currentCamera, {
              duration: 0.75,
              ease: "power3.out",
              x: targetX,
              y: targetY,
              zoom: targetZoom,
              onUpdate: () => {
                setCamera({ ...currentCamera }); // Update the state on each animation frame
              },
            });
          }}
          class="hover:bg-zinc-100 rounded-md p-1 px-2 cursor-pointer text-sm"
        >
          Fit Elements
        </button>
      </div>
    </Show>
  );
}

function TestElement({
  elementId,
  clientId,
}: {
  elementId: string;
  clientId: string;
}) {
  const element = state.elements[elementId];
  return (
    <Show when={element}>
      <Show when={element.type === "frame"}>
        <FrameElement elementId={elementId} clientId={clientId} />
      </Show>
      <Show when={element.type === "component"}>
        <ComponentElement elementId={elementId} clientId={clientId} />
      </Show>
    </Show>
  );
}

function FrameElement({
  elementId,
  clientId,
}: {
  elementId: string;
  clientId: string;
}) {
  return (
    <>
      <div class="absolute top-0 left-0 -translate-y-[100%] text-sm select-none">
        Frame
      </div>
      <div class="border pointer-events-none absolute w-full h-full top-0 left-0 bg-white rounded-sm"></div>
      <ElementTransformControls elementId={elementId} clientId={clientId} />
    </>
  );
}

function ComponentElement({
  elementId,
  clientId,
}: {
  elementId: string;
  clientId: string;
}) {
  const element = state.elements[elementId];

  const [containerRef, setContainerRef] = createSignal<
    HTMLDivElement | undefined
  >(undefined);

  const containerSize = useMeasure(containerRef);

  createEffect(() => {
    const size = containerSize();
    if (!size) return;
    if (!size.height || !size.width) return;
    setState("elements", elementId, "rect", (prev) => ({
      ...prev,
      width: size.width,
      height: size.height,
    }));
  });

  return (
    <div class="pointer-events-none absolute w-full h-full top-0 left-0">
      <Show when={element?.props?.component}>
        <div
          ref={setContainerRef}
          class="absolute pointer-events-none select-none whitespace-nowrap"
          style={{
            "--ring-size": state.selectedElements[clientId]?.includes(elementId)
              ? "2px"
              : "0px",
            filter: `drop-shadow(var(--ring-size) 0 0 lightblue) drop-shadow(calc(var(--ring-size) * -1) 0 0 lightblue) drop-shadow(0 var(--ring-size) 0 lightblue) drop-shadow(0 calc(var(--ring-size) * -1) 0 lightblue)`,
          }}
        >
          <Dynamic component={element.props.component} />
        </div>
      </Show>
    </div>
  );
}

function ElementTransformControls({
  elementId,
  clientId,
}: {
  elementId: string;
  clientId: string;
}) {
  return (
    <Show when={state.selectedElements[clientId]?.includes(elementId)}>
      <div class="w-full h-full absolute top-0 pointer-events-none left-0 border border-sky-500">
        <div
          data-element-id={elementId}
          data-resize-dir="top left"
          class="w-[8px] h-[8px] bg-white absolute top-0 left-0 -translate-y-1/2 -translate-x-1/2 border border-sky-500"
          style={{ "pointer-events": "all", cursor: "nwse-resize" }}
        />
        <div
          data-element-id={elementId}
          data-resize-dir="top right"
          class="w-[8px] h-[8px] bg-white absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 border border-sky-500"
          style={{ "pointer-events": "all", cursor: "nesw-resize" }}
        />
        <div
          data-element-id={elementId}
          data-resize-dir="bottom left"
          class="w-[8px] h-[8px] bg-white absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 border border-sky-500"
          style={{ "pointer-events": "all", cursor: "nesw-resize" }}
        />
        <div
          data-element-id={elementId}
          data-resize-dir="bottom right"
          class="w-[8px] h-[8px] bg-white absolute bottom-0 right-0 translate-y-1/2 translate-x-1/2 border border-sky-500"
          style={{ "pointer-events": "all", cursor: "nwse-resize" }}
        />
      </div>
    </Show>
  );
}
