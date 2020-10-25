import React, { useState, useRef, useEffect } from "react";
import app from "firebase/app";

import { useSelf } from "../context/UserContext";
import { generateChannelId } from "../utils/helper";

interface Message {
  text: string;
  sender: string;
}

const ChatRoom: React.FC<unknown> = () => {
  const { __self, setSelfData } = useSelf();
  // @msgList : list of the whole messages of this chat
  // @msg : message to be sent on the form
  const [msgList, setMsgList] = useState<Array<Message>>([]);
  const [msg, setMsg] = useState<string>("");

  // to scroll bottom of the page
  const dummy = useRef<HTMLElement>(null!);

  const messageCollections: any = app.firestore().collection("messages");

  useEffect(() => {
    if (!__self.channel) return;
    setMsgList([]);
    // attach message snapshot change listener
    const unsubscribe = messageCollections
      .doc(__self.channel)
      .onSnapshot((doc: any) => {
        if (doc.empty) return;
        const newValue = doc.data();
        if (!newValue) return;

        if (newValue.users === 2) {
          // New message
          setMsgList(newValue.messages);
          dummy.current.scrollIntoView({ behavior: "smooth" });
        } else {
          // Partner left the chat
          setSelfData({ ...__self, partnerStatus: "Inactive" });
        }
      });
    return () => unsubscribe();
  }, [__self.channel]);

  const sendMessage = async (e: any) => {
    e.preventDefault();

    messageCollections
      .doc(__self.channel)
      .get()
      .then((doc: any) => {
        if (doc.empty) return;
        let channel = doc.data();

        channel.messages.push({
          sender: __self.selfId,
          text: msg,
        });
        messageCollections.doc(__self.channel).update(channel);
        setMsg("");
      });
  };

  const findNextPartner = () => {
    const userCollections = app.firestore().collection("users");

    if (__self.partnerStatus === "Inactive") {
      // Both users left the chat, remove the message history from firestore
      messageCollections.doc(__self.channel).delete();
    } else {
      messageCollections.doc(__self.channel).update({ users: 1 });
    }

    userCollections
      .where("pid", "==", "")
      .where("name", "!=", __self.selfCharacter)
      .get()
      .then((data: any) => {
        let docs = data.docs.filter((doc: any) => doc.id !== __self.partnerId);
        if (!!docs && docs.length) {
          userCollections.doc(docs[0].id).update({ pid: __self.selfId });
          userCollections.doc(__self.selfId).update({
            pid: docs[0].id,
          });

          const channelId = generateChannelId(__self.selfId, docs[0].id);

          messageCollections.doc(channelId).set({
            users: 2,
            messages: [],
          });

          setSelfData({
            ...__self,
            channel: channelId,
            partnerName: docs[0].data().name,
            partnerId: docs[0].id,
          });
        } else {
          userCollections.doc(__self.selfId).update({
            pid: "",
          });
          setSelfData({
            ...__self,
            channel: "",
            partnerName: "",
            partnerId: "",
            partnerStatus: "",
          });
        }
      });
  };

  return (
    <div className="chatroom">
      <header className="chat--header">
        <div className="d-flex">
          <img
            src={`avatars/${__self.partnerName}.png`}
            className="chat--profile__img"
            alt="profile"
          />
          <div className="ml-3 d-flex flex-column justify-content-center">
            <p className="chat--profile__name">{__self.partnerName}</p>
            <p className="chat--profile__status">{__self.partnerStatus}</p>
          </div>
        </div>
        <div className="chat--next" onClick={findNextPartner}></div>
      </header>
      <main className="container mt-3">
        <p className="chat--me">Connected as {__self.selfCharacter}i</p>
        <div className="chat--message__container">
          {msgList &&
            msgList.map((msg, idx) => (
              <ChatMessage
                key={idx}
                message={msg}
                me={__self.selfCharacter}
                myId={__self.selfId}
                partner={__self.partnerName}
              />
            ))}
          <span ref={dummy}></span>
        </div>

        <form onSubmit={sendMessage} className="chat--form">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Type your message here"
          />
          <button type="submit" disabled={!msg}></button>
        </form>
      </main>
    </div>
  );
};

interface IChatMessage {
  message: Message;
  me: string;
  partner: string;
  myId: string;
}
const ChatMessage: React.FC<IChatMessage> = (props: IChatMessage) => {
  const { sender, text } = props.message;

  const messageClass: String = sender === props.myId ? "sent" : "received";
  const avatar: string =
    sender === props.myId
      ? `avatars/${props.me}.png`
      : `avatars/${props.partner}.png`;
  return (
    <div className={`chat--message chat--message__${messageClass}`}>
      <img src={avatar} alt="profile" />
      <p>{text}</p>
    </div>
  );
};

export default ChatRoom;
