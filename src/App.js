import React, { useState, useEffect, useRef } from 'react';
import { Link, Button, TextField, CircularProgress } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import './App.css';
import { fabric } from 'fabric';
require('firebase/database');
require('firebase/analytics');
const firebase = require('firebase/app');
var firebaseui = require('firebaseui');

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: '25ch',
  },
  button: {
    margin: theme.spacing(1),
  },
  link: {
    fontWeight: 'bold'
  },
  deleteLink: {
    fontSize: 14,
  },
}));

function App() {
  const defaults = {
    name: "GALACTIC GARY",
    city: "SPICEWOOD, TX",
    missionText: "CREATING A WORLD\nWITHOUT CHILD ABUSE & NEGLECT\nONE STEP AT A TIME",
    missionSubText: "www.teamfxaustin.org",
    baseFilename: "TotallySpacedOut_Virtual10K_BIB_",
    awardBaseFilename: "TotallySpacedOut_Virtual10K_Award",
    tosUrl: "https://www.teamfxaustin.org/newsite/totally-spaced-out-virtual-10k-terms-and-conditions",
    privacyPolicyUrl: "https://www.teamfxaustin.org/newsite/totally-spaced-out-virtual-10k-terms-and-conditions",
  };

  const classes = useStyles();
  const [bibNum, setBibNumber] = useState(0);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [firebaseUserId, setFirebaseUserId] = useState(null);
  const [bibKey, setBibKey] = useState(null);
  const [showBib, setShowBib] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [displayName, setDisplayName] = useState(null);
  
  const canvasRef = useRef(null);
  const printCanvasRef = useRef(null);
  const awardCanvasRef = useRef(null);
  const bibTextRef = useRef(0);
  const nameTextRef = useRef(0);
  const cityTextRef = useRef(0);
  const bibTextRef2 = useRef(0);
  const nameTextRef2 = useRef(0);
  const cityTextRef2 = useRef(0);

  const displayNameRef = useRef(0);
  const awardCityRef = useRef(0);


  const canvasWidth = 576;
  const canvasHeight = 576;
  const awardCanvasWidth = 792;
  const awardCanvasHeight = 612;
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
  const dataRoot = '/'; // change to '/TEST' for dev/test

  const getBibNumber = () => {
    // get current counter value (the last bib number used)
    firebase.database().ref(dataRoot + '/counter').once('value').then(function(snap) {
      setBibNumber(snap.val() + 1);
      //console.log("getBibNumber(): ", snap.val() + 1);
      setShowBib(true);
      setLoading(false);
    });
  };

  // show Facebook Login if not signed in
  const handleSignedOutUser = function() {
    setAuthLoaded(true);
    ui.start('#firebaseui-auth-container', getUiConfig());
  };

  // [eschwartz-TODO] This is firing twice; on second time, canvas is undefined
  // (so check existence before canvas.renderAll())
  const handleSignedInUser = function(user) {
    //console.log("handleSignedInUser: user: ", user);
    if (user.displayName) {
      setDisplayName(user.displayName);
    }
    setFirebaseUserId(user.uid); // firebaseUserId not readable in this callback? (see useCallback?)
    setAuthLoaded(true);
    firebase.analytics().logEvent('login', { method: 'facebook' });

    if (user.photoURL) {
      var photoURL = user.photoURL;
      // Append size to the photo URL for Google hosted images to avoid requesting
      // the image with its original resolution (using more bandwidth than needed)
      // when it is going to be presented in smaller size.
      if ((photoURL.indexOf('googleusercontent.com') !== -1) ||
          (photoURL.indexOf('ggpht.com') !== -1)) {
        photoURL = photoURL + '?sz=' + document.getElementById('photo').clientHeight;
      }
      document.getElementById('photo').src = photoURL;
      document.getElementById('photo').style.display = 'block';
    } else {
      document.getElementById('photo').style.display = 'none';
    }

    // Check for entry matching user's Facebook ID (first match), if so set state/fields
    if (user.uid) {
      firebase.database().ref(dataRoot + '/bibs').orderByChild('uid').equalTo(user.uid).limitToFirst(1).once('value').then(function(snap) {
        const val = snap.val();
        if (val) {
          const key = Object.keys(val)[0];
          const data = val[key];
          if (data) {
            setName(data.name);
            setCity(data.city);
            setBibKey(key);
            setBibNumber(data.bib);
          }
        }
        setShowBib(true);
      });
    }
  };

  // Sign out user from Facebook
  const signOut = function() {
    firebase.auth().signOut().then(function() {
      firebase.analytics().logEvent('logout', { method: 'facebook' });
      setFirebaseUserId(null);
      setBibKey(null);
      setName('');
      setCity('');
      getBibNumber();
    });
  };

  

  

  const firebaseConfig = {
    apiKey: "AIzaSyA5YPtHlkeNukHqx8tXVuW8koMuD4SP9XE",
    authDomain: "totallyspacedout-902d4.firebaseapp.com",
    databaseURL: "https://totallyspacedout-902d4.firebaseio.com",
    projectId: "totallyspacedout-902d4",
    storageBucket: "totallyspacedout-902d4.appspot.com",
    messagingSenderId: "109883277311",
    appId: "1:109883277311:web:e280b5d62184f2fdf9f1ca",
    measurementId: "G-FQLSGGEK6S"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  firebase.analytics();

  // Initialize the FirebaseUI Widget using Firebase.
  var ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(firebase.auth());
  ui.disableAutoSignIn(); // [eschwartz-TODO] This doesn't seem to work
  
  function getUiConfig() {
    return {
      callbacks: {
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
          // User successfully signed in
          if (authResult.user) {
            handleSignedInUser(authResult.user);
          }
          if (authResult.additionalUserInfo) {
            //console.log("additionalUserInfo: ", authResult.additionalUserInfo);
            // document.getElementById('is-new-user').textContent =
            //     authResult.additionalUserInfo.isNewUser ?
            //     'New User' : 'Existing User';
          }
          // Return type of false means don't redirect automatically
          return false;
        },
        uiShown: function() {
          // Widget is rendered, hide the loader
          //setLoading(false);
        }
      },
      // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
      signInFlow: 'popup',
      signInSuccessUrl: '/',
      signInOptions: [
        {
          provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID,
          // scopes: [
          //   'public_profile',
          //   'email',
          //   'user_likes',
          //   'user_friends'
          // ],
          // scopes: [
          //   'https://www.googleapis.com/auth/contacts.readonly'
          // ],
          // customParameters: {
          //   // Forces account selection even when one account
          //   // is available.
          //   prompt: 'select_account'
          // }
        },
        // Leave the lines as is for the providers you want to offer your users.
        //firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        //firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        // firebase.auth.GithubAuthProvider.PROVIDER_ID,
        // firebase.auth.EmailAuthProvider.PROVIDER_ID,
        // firebase.auth.PhoneAuthProvider.PROVIDER_ID
      ],
      //tosUrl: defaults.tosUrl,
      //privacyPolicyUrl: defaults.privacyPolicyUrl,
    };
  }

  const createBibGroup = () => {
    const rect = new fabric.Rect({
      selectable: false,
      fill: 'white',
      stroke: pinStrokeColor,
      strokeDashArray: [5, 5],
      width: canvasWidth - 1, // reduce by 1px to avoid clipping dashed border
      height: canvasHeight - 1,
      rx: bibCornerRadius,
      ry: bibCornerRadius,
    });
    const topLeftCircle = new fabric.Circle({
      radius: pinRadius,
      fill: pinFillColor,
      stroke: pinStrokeColor,
      strokeDashArray: [3, 3],
      left: pinMarginHor,
      top: pinMarginVer,
    });
    const topRightCircle = new fabric.Circle({
      radius: pinRadius,
      fill: pinFillColor,
      stroke: pinStrokeColor,
      strokeDashArray: [3, 3],
      left: canvasWidth - pinMarginHor - (2 * pinRadius),
      top: pinMarginVer,
    });
    const bottomLeftCircle = new fabric.Circle({
      radius: pinRadius,
      fill: pinFillColor,
      stroke: pinStrokeColor,
      strokeDashArray: [3, 3],
      left: pinMarginHor,
      top: canvasHeight - pinMarginVer - (2 * pinRadius) - lineMargin,
    });
    const bottomRightCircle = new fabric.Circle({
      radius: pinRadius,
      fill: pinFillColor,
      stroke: pinStrokeColor,
      strokeDashArray: [3, 3],
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
      strokeDashArray: [5, 5],
      left: bigPinMarginHor,
      top: bigPinMarginVer,
      selectable: false,
    });
  
    const bibGroup = new fabric.Group([
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
    return bibGroup;
  };

  function createTextGroup2() {
    const missionText = new fabric.Text(defaults.missionText, {
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontSize: 22,
      originX: 'center',
      textAlign: 'center',
      lineHeight: .8,
      left: canvasWidth / 2,
      top: canvasHeight - 86,
      selectable: false,
    });

    const missionSubText = new fabric.Text(defaults.missionSubText, {
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontSize: 14,
      originX: 'center',
      textAlign: 'center',
      lineHeight: .9,
      left: canvasWidth / 2,
      top: canvasHeight - 21,
      selectable: false,
    });
    
    const textGroup = new fabric.Group(
      [
        missionText,
        missionSubText
      ], {
      top: 489,
      left: canvasWidth / 2,
      width: canvasWidth,
      originX: 'center',
      selectable: false,
    });

    return textGroup;
  }

  function createTextGroup() {
    bibTextRef.current = new fabric.Text(bibNum.toString().padStart(bibNumberPad, '0'), {
      fontFamily: 'HelveticaNeue-CondensedBold, Roboto Condensed',
      fontWeight: 'bold',
      fontSize: 190,
      originX: 'center',
      selectable: false,
      opacity: 1,
    });
    // center vertically once bounding box is established
    let h = bibTextRef.current.getBoundingRect().height;
    bibTextRef.current.set({top: (canvasHeight - h) / 2});
    nameTextRef.current = new fabric.Text(name ? name : defaults.name, {
      top: 360,
      fontFamily: 'HelveticaNeue-CondensedBold, Roboto Condensed',
      fontWeight: 'bold',
      fontSize: 75,
      originX: 'center',
      selectable: false,
    });
    cityTextRef.current = new fabric.Text(city ? city : defaults.city, {
      top: 430,
      fontFamily: 'HelveticaNeue-CondensedBold, Roboto Condensed',
      fontWeight: 'bold',
      fontSize: 55,
      color: '#000',
      originX: 'center',
      selectable: false,
    });

    const textGroup = new fabric.Group(
      [
        bibTextRef.current,
        nameTextRef.current,
        cityTextRef.current
      ], {
      top: 163,
      left: canvasWidth / 2,
      width: canvasWidth,
      originX: 'center',
      selectable: false,
    });

    return textGroup;
  };

  function createTextGroupForPrint(num) {
    bibTextRef2.current = new fabric.Text(num.toString().padStart(bibNumberPad, '0'), {
      fontFamily: 'HelveticaNeue-CondensedBold, Roboto Condensed',
      fontWeight: 'bold',
      fontSize: 190,
      originX: 'center',
      selectable: false,
      opacity: 1,
    });
    // center vertically once bounding box is established
    let h = bibTextRef2.current.getBoundingRect().height;
    bibTextRef2.current.set({top: (canvasHeight - h) / 2});
    nameTextRef2.current = new fabric.Text(name ? name : defaults.name, {
      top: 360,
      fontFamily: 'HelveticaNeue-CondensedBold, Roboto Condensed',
      fontWeight: 'bold',
      fontSize: 75,
      originX: 'center',
      selectable: false,
    });
    cityTextRef2.current = new fabric.Text(city ? city : defaults.city, {
      top: 430,
      fontFamily: 'HelveticaNeue-CondensedBold, Roboto Condensed',
      fontWeight: 'bold',
      fontSize: 55,
      color: '#000',
      originX: 'center',
      selectable: false,
    });

    const textGroup = new fabric.Group(
      [
        bibTextRef2.current,
        nameTextRef2.current,
        cityTextRef2.current
      ], {
      top: 163,
      left: canvasWidth / 2,
      width: canvasWidth,
      originX: 'center',
      selectable: false,
    });

    return textGroup;
  };

  function addAwardImages(canvas) {
    const rect = new fabric.Rect({
      selectable: false,
      fill: 'white',
      width: awardCanvasWidth,
      height: awardCanvasHeight,
      //stroke: pinStrokeColor,
    });
    canvas.add(rect);

    fabric.Image.fromURL('./images/TeamFXLogo1024a.png', function(oImg) {
      oImg.set({
        selectable: false,
        top: 20,
        scaleX: .12,
        scaleY: .12,
        left: awardCanvasWidth / 2,
        originX: 'center',
        opacity: 1,
        overflow: 'hidden',
      })
      canvas.add(oImg);
    });
    
    const introText = new fabric.Text("congratulates", {
      fontFamily: 'Times New Roman',
      fontStyle: 'italic',
      fontSize: 22,
      originX: 'center',
      textAlign: 'center',
      top: 148,
      left: awardCanvasWidth / 2,
      selectable: false,
    }, origin);
    canvas.add(introText);

    displayNameRef.current = new fabric.Text(displayName ? displayName : "", {
      fontFamily: 'Times New Roman',
      textTransform: 'uppercase',
      fontSize: 48,
      originX: 'center',
      textAlign: 'center',
      top: 180,
      left: awardCanvasWidth / 2,
      selectable: false,
    });
    canvas.add(displayNameRef.current);

    const participatingText = new fabric.Text("for participation in the", {
      fontFamily: 'Times New Roman',
      fontStyle: 'italic',
      fontSize: 22,
      originX: 'center',
      textAlign: 'center',
      top: 240,
      left: awardCanvasWidth / 2,
      selectable: false,
    });
    canvas.add(participatingText);

    fabric.Image.fromURL('./images/TSOLogo600.png', function(oImg) {
      oImg.set({
        selectable: false,
        top: 280,
        left: awardCanvasWidth / 2,
        originX: 'center',
        scaleX: .65,
        scaleY: .65,
      });
      canvas.add(oImg);
    });

    awardCityRef.current = new fabric.Text("presented Sunday, April 5, 2020\nin gratitude for your service to the SAFE Children's Shelter.", {
      fontFamily: 'Times New Roman',
      fontStyle: 'italic',
      fontSize: 22,
      originX: 'center',
      textAlign: 'center',
      top: 500,
      left: awardCanvasWidth / 2,
      selectable: false,
    });
    canvas.add(awardCityRef.current);
  }

  function addImages(canvas) {
    fabric.Image.fromURL('./images/TSOLogo600.png', function(oImg) {
      oImg.set({
        selectable: false,
        left: canvasWidth / 2,
        originX: 'center',
        scaleX: .65,
        scaleY: .65,
      });
      canvas.add(oImg);
    });

    fabric.Image.fromURL('./images/TeamFXLogo576.png', function(oImg) {
      oImg.set({
        selectable: false,
        top: -30,
        left: canvasWidth / 2,
        originX: 'center',
        opacity: 0.2,
        overflow: 'hidden',
      })
      canvas.add(oImg);
      canvas.sendBackwards(oImg);
    });
    
    fabric.Image.fromURL('./images/TeamFXLogoSmall.png', function(oImg) {
      oImg.set({
        selectable: false,
        top: canvasHeight - 80 - 7,
        left: canvasWidth - 57 - 15,
        opacity: 1
      })
      canvas.add(oImg);
    });
  };

  useEffect(() => {
    function counterChanged(snapshot) {
      //console.log("counterChanged(): counter (last used) = " + snapshot.val() + ", next = " + parseInt(snapshot.val() + 1));
      // [eschwartz-TODO] Update only if not logged in
      // if (!firebaseUserId) {
      //   setBibNumber(snapshot.val() + 1);
      //   setShowBib(true);
      // }
    };
    const ref = firebase.database().ref(dataRoot + '/counter').on('value', counterChanged);
    return () => {
      ref.off('value', counterChanged);
    }
  }, []);

  useEffect(() => {
    canvasRef.current = new fabric.StaticCanvas("c");
    canvasRef.current.selection = false; // disable group selection
    canvasRef.current.setDimensions({width: canvasWidth, height: canvasHeight});
    canvasRef.current.add(createBibGroup());
    addImages(canvasRef.current);
    canvasRef.current.add(createTextGroup(bibNum));
    canvasRef.current.add(createTextGroup2());

    printCanvasRef.current = new fabric.StaticCanvas("d");
    printCanvasRef.current.setDimensions({width: canvasWidth, height: canvasHeight});
    printCanvasRef.current.add(createBibGroup());
    addImages(printCanvasRef.current);
    printCanvasRef.current.add(createTextGroupForPrint("???"));
    printCanvasRef.current.add(createTextGroup2());

    awardCanvasRef.current = new fabric.StaticCanvas("award-canvas");
    awardCanvasRef.current.setDimensions({width: awardCanvasWidth, height: awardCanvasHeight});
    addAwardImages(awardCanvasRef.current);

    firebase.auth().onAuthStateChanged(function(user) {
      //console.log("onAuthStateChanged(): user: ", user);
      user ? handleSignedInUser(user) : handleSignedOutUser();
    });

    window.addEventListener("resize", resize);
    // Set initial dimensions
    resize();
    getBibNumber();
  }, []);

  // Update text on canvas if fields change in state
  useEffect(() => {
    bibTextRef.current.set('text', bibNum.toString().padStart(bibNumberPad, '0'));
    nameTextRef.current.set('text', name.trim() ? name.trim() : defaults.name);
    cityTextRef.current.set('text', city.trim() ? city.trim() : defaults.city);
    canvasRef.current.renderAll();

    nameTextRef2.current.set('text', name.trim() ? name.trim() : defaults.name);
    cityTextRef2.current.set('text', city.trim() ? city.trim() : defaults.city);
    printCanvasRef.current.renderAll();

    displayNameRef.current.set('text', name ? name.toUpperCase() : "");
    awardCityRef.current.set('text', "presented Sunday, April 5, 2020" + (  (isValid(city) && city) ? " in " + city : "")  + "\nin gratitude for your service to the SAFE Children's Shelter.");
    awardCanvasRef.current.renderAll();

  }, [bibNum, name, city, displayName, defaults]);

  function resize() {
    let ratio = 1; // default
    const containerPadding = 32;
    if ((window.outerWidth - containerPadding) < canvasWidth) {
      ratio = (window.outerWidth - containerPadding) / canvasWidth;
    }
    //console.log("resizing: ", window.innerWidth, window.outerWidth, ratio);
    canvasRef.current.setZoom(ratio);
    canvasRef.current.setDimensions({width: canvasWidth * ratio, height: canvasHeight * ratio});
  };

  function isValid(value) {
    const regex = /^[a-zA-Z0-9,\s.?!@%*()#$^&+=\-_[\]/]{0,15}$/;
    return (regex.test(value) === true);
  }

  function nameChanged(event) {
    let value = event.target.value;
    if (isValid(value)) {
      setName(value.toUpperCase());
    }
  };

  function nameBlurred(event) {
    setName(name.trim());
  }

  function cityChanged(event) {
    let value = event.target.value;
    if (isValid(value)) {
      setCity(value.toUpperCase());
    }
  };

  function cityBlurred(event) {
    setCity(city.trim());
  }

  const saveBib = () => {    
    // If key is known, update name and city but don't change bib number or Facebook UID
    if (bibKey) {
      firebase.database().ref(dataRoot + '/bibs/' + bibKey).update({
        name: name,
        city: city,
      });
      firebase.analytics().logEvent('download', {
        name: name,
        city: city,
        bib: bibNum,
      });
      outputPng(bibNum);
    }
    else {
      // increment the counter via transaction
      firebase.database().ref().child(dataRoot + '/counter').transaction(function(currentCount) {
        return (currentCount || 0) + 1
      }, function(err, committed, snap) {
        // if (err) {
        //   console.log("err: ", err);
        // }
        if (committed) {
          // counter update succeeded, write a new entry
          var ref = firebase.database().ref(dataRoot + '/bibs').push({
            bib: snap.val(),
            name: name,
            city: city,
            uid: firebaseUserId, // may be null, which Firebase omits
          });
          // If signed in, remember key of created entry for updates
          if (firebaseUserId) {
            setBibKey(ref.key);
          }
          firebase.analytics().logEvent('download', {
            name: name,
            city: city,
            bib: snap.val(),
          });
          outputPng(snap.val());
        }
      });
    }
  };

  function outputAwardPng() {
    awardCanvasRef.current.renderAll();
    const dataURL = awardCanvasRef.current.toDataURL({
      format: 'png',
    });
    const link = document.createElement('a');
    link.download = `${defaults.awardBaseFilename}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  function outputPng(savedNum) {
    bibTextRef2.current.set('text', savedNum.toString().padStart(bibNumberPad, '0'));
    printCanvasRef.current.renderAll();

    const dataURL = printCanvasRef.current.toDataURL({
      format: 'png',
    });
    const link = document.createElement('a');
    link.download = `${defaults.baseFilename}${savedNum.toString().padStart(bibNumberPad, '0')}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Reset fields and advance number if not logged in
    if (!firebaseUserId) {
      getBibNumber();
      setName('');
      setCity('');
    }
  };

  return (
    <div className="container">
      <div className="banner">
        <img alt="" src="./images/TeamFXheaderbar2019f.png" />
      </div>
      <h2 className="header">“TOTALLY SPACED OUT” VIRTUAL 10K - benefiting the SAFE Children’s Shelter</h2>
      <h2 className="subheader">SUNDAY, APRIL 5TH, 2020 &ndash; 8am-9am CST</h2>

      <div className="row">
        <div className="leftCol">
          Team FX invites EVERYONE to participate in this FREE, SAFE, grassroots, "spaced out" virtual community benefit event! No fees or registration required. Please just observe all safety orders for your area, and follow the simple steps below.
        </div>
        <div className="rightCol">
          <ul>
            <li>
              <Link className={classes.link} target="_blank" href="https://www.teamfxaustin.org/newsite/totally-spaced-out-10k">Why the “TOTALLY SPACED OUT” 10K?</Link>
            </li>
            <li>
              <Link className={classes.link} target="_blank" href="https://www.teamfxaustin.org/newsite/wp-content/uploads/2020/04/TSO10K-SAFETY.m4v">Watch Coach Gary's safety video!</Link>
            </li>
            { (isValid(name) && name) && (
            <li>
              <Link className={classes.link} onClick={outputAwardPng}>Download award certificate</Link>
            </li>
            )}
          </ul>
        </div>
      </div>
      <h2>1. Create Your Bib</h2>
      { loading && (
      <div id="loading">
        <CircularProgress />
      </div>
      )}
      <div className={showBib ? "" : "hidden"}>
        <div className="row">
          <div className="leftCol">
            <canvas id="award-canvas" className="hidden" />
            <canvas id="c" />
            <canvas id="d" className="hidden" />
          </div>
          <div className="rightCol">
            <TextField
              id="name"
              label="Name"
              value={name}
              style={{ margin: 8 }}
              placeholder={defaults.name}
              helperText="Make it spacey!"
              fullWidth
              margin="normal"
              variant="outlined"
              inputProps={{maxLength: 15}}
              InputLabelProps={{
                shrink: true,
              }}
              onChange={nameChanged}
              onBlur={nameBlurred}
            />
            <TextField
              id="city"
              label="City"
              value={city}
              style={{ margin: 8 }}
              placeholder={defaults.city}
              helperText="Where will you run?"
              fullWidth
              margin="normal"
              variant="outlined"
              inputProps={{maxLength: 18}}
              InputLabelProps={{
                shrink: true,
              }}
              onChange={cityChanged}
              onBlur={cityBlurred}
            />

            <div className={authLoaded ? "authloaded" : "hidden"}>
              <div className="signinBox">
                
                <div className={firebaseUserId ? "signedin" : "hidden"}>
                  <div className="userSignedIn">
                    <div className="userAvatar">
                      <img alt="" id="photo" />
                    </div>
                    <div className="userMessage">
                      You are signed in. <Link className={classes.deleteLink} onClick={signOut}>Sign out</Link>
                    </div>
                  </div>
                </div>
                <div className={firebaseUserId ? "hidden" : "signedout"}>
                  <div className="userSigninPrompt">
                    <strong>[OPTIONAL]</strong> To remember your bib for edits or reprints later, sign in before downloading below.
                  </div>
                </div>
                <div id="firebaseui-auth-container"></div>
              </div>
            </div>
            <Button
              variant="contained"
              size="large"
              color="primary"
              disabled={!(name.trim() && city.trim())}
              className={classes.button}
              onClick={saveBib}
            >
              Download and Print
            </Button>
            <div className="footnote">
              <p>
                Print it out and cut on the dotted lines, but don't run with scissors! Use a hole punch for the safety pin holes.
              </p>
              <p>
                By participating in this event, you agree to the “Totally Spaced Out” Virtual 10K <Link className={classes.link} target="_blank" href="https://www.teamfxaustin.org/newsite/totally-spaced-out-virtual-10k-terms-and-conditions">Terms and Conditions</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <h2>2. Lift Up Your Community</h2>
      <div className="row">
        <div className="leftCol">
          Hold up the continuing needs of children already in crisis during this time with your highest thoughts and prayers. Donations are not required to participate, but please consider making a 100% tax-deductible donation of <strong>$10 to the SAFE Children's Shelter</strong> by sponsoring one of our runners by April 5th.
        </div>
        <div className="rightCol">
          <Button
            variant="contained"
            size="large"
            color="primary"
            className={classes.button}
            target="_blank"
            href="https://www.teamfxaustin.org/newsite/sponsor-a-runner"
          >
            Donate Now
          </Button>
        </div>
      </div>
      <h2>3. Join the Movement</h2>
      <div className="row">
        <div className="leftCol">
          Coach Gary’s LIVE Virtual 10K Run from beautiful Spicewood, Texas will be live-streamed on the <Link className={classes.link} target="_blank" href="https://www.facebook.com/groups/123345373412">Team FX Facebook Group</Link> on <strong>Sunday, April 5th, 2020 at 8am-9am CST</strong>.
          You don't even have to run a 10K! Just post your own pics from anywhere &ndash; doing any activity, inside or outside &ndash; as long as you observe all safety orders for your area.
          It’s very important that we agree to STAY TOTALLY SPACED OUT (at least 6 feet apart)! Sorry, NO high-fives, NO shared water bottles, and NO hugs at the finish line. And be sure to watch Gary's <Link className={classes.link} target="_blank" href="https://www.teamfxaustin.org/newsite/wp-content/uploads/2020/04/TSO10K-SAFETY.m4v">safety video</Link>!
        </div>
        <div className="rightCol">
          <Button
            variant="contained"
            size="large"
            color="primary"
            className={classes.button}
            target="_blank"
            href="https://www.facebook.com/groups/123345373412/"
          >
            Join Group
          </Button>
        </div>
      </div>
      <h2>4. Party On!</h2>
      <div className="row">
        <div className="leftCol">
          <p>After the virtual race, we'll celebrate at SAFE's <Link className={classes.link} target="_blank" href="https://www.teamfxaustin.org/newsite/wp-content/uploads/2020/04/TeamFX-Mojito-Party.jpg">Virtual Afterparty</Link> at 4pm CST! Please stay involved. Now more than ever is the time to be part of this community wholeness movement by considering a Team FX membership at any level TODAY.</p>
          <Link target="_blank" href="https://www.teamfxaustin.org/newsite/wp-content/uploads/2020/04/TeamFX-Mojito-Party.jpg"><img alt="" src="./images/TeamFXMojitoParty150x150.jpg" /></Link>
        </div>
        <div className="rightCol">
          <Button
            variant="contained"
            size="large"
            color="primary"
            className={classes.button}
            target="_blank"
            href="https://www.teamfxaustin.org/newsite/our-heroes-make-it-happen"
          >
            Learn More
          </Button>
        </div>
      </div>
      <h4 className="tagline">
        IN A TIME OF ISOLATION AND UNCERTAINTY, WE ARE PROOF OF LIFE!
      </h4>
      <div className="photos">
        <img alt="" src="./photos/TSO10K-RaceBibNew2Cropped150x150.jpg" />
        <img alt="" src="./photos/TSO_image03-150x150.jpg" />
        <img alt="" src="./photos/TSO_image06-150x150.jpg" />
        <img alt="" src="./photos/TSO_image07-150x150.jpg" />
        <img alt="" src="./photos/TSO_image08-150x150.jpg" />
        <img alt="" src="./photos/TSO_image01-150x150.jpg" />
      </div>
    </div>
  );
}

export default App;
