import React from "react";
import PropagateLoader from "react-spinners/PropagateLoader";
import { useSelf } from "../context/UserContext";

const WaitingRoom: React.FC<unknown> = () => {
  const { __self } = useSelf();

  return (
    <div className="container waiting">
      <p className="waiting--me">Connected as {__self.selfCharacter}</p>
      <img
        src={`avatars/${__self.selfCharacter}.png`}
        className="waiting--img"
        alt="profile"
      />
      <p className="mt-4 text-secondary">
        Please wait for another craftsman join
      </p>
      <PropagateLoader size={15} color={"#36d7b7"} />
    </div>
  );
};

export default WaitingRoom;
