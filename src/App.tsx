import React, { useEffect } from "react";
import "./App.css";

import ChatRoom from "./components/ChatRoom";
import WaitingRoom from "./components/WaitingRoom";

import firebase from "firebase/app";
import "firebase/firestore";
import { useSelf } from "./context/UserContext";
import {
  generateChannelId,
  generateUserCharacter,
  generateUserID,
} from "./utils/helper";

firebase.initializeApp({
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DB_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
});

const firestore = firebase.firestore();

const userCollections: any = firestore.collection("users");
const messageCollections: any = firestore.collection("messages");

const createUser = (selfCharacter: string, selfId: string) => {
  return new Promise((resolve) => {
    userCollections
      .where("pid", "==", "")
      .where("name", "!=", selfCharacter)
      .limit(1)
      .get()
      .then((data: any) => {
        if (!data.empty) {
          userCollections.doc(data.docs[0].id).update({ pid: selfId });
          userCollections.doc(selfId).set({
            name: selfCharacter,
            pid: data.docs[0].id,
          });

          const channelId = generateChannelId(selfId, data.docs[0].id);
          messageCollections.doc(channelId).set({
            users: 2,
            messages: [],
          });
          resolve({
            selfId: selfId,
            selfCharacter: selfCharacter,
            channel: channelId,
            partnerName: data.docs[0].data().name,
            partnerId: data.docs[0].id,
            partnerStatus: "Active",
          });
        } else {
          userCollections.doc(selfId).set({
            name: selfCharacter,
            pid: "",
          });
          resolve({
            selfId: selfId,
            selfCharacter: selfCharacter,
            channel: "",
            partnerName: "",
            partnerId: "",
          });
        }
      })
      .catch(() => {
        resolve(null);
      });
  });
};

function App() {
  const { __self, setSelfData } = useSelf();

  useEffect(() => {
    let navigation: any = window.performance.getEntriesByType("navigation")[0];

    const selfCharacter: string = !!__self.selfCharacter
      ? __self.selfCharacter
      : generateUserCharacter();
    const selfId: string = !!__self.selfId ? __self.selfId : generateUserID();

    // if not refresh, create a new user
    if (navigation.type !== "reload") {
      var unsubscribeSnapshot: any = null;
      createUser(selfCharacter, selfId).then((user: any) => {
        setSelfData(user);
      });
    }

    // attach snapshot listener to listen the partner change
    unsubscribeSnapshot = userCollections.doc(selfId).onSnapshot((doc: any) => {
      if (doc.empty) return;
      const newValue = doc.data();
      if (!!newValue?.pid && newValue?.pid !== __self.partnerId) {
        const channelId = generateChannelId(newValue.pid, doc.id);
        firestore
          .collection("users")
          .doc(newValue.pid)
          .get()
          .then((doc: any) => {
            setSelfData({
              selfId: selfId,
              selfCharacter: selfCharacter,
              channel: channelId,
              partnerId: newValue.pid,
              partnerName: doc.data().name,
              partnerStatus: "Active",
            });
          });
      }
    });
    // Delete user on browser close, this event is not working properly
    window.addEventListener("beforeunload", (ev) => {
      messageCollections.doc(__self.channel).update({ users: 1 });
      userCollections.doc(__self.selfId).get((doc: any) => doc.delete());
    });

    return () => unsubscribeSnapshot();
  }, []);

  return !__self.partnerId ? <WaitingRoom /> : <ChatRoom />;
}

export default App;
