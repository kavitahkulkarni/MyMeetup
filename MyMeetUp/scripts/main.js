/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// Shortcuts to DOM Elements.
var eventForm = document.getElementById('event-form');
var eventFormStep1 = document.getElementById('step1');
var eventFormStep2 = document.getElementById('step2');
var eventFormStep3 = document.getElementById('step3');
var eventFormStep4 = document.getElementById('step4');
var eventNameInput = document.getElementById('new-event-name');
var eventTypeInput = document.getElementById('new-event-type');
var eventHostInput = document.getElementById('new-event-host');
var eventStartDateInput = document.getElementById('new-event-start-date');
var eventStartTimeInput = document.getElementById('new-event-start-time');
var eventEndDateInput = document.getElementById('new-event-end-date');
var eventEndTimeInput = document.getElementById('new-event-end-time');
var eventLocationInput = document.getElementById('new-event-location');
var eventGuestsInput = document.getElementById('new-event-guests');
var eventMessageInput = document.getElementById('new-event-message');
var signInButton = document.getElementById('sign-in-button');
var signOutButton = document.getElementById('sign-out-button');
var splashPage = document.getElementById('page-splash');
var addEvent = document.getElementById('add-event');
var addButton = document.getElementById('add');
var recentEventsSection = document.getElementById('recent-events-list');
var userEventsSection = document.getElementById('user-events-list');
var topUserEventsSection = document.getElementById('top-user-events-list');
var recentMenuButton = document.getElementById('menu-recent');
var myEventsMenuButton = document.getElementById('menu-my-events');
var myTopEventsMenuButton = document.getElementById('menu-my-top-events');
var listeningFirebaseRefs = [];

/**
 * Saves a new event to the Firebase DB.
 */
// [START write_fan_out]
function writeNewEvent(uid, username, picture,eventName, eventType, eventHost, eventStartDate, eventStartTime, eventEndDate, eventEndTime, eventLocation, eventGuests, eventMessage) {
  // A event entry.
  var eventData = {
    uid: uid,
    author: username,
    authorPic: picture,
    eventName: eventName,
    eventType: eventType,
    eventHost : eventHost,
    eventStartDate : eventStartDate,
    eventStartTime : eventStartTime,
    eventEndDate : eventEndDate,
    eventEndTime : eventEndTime,
    eventLocation : eventLocation,
    eventGuests : eventGuests,
    eventMessage : eventMessage,
    starCount: 0,
  };

  // Get a key for a new Event.
  var newEventKey = firebase.database().ref().child('events').push().key;

  // Write the new event's data simultaneously in the events list and the user's event list.
  var updates = {};
  updates['/events/' + newEventKey] = eventData;
  updates['/user-events/' + uid + '/' + newEventKey] = eventData;

  return firebase.database().ref().update(updates);
}
// [END write_fan_out]

/**
 * Star/unstar event.
 */
// [START event_stars_transaction]
function toggleStar(eventsRef, uid) {
  eventsRef.transaction(function(event) {
    if (event) {
      if (event.stars && event.stars[uid]) {
        event.starCount--;
        event.stars[uid] = null;
      } else {
        event.starCount++;
        if (!event.stars) {
          event.stars = {};
        }
        event.stars[uid] = true;
      }
    }
    return event;
  });
}
// [END event_stars_transaction]

/**
 * Creates a event element.
 */
function createEventElement(eventId, eventName, eventType, eventHost, eventStartDate, eventStartTime, eventEndDate, eventEndTime, eventLocation, eventGuests, eventMessage, author, authorId, authorPic) {
  var uid = firebase.auth().currentUser.uid;

  var html =
      '<div class="event mdl-cell mdl-cell--12-col ' +
                  'mdl-cell--6-col-tablet mdl-cell--4-col-desktop mdl-grid mdl-grid--no-spacing">' +
        '<div class="mdl-card mdl-shadow--2dp">' +
          '<div class="mdl-card__title mdl-color--light-blue-600 mdl-color-text--white">' +
            '<h4 class="mdl-card__title-text"></h4>' +
          '</div>' +
          '<div class="header">' +
            '<div>' +
              '<div class="avatar"></div>' +
              '<div class="username mdl-color-text--black"></div>' +
            '</div>' +
          '</div>' +
          '<span class="star">' +
            '<div class="not-starred material-icons">star_border</div>' +
            '<div class="starred material-icons">star</div>' +
            '<div class="star-count">0</div>' +
          '</span>' +
          '<div class="display eventType"></div>' +
          '<div class="display eventHost"></div>' +
          '<div class="display eventStartDateTime"></div>' +
//          '<div class="eventStartTime"></div>' +
          '<div class="display eventEndDateTime"></div>' +
          '<div class="display eventLocation"></div>' +
          '<div class="display eventGuests"></div>' +
          '<div class="display message"></div>' +
          '<div class="comments-container"></div>' +
          '<form class="add-comment" action="#">' +
            '<div class="mdl-textfield mdl-js-textfield">' +
              '<input class="mdl-textfield__input new-comment" type="text">' +
              '<label class="mdl-textfield__label">Comment...</label>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>';

  // Create the DOM element from the HTML.
  var div = document.createElement('div');
  div.innerHTML = html;
  var eventElement = div.firstChild;
  if (componentHandler) {
    componentHandler.upgradeElements(eventElement.getElementsByClassName('mdl-textfield')[0]);
  }

  var addCommentForm = eventElement.getElementsByClassName('add-comment')[0];
  var commentInput = eventElement.getElementsByClassName('new-comment')[0];
  var star = eventElement.getElementsByClassName('starred')[0];
  var unStar = eventElement.getElementsByClassName('not-starred')[0];

  // Set values.
  eventElement.getElementsByClassName('mdl-card__title-text')[0].innerText = eventName;
  eventElement.getElementsByClassName('username')[0].innerText = author || 'Anonymous';
  eventElement.getElementsByClassName('eventType')[0].innerText = 'Event Type: ' + eventType;
  eventElement.getElementsByClassName('eventHost')[0].innerText = 'Event Host: ' + eventHost;
    eventElement.getElementsByClassName('eventStartDateTime')[0].innerText = 'Start Date: ' + eventStartDate + ' Time: ' + eventStartTime;
 // eventElement.getElementsByClassName('eventStartTime')[0].innerText = 'Start Time: ' + eventStartTime;
  eventElement.getElementsByClassName('eventEndDateTime')[0].innerText = 'End Date: ' + eventEndDate + ' Time: ' + eventEndTime;
  eventElement.getElementsByClassName('eventLocation')[0].innerText = 'Location: ' + eventLocation;
  eventElement.getElementsByClassName('eventGuests')[0].innerText = 'Guests: ' + eventGuests;
  eventElement.getElementsByClassName('message')[0].innerText = 'Message from organizer: ' + eventMessage;

  eventElement.getElementsByClassName('avatar')[0].style.backgroundImage = 'url("' +
      (authorPic || './silhouette.jpg') + '")';

  // Listen for comments.
  // [START child_event_listener_recycler]
  var commentsRef = firebase.database().ref('event-comments/' + eventId);
  commentsRef.on('child_added', function(data) {
    addCommentElement(eventElement, data.key, data.val().text, data.val().author);
  });

  commentsRef.on('child_changed', function(data) {
    setCommentValues(eventElement, data.key, data.val().text, data.val().author);
  });

  commentsRef.on('child_removed', function(data) {
    deleteComment(eventElement, data.key);
  });
  // [END child_event_listener_recycler]

  // Listen for likes counts.
  // [START event_value_event_listener]
  var starCountRef = firebase.database().ref('events/' + eventId + '/starCount');
  starCountRef.on('value', function(snapshot) {
    updateStarCount(eventElement, snapshot.val());
  });
  // [END event_value_event_listener]

  // Listen for the starred status.
  var starredStatusRef = firebase.database().ref('events/' + eventId + '/stars/' + uid)
  starredStatusRef.on('value', function(snapshot) {
    updateStarredByCurrentUser(eventElement, snapshot.val());
  });

  // Keep track of all Firebase reference on which we are listening.
  listeningFirebaseRefs.push(commentsRef);
  listeningFirebaseRefs.push(starCountRef);
  listeningFirebaseRefs.push(starredStatusRef);

  // Create new comment.
  addCommentForm.onsubmit = function(e) {
    e.preventDefault();
    var userId = firebase.auth().currentUser.uid;
    return firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
      var username = snapshot.val().email;
      createNewComment(eventId, username, uid, commentInput.value);
      commentInput.value = '';
      commentInput.parentElement.MaterialTextfield.boundUpdateClassesHandler();
    });
  };

  // Bind starring action.
  var onStarClicked = function() {
    var globalEventRef = firebase.database().ref('/events/' + eventId);
    var userEventsRef = firebase.database().ref('/user-events/' + authorId + '/' + eventId);
    toggleStar(globalEventRef, uid);
    toggleStar(userEventsRef, uid);
  };
  unStar.onclick = onStarClicked;
  star.onclick = onStarClicked;

  return eventElement;
}

/**
 * Writes a new comment for the given event.
 */
function createNewComment(eventId, username, uid, text) {
  firebase.database().ref('event-comments/' + eventId).push({
    text: text,
    author: username,
    uid: uid
  });
}

/**
 * Updates the starred status of the event.
 */
function updateStarredByCurrentUser(eventElement, starred) {
  if (starred) {
    eventElement.getElementsByClassName('starred')[0].style.display = 'inline-block';
    eventElement.getElementsByClassName('not-starred')[0].style.display = 'none';
  } else {
    eventElement.getElementsByClassName('starred')[0].style.display = 'none';
    eventElement.getElementsByClassName('not-starred')[0].style.display = 'inline-block';
  }
}

/**
 * Updates the number of stars displayed for a event.
 */
function updateStarCount(eventElement, nbStart) {
  eventElement.getElementsByClassName('star-count')[0].innerText = nbStart;
}

/**
 * Creates a comment element and adds it to the given eventElement.
 */
function addCommentElement(eventElement, id, text, author) {
  var comment = document.createElement('div');
  comment.classList.add('comment-' + id);
  comment.innerHTML = '<span class="username"></span><span class="comment"></span>';
  comment.getElementsByClassName('comment')[0].innerText = text;
  comment.getElementsByClassName('username')[0].innerText = author || 'Anonymous';

  var commentsContainer = eventElement.getElementsByClassName('comments-container')[0];
  commentsContainer.appendChild(comment);
}

/**
 * Sets the comment's values in the given eventElement.
 */
function setCommentValues(eventElement, id, text, author) {
  var comment = eventElement.getElementsByClassName('comment-' + id)[0];
  comment.getElementsByClassName('comment')[0].innerText = text;
  comment.getElementsByClassName('fp-username')[0].innerText = author;
}

/**
 * Deletes the comment of the given ID in the given eventElement.
 */
function deleteComment(eventElement, id) {
  var comment = eventElement.getElementsByClassName('comment-' + id)[0];
  comment.parentElement.removeChild(comment);
}

/**
 * Starts listening for new events and populates events lists.
 */
function startDatabaseQueries() {
  // [START my_top_events_query]
  var myUserId = firebase.auth().currentUser.uid;
  var topUserEventsRef = firebase.database().ref('user-events/' + myUserId).orderByChild('starCount');
  // [END my_top_events_query]
  // [START recent_events_query]
  var recentEventsRef = firebase.database().ref('events').limitToLast(100);
  // [END recent_events_query]
  var userEventsRef = firebase.database().ref('user-events/' + myUserId);

  var fetchEvents = function(eventsRef, sectionElement) {
    eventsRef.on('child_added', function(data) {
      var author = data.val().author || 'Anonymous';
      var containerElement = sectionElement.getElementsByClassName('events-container')[0];
      containerElement.insertBefore(
          createEventElement(data.key, data.val().eventName, data.val().eventType, data.val().eventHost, data.val().eventStartDate, data.val().eventStartTime, data.val().eventEndDate, data.val().eventEndTime, data.val().eventLocation, data.val().eventGuests, data.val().eventMessage, author, data.val().uid, data.val().authorPic),
          containerElement.firstChild);
    });
  };

  // Fetching and displaying all events of each sections.
  fetchEvents(topUserEventsRef, topUserEventsSection);
  fetchEvents(recentEventsRef, recentEventsSection);
  fetchEvents(userEventsRef, userEventsSection);

  // Keep track of all Firebase refs we are listening to.
  listeningFirebaseRefs.push(topUserEventsRef);
  listeningFirebaseRefs.push(recentEventsRef);
  listeningFirebaseRefs.push(userEventsRef);
}

/**
 * Writes the user's data to the database.
 */
// [START basic_write]
function writeUserData(userId, name, email, imageUrl) {
  firebase.database().ref('users/' + userId).set({
    username: name,
    email: email,
    profile_picture : imageUrl
  });
}
// [END basic_write]

/**
 * Cleanups the UI and removes all Firebase listeners.
 */
function cleanupUi() {
  // Remove all previously displayed events.
  topUserEventsSection.getElementsByClassName('events-container')[0].innerHTML = '';
  recentEventsSection.getElementsByClassName('events-container')[0].innerHTML = '';
  userEventsSection.getElementsByClassName('events-container')[0].innerHTML = '';

  // Stop all currently listening Firebase listeners.
  listeningFirebaseRefs.forEach(function(ref) {
    ref.off();
  });
  listeningFirebaseRefs = [];
}

/**
 * Triggers every time there is a change in the Firebase auth state (i.e. user signed-in or user signed out).
 */
function onAuthStateChanged(user) {
  cleanupUi();
  if (user) {
    splashPage.style.display = 'none';
    writeUserData(user.uid, user.displayName, user.email, user.photoURL);
    startDatabaseQueries();
  } else {
    // Display the splash page where you can sign-in.
    splashPage.style.display = '';
  }
}

/**
 * Creates a new event for the current user.
 */
function newEventForCurrentUser(eventName, eventType, eventHost, eventStartDate, eventStartTime, eventEndDate, eventEndTime, eventLocation, eventGuests, eventMessage) {
  // [START single_value_read]
  var userId = firebase.auth().currentUser.uid;
  return firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
    var username = snapshot.val().email;
    // [START_EXCLUDE]
    return writeNewEvent(firebase.auth().currentUser.uid, username, firebase.auth().currentUser.photoURL, eventName, eventType, eventHost, eventStartDate, eventStartTime, eventEndDate, eventEndTime, eventLocation, eventGuests, eventMessage);
    // [END_EXCLUDE]
  // [END single_value_read]
  });
}

/**
 * Displays the given section element and changes styling of the given button.
 */
function showSection(sectionElement, buttonElement) {
  recentEventsSection.style.display = 'none';
  userEventsSection.style.display = 'none';
  topUserEventsSection.style.display = 'none';
  addEvent.style.display = 'none';
  recentMenuButton.classList.remove('is-active');
  myEventsMenuButton.classList.remove('is-active');
  myTopEventsMenuButton.classList.remove('is-active');

  if (sectionElement) {
    sectionElement.style.display = 'block';
  }
  if (buttonElement) {
    buttonElement.classList.add('is-active');
  }
}

// Bindings on load.
window.addEventListener('load', function() {
  // Bind Sign in button.
  signInButton.addEventListener('click', function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
  });

  // Bind Sign out button.
  signOutButton.addEventListener('click', function() {
    firebase.auth().signOut();
  });

  // Listen for auth state changes
  firebase.auth().onAuthStateChanged(onAuthStateChanged);

  // Saves message on form submit.
  eventForm.onsubmit = function(e) {
    e.preventDefault();
    var eventName = eventNameInput.value;
    var eventType = eventTypeInput.value;
    var eventHost = eventHostInput.value;
    var eventStartDate = eventStartDateInput.value;
    var eventStartTime = eventStartTimeInput.value;
    var eventEndDate = eventEndDateInput.value;
    var eventEndTime = eventEndTimeInput.value;
    var eventLocation = eventLocationInput.value;
    var eventGuests = eventGuestsInput.value;
    var eventMessage = eventMessageInput.value;

    // Reset the event form to show
    // first section of the form
    //eventForm.style.display = 'none';
    eventFormStep4.style.display = 'none';
    eventFormStep1.style.display = 'block';

    if (eventName && eventType) {
      newEventForCurrentUser(eventName, eventType, eventHost, eventStartDate, eventStartTime, eventEndDate, eventEndTime, eventLocation, eventGuests, eventMessage).then(function() {
        myEventsMenuButton.click();
      });
      eventNameInput.value = '';
      eventTypeInput.value = '';
      eventHostInput.value = '';
      eventStartDateInput.value = '';
      eventStartTimeInput.value = '';
      eventEndDateInput.value = '';
      eventEndTimeInput.value = '';
      eventLocationInput.value = '';
      eventGuestsInput.value = '';
      eventMessageInput.value = '';

    }
  };

  // Bind menu buttons.
  recentMenuButton.onclick = function() {
    showSection(recentEventsSection, recentMenuButton);
  };
  myEventsMenuButton.onclick = function() {
    showSection(userEventsSection, myEventsMenuButton);
  };
  myTopEventsMenuButton.onclick = function() {
    showSection(topUserEventsSection, myTopEventsMenuButton);
  };
  addButton.onclick = function() {
    showSection(addEvent);
    eventMessageInput.value = '';
    eventNameInput.value = '';
  };
  recentMenuButton.onclick();
}, false);
