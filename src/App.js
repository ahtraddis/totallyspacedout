import React, { useEffect } from 'react';
import { fabric } from 'fabric';
import './App.css';
import { Link, Button, TextField, CircularProgress } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
const firebase = require('firebase/app');
require('firebase/database');
require('firebase/analytics');
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
  const classes = useStyles();
  
  var canvas;
  // move these to useState()
  var fbId = null;
  var bibKey = null;
  var bibNum = null;

  var bibText, nameText, cityText, bibGroup, textGroup;
  const defaults = {
    name: "GALACTIC GARY",
    city: "SPICEWOOD, TX",
    dateText: "APRIL 5, 2020",
    missionText: "CREATING A WORLD\nWITHOUT CHILD ABUSE & NEGLECT\nONE STEP AT A TIME",
    missionSubText: "www.teamfxaustin.org",
    baseFilename: "TotallySpacedOut_Virtual10K_BIB_",
    tosUrl: "https://www.teamfxaustin.org/newsite/totally-spaced-out-virtual-10k-terms-and-conditions",
    privacyPolicyUrl: "https://www.teamfxaustin.org/newsite/totally-spaced-out-virtual-10k-terms-and-conditions",
    initialBibNum: 0,
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
  const dataRoot = '/'; // change to '/TEST' for dev/test

  const createBibGroup = () => {
    let rect = new fabric.Rect({
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
    bibText = new fabric.Text(defaults.initialBibNum.toString().padStart(bibNumberPad, '0'), {
      fontFamily: 'HelveticaNeue-CondensedBold',
      fontSize: 190,
      originX: 'center',
      selectable: false,
      opacity: 1,
    });
    // center vertically once bounding box is established
    let h = bibText.getBoundingRect().height;
    bibText.set({top: (canvasHeight - h) / 2});

    nameText = new fabric.Text(defaults.name, {
      top: 360,
      fontFamily: 'HelveticaNeue-CondensedBold',
      fontSize: 75,
      originX: 'center',
      selectable: false,
    });

    cityText = new fabric.Text(defaults.city, {
      top: 430,
      fontFamily: 'HelveticaNeue-CondensedBold',
      fontSize: 55,
      color: '#000',
      originX: 'center',
      selectable: false,
    });

    textGroup = new fabric.Group(
      [
        bibText,
        nameText,
        cityText
      ], {
      top: 143,
      left: canvasWidth / 2,
      width: canvasWidth,
      originX: 'center',
      selectable: false,
    });
  };

  function setBibNumber(bibNum) {
    bibText.set('text', bibNum.toString().padStart(bibNumberPad, '0'));
    if (canvas) canvas.renderAll();
  };

  const getBibNumber = () => {
    // get current counter value (the last bib number used)
    firebase.database().ref(dataRoot + '/counter').once('value').then(function(snap) {
      bibNum = snap.val() + 1;
      setBibNumber(bibNum);
      document.getElementById('bibloaded').style.display = 'block';
    });
  };

  // show Facebook Login if not signed in
  const handleSignedOutUser = function() {
    document.getElementById('user-signed-in').style.display = 'none';
    document.getElementById('user-signed-out').style.display = 'block';
    //document.getElementById('bibloaded').style.display = 'block';
    ui.start('#firebaseui-auth-container', getUiConfig());
  };

  // [eschwartz-TODO] This is firing twice; on second time, canvas is undefined
  // (so check existence before canvas.renderAll())
  const handleSignedInUser = function(user) {
    fbId = user.uid; // [eschwartz-TODO] Set fbId with useState()
    document.getElementById('user-signed-in').style.display = 'block';
    document.getElementById('user-signed-out').style.display = 'none';

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
    firebase.database().ref(dataRoot + '/bibs').orderByChild('uid').equalTo(fbId).limitToFirst(1).once('value').then(function(snap) {
      const val = snap.val();
      if (val) {
        const key = Object.keys(val)[0];
        const data = val[key];
        if (data) {
          document.getElementById('name').value = data.name;
          document.getElementById('city').value = data.city;
          nameText.set('text', data.name);
          cityText.set('text', data.city);
          setBibNumber(data.bib);
          // [eschwartz-TODO] Set with useState(). Setting globals for now.
          bibKey = key;
          bibNum = data.bib;
        }
      }
      document.getElementById('bibloaded').style.display = 'block';
    }, canvas);
  };

  // Sign out user from Facebook
  const signOut = function() {
    firebase.auth().signOut().then(function() {
      // reset form/state
    });
  };

  // Delete user's Firebase auth account (but don't - just sign out so they can access bib later)
  // const deleteAccount = function() {
  //   firebase.auth().currentUser.delete().catch(function(error) {
  //     if (error.code === 'auth/requires-recent-login') {
  //       // The user's credential is too old. She needs to sign in again.
  //       firebase.auth().signOut().then(function() {
  //         // The timeout allows the message to be displayed after the UI has
  //         // changed to the signed out state.
  //         // setTimeout(function() {
  //         //   alert('Please sign in again to delete your account.');
  //         // }, 1);
  //       });
  //     }
  //   });
  // };

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

  const dateText = new fabric.Text(defaults.dateText, {
    fontFamily: 'Arial',
    fontWeight: 'bold',
    fontSize: 20,
    originX: 'center',
    left: canvasWidth / 2,
    top: 455,
    selectable: false,
  });

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

  firebase.auth().onAuthStateChanged(function(user) {
    //console.log("onAuthStateChanged(): user: ", user);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('loaded').style.display = 'block';
    user ? handleSignedInUser(user) : handleSignedOutUser();
  });

  createBibGroup();
  createTextGroup();
  
  function getUiConfig() {
    return {
      callbacks: {
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
          // User successfully signed in
          if (authResult.user) {
            handleSignedInUser(authResult.user);
          }
          // if (authResult.additionalUserInfo) {
          //   document.getElementById('is-new-user').textContent =
          //       authResult.additionalUserInfo.isNewUser ?
          //       'New User' : 'Existing User';
          // }
          // Return type of false means don't redirect automatically
          return false;
        },
        uiShown: function() {
          // Widget is rendered, hide the loader
          //document.getElementById('loader').style.display = 'none';
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

  useEffect(() => {
    canvas = new fabric.Canvas("c");
    canvas.selection = false; // disable group selection
    canvas.add(bibGroup);
    canvas.add(textGroup);
    canvas.add(missionText);
    canvas.add(missionSubText);
    canvas.add(dateText);

    fabric.Image.fromURL('./images/logoCroppedTrans.png', function(oImg) {
      oImg.set({
        selectable: false,
        top: 1,
        left: 102,
        scaleX: .65,
        scaleY: .65,
      })
      canvas.add(oImg);
    });

    fabric.Image.fromURL('./images/TeamFXLogo576.png', function(oImg) {
      oImg.set({
        selectable: false,
        top: -50,
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

    getBibNumber();

    window.addEventListener("resize", resize);
    // Set initial full width dimensions
    canvas.setDimensions({width: canvasWidth, height: canvasHeight});
    resize();

  }, []);

  function resize() {
    const containerPadding = 32;
    if ((window.outerWidth - containerPadding) < canvasWidth) {
      let ratio = (window.outerWidth - containerPadding) / canvasWidth;
      console.log("resizing: ", window.innerWidth, window.outerWidth, ratio);
      canvas.setZoom(ratio);
      canvas.setDimensions({width: canvasWidth * ratio, height: canvasHeight * ratio});
    }
  };

  const nameChanged = (event) => {
    var value = event.target.value.trim();
    nameText.set('text', value.toUpperCase());
    canvas.renderAll();
  };

  const cityChanged = (event) => {
    var value = event.target.value.trim();
    cityText.set('text', value.toUpperCase());
    canvas.renderAll();
  };

  const exportPng = () => {
    const name = nameText.get('text');
    const city = cityText.get('text');

    // If key is known, update name and city but don't change bib number or Facebook UID
    if (bibKey) {
      firebase.database().ref(dataRoot + '/bibs/' + bibKey).update({
        name: name,
        city: city,
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
          bibText.set('text', snap.val().toString().padStart(bibNumberPad, '0'));
          canvas.renderAll();
          var ref = firebase.database().ref(dataRoot + '/bibs').push({
            bib: snap.val(),
            name: name,
            city: city,
            uid: fbId,
          });
          // [eschwartz-TODO] Set with useState()
          bibKey = ref.key;
          outputPng(snap.val());
        }
      });
    }
  };

  function outputPng(bibNum) {
    const dataURL = canvas.toDataURL({
      format: 'png',
    });
    const link = document.createElement('a');
    link.download = `${defaults.baseFilename}${bibNum.toString().padStart(bibNumberPad, '0')}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          <Link className={classes.link} target="_blank" href="https://www.teamfxaustin.org/newsite/totally-spaced-out-10k">Why the “TOTALLY SPACED OUT” 10K?</Link>
        </div>
      </div>
      
      <h2>1. Create Your Bib</h2>
      <div id="loading">
        <CircularProgress />
      </div>
      <div id="bibloaded" className="hidden">
        <div className="row">
          <div className="leftCol">
            <canvas
              className="canvas"
              id="c"
              //width={canvasWidth}
              //height={canvasHeight}
            />
          </div>
          <div className="rightCol">
            <TextField
              id="name"
              label="Name"
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
            />
            <TextField
              id="city"
              label="City"
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
            />

            <div id="loaded" className="hidden">
              <div className="signinBox">
                <div id="user-signed-in" className="hidden">
                  <div className="userSignedIn">
                    <div className="userAvatar">
                      <img alt="" id="photo" />
                    </div>
                    <div className="userMessage">
                      You are signed in. <Link className={classes.deleteLink} onClick={signOut}>Sign out</Link>
                    </div>
                  </div>
                </div>
                <div id="user-signed-out" className="hidden">
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
              className={classes.button}
              onClick={exportPng}
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
          It’s very important that we agree to STAY TOTALLY SPACED OUT (at least 6 feet apart)! Sorry, NO high-fives, NO shared water bottles, and NO hugs at the finish line.
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
          After the virtual race, we'll celebrate at SAFE's Virtual Afterparty at 4pm CST! More details soon on the <Link className={classes.link} target="_blank" href="https://www.teamfxaustin.org/newsite/totally-spaced-out-10k">Team FX website</Link>. Please stay involved! Now more than ever is the time to be part of this community wholeness movement by considering a Team FX membership at any level TODAY.
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
