"use client";

import Selecto from "react-selecto";

export default function App() {
  const cubes: number[] = [];

  for (let i = 0; i < 60; ++i) {
    cubes.push(i);
  }
  return (
    <div className="app">
      <div className="container">
        <h1>
          Continue to select through the toggle key(shift) with deselect(ctrl).
        </h1>
        <p className="description">
          The toggle key allows you to select continuously with the currently
          selected target.
        </p>

        <Selecto
          dragContainer={".elements"}
          selectableTargets={[
            "#selecto1 .cube",
            "#selecto2 .element",
            "#selecto3 li",
          ]}
          onSelect={(e) => {
            e.added.forEach((el) => {
              el.classList.add("bg-blue-200");
            });
            e.removed.forEach((el) => {
              el.classList.remove("bg-blue-200");
            });
          }}
          hitRate={0}
          selectByClick={true}
          selectFromInside={true}
          continueSelect={false}
          continueSelectWithoutDeselect={true}
          toggleContinueSelect={"shift"}
          toggleContinueSelectWithoutDeselect={[["ctrl"], ["meta"]]}
          ratio={0}
        />
        <div
          className="elements selecto-area flex gap-2 flex-wrap p-10"
          id="selecto1"
        >
          {cubes.map((i) => (
            <div className="cube h-10 w-10 rounded-lg shadow-lg" key={i}></div>
          ))}
        </div>
        <div className="empty elements"></div>
      </div>
    </div>
  );
}
