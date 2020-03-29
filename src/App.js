import React, { useEffect } from 'react';
import { fabric } from 'fabric';

import './App.css';

function App() {
  var canvas, bibText, nameText, cityText, bibGroup, textGroup;
  var bibNum = 7;
  const defaults = {
    name: "GALACTIC GARY",
    city: "SPICEWOOD, TX",
  };
  const canvasWidth = 576;
  const canvasHeight = 576;
  const pinRadius = 7;
  const pinMarginHor = 28;
  const pinMarginVer = 17;
  const bigPinRadius = 18;
  const bigPinMarginHor = 51;
  const bigPinMarginVer = 510;
  const lineMargin = 94;
  const pinFillColor = 'transparent';
  const pinStrokeColor = '#777';
  const bibCornerRadius = 25;
  const bibNumberPad = 3;

  const createBibGroup = () => {
    let rect = new fabric.Rect({
      selectable: false,
      fill: 'lightBlue',
      width: canvasWidth,
      height: canvasHeight,
      rx: bibCornerRadius,
      ry: bibCornerRadius,
    });
    const topLeftCircle = new fabric.Circle({
      radius: pinRadius,
      fill: pinFillColor,
      stroke: pinStrokeColor,
      left: pinMarginHor,
      top: pinMarginVer,
    });
    const topRightCircle = new fabric.Circle({
      radius: pinRadius,
      fill: pinFillColor,
      stroke: pinStrokeColor,
      left: canvasWidth - pinMarginHor - (2 * pinRadius),
      top: pinMarginVer,
    });
    const bottomLeftCircle = new fabric.Circle({
      radius: pinRadius,
      fill: pinFillColor,
      stroke: pinStrokeColor,
      left: pinMarginHor,
      top: canvasHeight - pinMarginVer - (2 * pinRadius) - lineMargin,
    });
    const bottomRightCircle = new fabric.Circle({
      radius: pinRadius,
      fill: pinFillColor,
      stroke: pinStrokeColor,
      left: canvasWidth - pinMarginHor - (2 * pinRadius),
      top: canvasHeight - pinMarginVer - (2 * pinRadius) - lineMargin,
    });
    const line = new fabric.Line(
      [0, canvasHeight - lineMargin, canvasWidth, canvasHeight - lineMargin],
      {
        stroke: pinStrokeColor,
        strokeDashArray: [5, 5],
        selectable: false,
      }
    );
    const bigCircle = new fabric.Circle({
      radius: bigPinRadius,
      fill: pinFillColor,
      stroke: pinStrokeColor,
      left: bigPinMarginHor,
      top: bigPinMarginVer,
      selectable: false,
    });
  
    bibGroup = new fabric.Group([
      rect,
      topLeftCircle,
      topRightCircle,
      bottomLeftCircle,
      bottomRightCircle,
      line,
      bigCircle,
    ], {
      selectable: false,
    });
  };

  const createTextGroup = () => {
    bibText = new fabric.Text(bibNum.toString().padStart(bibNumberPad, '0'), {
      fontFamily: 'HelveticaNeue-CondensedBold',
      fontSize: 225,
      originX: 'center',
      selectable: false,
    });
    // center vertically once bounding box is known
    let h = bibText.getBoundingRect().height;
    bibText.set({top: (canvasHeight - h) / 2});

    nameText = new fabric.Text(defaults.name, {
      top: 360,
      fontFamily: 'HelveticaNeue-CondensedBold',
      fontSize: 85,
      originX: 'center',
      selectable: false,
    });

    cityText = new fabric.Text(defaults.city, {
      top: 440,
      fontFamily: 'HelveticaNeue-CondensedBold',
      fontSize: 60,
      color: '#000',
      originX: 'center',
      selectable: false,
    });

    textGroup = new fabric.Group([bibText, nameText, cityText], {
      top: 125,
      left: canvasWidth / 2,
      width: canvasWidth,
      originX: 'center',
      selectable: false,
    });
  };

  const exportPng = () => {
    const dataURL = canvas.toDataURL({
      format: 'png',
      //multiplier: 0.72,
    });
    const link = document.createElement('a');
    link.download = `TotallySpacedOut_Virtual10K_BIB_${bibNum.toString().padStart(bibNumberPad, '0')}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  createBibGroup();
  createTextGroup();

  useEffect(() => {
    canvas = new fabric.Canvas("c");
    canvas.selection = false; // disable group selection
    canvas.add(bibGroup);
    canvas.add(textGroup);

    fabric.Image.fromURL('./logoDraftTemplate576.png', function(oImg) {
      oImg.set({
        selectable: false,
        top: -30,
        opacity: .7
      })
      canvas.add(oImg);
      canvas.sendBackwards(oImg);
    });
  }, []);

  const nameChanged = (event) => {
    var value = event.target.value;
    nameText.set('text', value.toUpperCase());
    canvas.renderAll();
  };

  const cityChanged = (event) => {
    var value = event.target.value;
    cityText.set('text', value.toUpperCase());
    canvas.renderAll();
  };

  return (
    <div className="container">
      <h4 className="text-center">M A K E&nbsp;&nbsp; M Y</h4>
      <h1 className="text-center">' ' T O T A L L Y&nbsp;&nbsp; S P A C E D&nbsp;&nbsp; O U T ' '</h1>
      <h1 className="text-center">V I R T U A L&nbsp;&nbsp; 1 0 K&nbsp;&nbsp; R A C E&nbsp;&nbsp; B I B</h1>
      <div className="wrapper">
        <div className="form-row text-center">
          <div className="col-1"></div>
          <div className="col-5">
            <label htmlFor="name" className="my-1 mr-2">Space Name</label>
            <input type="text" className="form-control bg-dark text-light" id="name" placeholder={defaults.name} onChange={nameChanged} />
          </div>
          <div className="col-5">
            <label htmlFor="city" className="my-1 mr-2">Space Place</label>
            <input type="text" className="form-control bg-dark text-light" id="city" placeholder={defaults.city} onChange={cityChanged} />
          </div>
          <div className="col-1"></div>
        </div>
        <canvas
          className="canvas"
          id="c"
          width={canvasWidth}
          height={canvasHeight}
        />
        <div className="form-inline">
          <div className="form-group" role="group" aria-label="...">
            <button type="submit" className="btn btn-primary btn-lg btn-dark" onClick={exportPng}>Download and Print</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
