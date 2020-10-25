import React, { createContext, useState, useContext, useEffect } from "react";

type User = {
  selfId: string;
  selfCharacter: string;
  channel: string;
  partnerId: string;
  partnerName: string;
  partnerStatus: string;
};

const userCtxDefaultValue = {
  __self: {
    loading: true,
    selfId: "",
    selfCharacter: "",
    channel: "",
    partnerId: "",
    partnerName: "",
    partnerStatus: "",
  },
  setSelfData: (__self: User) => {},
};

const userContext = createContext(userCtxDefaultValue);

type Props = {
  children: React.ReactNode;
};

const UserProvider = ({ children }: Props) => {
  const [__self, setSelf] = useState(userCtxDefaultValue.__self);

  useEffect(() => {
    let localStorage = window.localStorage.getItem("fire-chat");
    if (typeof localStorage === "string") {
      let prevStates = JSON.parse(localStorage);

      setSelf({
        loading: false,
        selfId: prevStates.selfId,
        selfCharacter: prevStates.selfCharacter,
        channel: prevStates.channel,
        partnerId: prevStates.partnerId,
        partnerName: prevStates.partnerName,
        partnerStatus: prevStates.partnerStatus,
      });
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("fire-chat", JSON.stringify(__self));
  }, [__self]);

  const setSelfData = (data: User) => {
    setSelf({
      loading: false,
      selfId: data.selfId,
      selfCharacter: data.selfCharacter,
      channel: data.channel,
      partnerId: data.partnerId,
      partnerName: data.partnerName,
      partnerStatus: data.partnerStatus,
    });
  };

  return (
    <userContext.Provider value={{ __self, setSelfData }}>
      {children}
    </userContext.Provider>
  );
};

export const useSelf = () => useContext(userContext);
export default UserProvider;
